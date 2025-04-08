import sqlite3
import json
import pandas as pd
import eel
from database_filter_variables import *

@eel.expose
def get_statistical_analysis_data(db_path="../data/incidents.db"):
    """
    Fetches data from 'incidents_fa_values_table' and calculates:
    - PERC SLA MET: Percentage of incidents that met the SLA.
    - AVG TIME TO RESOLVE: Average time taken to resolve incidents.
    - PERC ASSIGNED TO RESOLVED BY: Percentage of incidents where assigned_to equals resolved_by.
    - FALSE POSITIVES: Percentage of incidents where the time between closed_at and opened_at is zero.

    Args:
        db_path (str): Path to the SQLite database file.

    Returns:
        str: JSON formatted string with the calculated statistics.
    """
    try:
        # Connect to the SQLite database
        conn = sqlite3.connect(db_path)
        
        # Fetch selected incident IDs
        incident_ids = get_incident_ids_selection()

        if not incident_ids:
            return json.dumps({"error": "No incidents selected."})

        # Query to get necessary columns from incidents table
        query = f"""
        SELECT incident_id, made_sla, time_to_states_last_occurrence, assigned_to, resolved_by, 
               closed_at, opened_at
        FROM incidents_fa_values_table
        WHERE incident_id IN ({','.join(['?'] * len(incident_ids))})
        """
        
        # Add the 'whatif_analysis' exclusion clause
        whatif_clause = apply_whatif_analysis_filter()
        if whatif_clause:
            query += f" AND ( {whatif_clause} )"

        # Load data into pandas DataFrame
        df = pd.read_sql_query(query, conn, params=incident_ids)
        
        # Calculate PERC SLA MET
        perc_sla_met = df['made_sla'].mean() * 100 

        # Calculate AVG TIME TO RESOLVE
        def extract_ttr(time_to_states):
            if time_to_states:
                time_to_states_dict = json.loads(time_to_states)
                return time_to_states_dict.get("TTR", None)  # Get the TTR value, or None if it doesn't exist
            return None

        df['TTR'] = df['time_to_states_last_occurrence'].apply(extract_ttr)
        avg_time_to_resolve = df['TTR'].mean() if pd.notna(df['TTR']).any() else 0
        
        # Calculate PERC ASSIGNED TO RESOLVED BY
        perc_assigned_to_resolved_by = (df['assigned_to'] == df['resolved_by']).mean() * 100
        
        # Calculate FALSE POSITIVES
        def calculate_false_positive(closed_at, opened_at):
            if closed_at and opened_at:
                return 1 if closed_at == opened_at else 0
            return 0
        
        df['false_positive'] = df.apply(lambda x: calculate_false_positive(x['closed_at'], x['opened_at']), axis=1)
        perc_false_positives = df['false_positive'].mean() * 100
        
        # Create the result dictionary
        result = {
            "perc_sla_met": round(perc_sla_met, 2),
            "avg_time_to_resolve": round(avg_time_to_resolve, 2),
            "perc_assigned_to_resolved_by": round(perc_assigned_to_resolved_by, 2),
            "perc_false_positives": round(perc_false_positives, 2)
        }

        # Return the result as a JSON string
        return json.dumps(result)

    except Exception as e:
        return json.dumps({"error": str(e)})

    finally:
        # Close the database connection
        if conn:
            conn.close()

# Example usage
if __name__ == "__main__":
    data = get_statistical_analysis_data()
    print("statistical_analysis.py")
    print(data)
