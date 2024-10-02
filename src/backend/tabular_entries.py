import sqlite3
import pandas as pd
import json
from database_filter_variables import *
import eel
import ast

def build_filter_query(filters):
    """
    Builds a SQL filter query based on the provided filters dictionary.
    
    Args:
        filters (dict): The filters dictionary returned from get_filter_value().

    Returns:
        str: A SQL query fragment representing the active filters.
    """
    # Initialize an empty list to hold all filter conditions
    conditions = []

    filters = filters.get('filters', {})

    # Handle compliance bar filters (severity levels)
    compliance_bar_filters = filters.get('overview_metrics', {}).get('compliance_bar', {})
    severity_levels = filters.get('thresholds', {}).get('compliance_metric_severity_levels', {})
    compliance_conditions = []

    compliance_metric = filters.get('compliance_metric', '')
    print(compliance_bar_filters)
    for level, is_active in compliance_bar_filters.items():
        if is_active:
            threshold = severity_levels.get(level)
            if threshold:
                # Correct the SQL syntax by repeating the compliance_metric for both conditions
                min_condition, max_condition = threshold.split('AND')
                min_condition = min_condition.strip()
                max_condition = max_condition.strip()

                # If compliance_metric is not present, add it to both conditions
                if compliance_metric not in min_condition:
                    min_condition = f"{compliance_metric} {min_condition}"
                if compliance_metric not in max_condition:
                    max_condition = f"{compliance_metric} {max_condition}"

                compliance_conditions.append(f"({min_condition} AND {max_condition})")
    
    if compliance_conditions:
        conditions.append(f"({' OR '.join(compliance_conditions)})")

    # Handle statistical analysis filters
    statistical_analysis_filters = filters.get('statistical_analysis', {})
    for field, value in statistical_analysis_filters.items():
        if value is not None:
            if field == 'perc_sla_met':
                if value:
                    conditions.append("made_sla = 1")
                else:
                    conditions.append("made_sla = 0")
            elif field == 'perc_assigned_to_resolved_by':
                if value:
                    conditions.append("assigned_to = resolved_by")
                else:
                    conditions.append("assigned_to != resolved_by")
            elif field == 'perc_false_positives':
                if value:
                    conditions.append("opened_at = closed_at")
                else:
                    conditions.append("opened_at != closed_at")

   # Handle common variants filters
    common_variants_filters = filters.get('common_variants', {})
    if common_variants_filters:  # Check if it's not None and not empty
        variant_values = ', '.join(f"'{variant}'" for variant in common_variants_filters)
        conditions.append(f"variant IN ({variant_values})")

    # Handle deviation filters
    deviation_filters = filters.get('deviations_distribution', {})
    for deviation_type, states in deviation_filters.items():
        if states:  # Check if it's not None and not empty
            deviation_column = f"{deviation_type}_deviation"
            for state in states:
                # Build condition to check if the value for a state is not zero
                conditions.append(f"CAST(json_extract({deviation_column}, '$.{state}') AS INTEGER) > 0")

    # Handle technical analysis filters
    technical_analysis_filters = filters.get('technical_analysis', {})
    for field, values in technical_analysis_filters.items():
        # Only add the filter if values is not empty or False
        if values and values is not False:
            # Extract the numeric part for comparison
            # Using SQLite syntax for substr and instr to extract the numeric part before ' - '
            values_list = ', '.join(str(v) for v in values)
            conditions.append(f"CAST(substr({field}, 1, instr({field}, ' ') - 1) AS INTEGER) IN ({values_list})")

    # Handle date range filters
    date_range = filters.get('overview_metrics', {}).get('date_range', {})
    if date_range.get('min_date') and date_range.get('max_date'):
        conditions.append(f"closed_at BETWEEN '{date_range['min_date']}' AND '{date_range['max_date']}'")

    print(' AND '.join(conditions))
    # Join all conditions with AND
    return ' AND '.join(conditions)

@eel.expose
def get_tabular_incidents_entries(db_path="../data/incidents.db"):
    """
    Queries the incident_alignment_table for selected incident IDs and the specified compliance metric,
    applying any active filters.

    Args:
        db_path (str): Path to the SQLite database file.

    Returns:
        str: A JSON string containing the incident_id and compliance_metric columns.
    """
    try:
        # Connect to the SQLite database
        conn = sqlite3.connect(db_path)
        
        # Get all the filters
        filters = get_filter_value()

        # Format the incident IDs for SQL query
        formatted_incident_ids = ', '.join(f"'{incident_id}'" for incident_id in get_incident_ids_selection())
        compliance_metric = get_incident_compliance_metric()

        # Build the base SQL query to select the desired columns
        query = f"""
        SELECT incident_id, {compliance_metric}, opened_at, closed_at, impact, urgency, priority, made_sla, assigned_to, resolved_by, category, location, u_symptom, variant, missing_deviation, repetition_deviation, mismatch_deviation
        FROM incidents_fa_values_table
        WHERE incident_id IN ({formatted_incident_ids})
        """

        # Add the dynamically constructed filter conditions
        filter_clause = build_filter_query(filters)
        if filter_clause:
            query += f" AND ( {filter_clause} )"

        # Execute the query and load the result into a DataFrame
        df = pd.read_sql_query(query, conn)

        # Convert the DataFrame to a JSON string
        json_result = df.to_json(orient='records')

        return json_result

    except Exception as e:
        print(f"An error occurred: {e}")
        return json.dumps([])  # Return an empty JSON array on error
    
    finally:
        # Close the database connection
        conn.close()

# Example usage
if __name__ == "__main__":
    # Query the incident compliance data and print the JSON result
    filters = get_filter_value()
    print(build_filter_query(filters))
