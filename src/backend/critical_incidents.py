import sqlite3
import pandas as pd
import json
import eel
from database_filter_variables import *
@eel.expose
def get_critical_incidents(db_path="../data/incidents.db"):
    """
    Queries the incident_alignment_table for incidents that fall into the critical range
    based on a compliance metric and returns them.

    Args:
        db_path (str): Path to the SQLite database file.

    Returns:
        str: A JSON string containing the most critical incidents based on the compliance metric.
    """
    try:
        # Connect to the SQLite database
        conn = sqlite3.connect(db_path)

        # Get the compliance metric column from the function
        compliance_metric = get_incident_compliance_metric()

        # Fetch the thresholds for the compliance metric
        thresholds = json.loads(get_compliance_metric_thresholds())

        # Get selected incident IDs
        formatted_incident_ids = ', '.join(f"'{incident_id}'" for incident_id in get_incident_ids_selection())


        # Define critical thresholds based on the compliance metric
        if compliance_metric == 'fitness':
            # For fitness, use the "critical" range from the threshold JSON
            critical_min = thresholds['critical'][0]  # 0
            critical_max = thresholds['critical'][1]  # 0.25
            sort_order = 'ASC'  # Lower values for fitness are more critical
        elif compliance_metric == 'costTotal':
            # For costTotal, use the "low" range as the critical range
            critical_min = thresholds['low'][0]  # 0.75
            critical_max = thresholds['low'][1]  # 1
            sort_order = 'DESC'  # Higher values for costTotal are more critical
        else:
            raise ValueError(f"Unknown compliance metric: {compliance_metric}")

        # Build the SQL query to get incidents that fall in the critical range
        query = f"""
            SELECT incident_id, {compliance_metric}
            FROM incident_alignment_table
            WHERE incident_id IN ({formatted_incident_ids})
            AND {compliance_metric} BETWEEN {critical_min} AND {critical_max}
        """

        # Add the 'whatif_analysis' exclusion clause if applicable
        whatif_clause = apply_whatif_analysis_filter()
        if whatif_clause:
            query += f" AND ({whatif_clause})"

        # Add the ORDER BY clause
        query += f" ORDER BY {compliance_metric} {sort_order}"

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
    critical_incidents_json = get_critical_incidents()
    print(critical_incidents_json)
