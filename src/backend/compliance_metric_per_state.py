import sqlite3
import pandas as pd
import json
import eel
from database_filter_variables import get_filter_value

# Function to count deviations from JSON-like strings
def count_deviations(deviation_str):
    """
    Converts the JSON-like string to a dictionary and returns the deviation counts per state.
    """
    if deviation_str:
        # Convert single quotes to double for JSON compatibility
        deviation_dict = json.loads(deviation_str.replace("'", '"'))  
        return deviation_dict
    return {}

@eel.expose
def get_compliance_per_state_per_incident(db_path="../data/incidents.db"):
    """
    Retrieves the compliance per state for all incidents within the specified date range, 
    aggregating missing, repetition, and mismatch deviations.

    Args:
        db_path (str): Path to the SQLite database file.

    Returns:
        str: A JSON string containing compliance per state for each incident within the date range.
    """
    try:
        # Connect to the SQLite database
        conn = sqlite3.connect(db_path)

        # Get filters from the global filter variables
        filters = get_filter_value()
        date_range = filters.get('filters', {}).get('overview_metrics', {}).get('date_range', {})
        
        if not date_range.get('min_date') or not date_range.get('max_date'):
            return json.dumps({'error': 'Date range not specified'})

        # Extract min and max dates from the filters
        min_date = date_range['min_date']
        max_date = date_range['max_date']

        # Query to fetch incidents within the date range
        query = """
        SELECT 
            incident_id,
            fitness,
            missing_deviation,
            repetition_deviation,
            mismatch_deviation,
            closed_at
        FROM incidents_fa_values_table 
        WHERE closed_at BETWEEN ? AND ?
        ORDER BY closed_at ASC
        """

        # Load data into a DataFrame
        df = pd.read_sql_query(query, conn, params=(min_date, max_date))

        if df.empty:
            return json.dumps({'error': 'No incidents found within the specified date range'})

        # Initialize a list to hold the results for each incident
        results = []

        # Iterate through each incident to calculate compliance per state
        for _, row in df.iterrows():
            # Initialize a dictionary to hold the aggregated deviations per state for the current incident
            total_deviations_per_state = {}

            # Store the fitness value
            fitness = round(row['fitness'], 2)  # Round fitness to 2 decimal places

            # Aggregate deviations from missing, repetition, and mismatch deviations
            missing_deviations = count_deviations(row['missing_deviation'])
            repetition_deviations = count_deviations(row['repetition_deviation'])
            mismatch_deviations = count_deviations(row['mismatch_deviation'])

            # Sum up all deviations per state
            for state, count in missing_deviations.items():
                total_deviations_per_state[state] = total_deviations_per_state.get(state, 0) + count

            for state, count in repetition_deviations.items():
                total_deviations_per_state[state] = total_deviations_per_state.get(state, 0) + count

            for state, count in mismatch_deviations.items():
                total_deviations_per_state[state] = total_deviations_per_state.get(state, 0) + count

            # Calculate the total number of deviations across all states
            total_deviations = sum(total_deviations_per_state.values())

            # Calculate compliance per state
            compliance_per_state = calculate_compliance_per_state(total_deviations_per_state, total_deviations)

            # Prepare the result dictionary for the current incident
            incident_result = {
                'incident_id': row['incident_id'],
                'fitness': fitness,
                'closed_at': row['closed_at'],
                'total_deviations_per_state': {state: round(count, 2) for state, count in total_deviations_per_state.items()},
                'total_deviations': round(total_deviations, 2),
                'compliance_per_state': {state: round(score, 2) for state, score in compliance_per_state.items()}
            }

            # Append the result for the current incident to the results list
            results.append(incident_result)

        return json.dumps(results)

    except Exception as e:
        print(f"An error occurred: {e}")
        return json.dumps({'error': str(e)})

    finally:
        # Close the database connection
        if conn:
            conn.close()

def calculate_compliance_per_state(deviations_per_state, total_deviations):
    """
    Calculates the compliance score per state based on the total deviations.

    Args:
        deviations_per_state (dict): Dictionary with the total deviations per state.
        total_deviations (int): Total number of deviations across all states.

    Returns:
        dict: A dictionary with the compliance score per state.
    """
    compliance_scores = {}
    total_compliance = 0

    # Calculate compliance score for each state
    for state, deviations in deviations_per_state.items():
        # Compliance calculation: 1/5 * (1 - (total_deviations_state / total_deviations))
        compliance_score = 0.2 * (1 - (deviations / total_deviations))  if total_deviations != 0 else 0.2
        print(compliance_score)
        compliance_scores[state] = compliance_score
        total_compliance += compliance_score

    # Calculate normalization factor
    normalization_factor = 1 / total_compliance if total_compliance != 0 else 0

    # Normalize compliance scores
    for state in compliance_scores:
        compliance_scores[state] *= normalization_factor
    print(compliance_scores)
    return compliance_scores

@eel.expose
def get_average_compliance_per_state(db_path="../data/incidents.db"):
    """
    Retrieves the average compliance per state across all incidents within the specified date range.

    Args:
        db_path (str): Path to the SQLite database file.

    Returns:
        str: A JSON string containing the average compliance per state.
    """
    try:
        # Get compliance data for each incident
        compliance_data = json.loads(get_compliance_per_state_per_incident(db_path))

        if 'error' in compliance_data:
            return json.dumps({'error': compliance_data['error']})

        # Initialize a dictionary to sum compliance scores per state
        compliance_sum_per_state = {}
        incident_count = 0

        # Iterate through each incident's compliance data
        for incident in compliance_data:
            incident_count += 1
            for state, compliance in incident['compliance_per_state'].items():
                compliance_sum_per_state[state] = compliance_sum_per_state.get(state, 0) + compliance

        # Calculate the average compliance per state
        average_compliance_per_state = {state: round(compliance_sum / incident_count, 2)
                                        for state, compliance_sum in compliance_sum_per_state.items()}

        return json.dumps(average_compliance_per_state)

    except Exception as e:
        print(f"An error occurred: {e}")
        return json.dumps({'error': str(e)})
    
# Example usage
if __name__ == "__main__":
    # Example call to the exposed function
    print(get_average_compliance_per_state())
