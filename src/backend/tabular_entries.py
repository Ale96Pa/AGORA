import sqlite3
import pandas as pd
import json
from database_filter_variables import *
import eel

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
        
        # Format the incident IDs for SQL query
        formatted_incident_ids = ', '.join(f"'{incident_id}'" for incident_id in get_incident_ids_selection())
        compliance_metric = get_incident_compliance_metric()

        # Build the base SQL query to select the desired columns
        query = f"""
        SELECT incident_id, {compliance_metric}, opened_at, closed_at
        FROM incidents_fa_values_table
        WHERE incident_id IN ({formatted_incident_ids})
        """

        # Add any additional filters from the global filter_compliance_metric_thresholds
        filter_clause = build_filter_query()
        if filter_clause:
            query += f" AND ( {filter_clause} )"  # Adding filter, removing redundant "WHERE" from build_filter_query()

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
    compliance_json = get_tabular_incidents_entries()
    print(compliance_json)
