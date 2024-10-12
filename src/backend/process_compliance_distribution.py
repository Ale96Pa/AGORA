import sqlite3
import json
from database_filter_variables import *
import eel

@eel.expose
def get_compliance_metric_distribution(db_path="../data/incidents.db"):
    """
    Get the distribution of a compliance metric from the incidents_fa_values_table.
    Returns the distribution data in a JSON format suitable for a violin plot.
    """
    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        metric_column = get_incident_compliance_metric()

        # Get the selected incident IDs
        incident_ids = get_incident_ids_selection()

        # Convert incident_ids list to a format suitable for the SQL query
        incident_ids_placeholder = ",".join("?" * len(incident_ids))

        # Fetch the desired compliance metric values for the selected incidents
        query = f"""SELECT incident_id, {metric_column} FROM incidents_fa_values_table WHERE incident_id IN ({incident_ids_placeholder})"""

        # Add the 'whatif_analysis' exclusion clause
        whatif_clause = apply_whatif_analysis_filter()
        if whatif_clause:
            query += f" AND ( {whatif_clause} )"


        cursor.execute(query, incident_ids)
        metric_values = cursor.fetchall()

        # Close the connection
        cursor.close()
        conn.close()

        if not metric_values:
            return json.dumps([])  # Return an empty list if no data is found

        # Prepare the data for the violin plot
        distribution_data = []
        for incident in metric_values:
            incident_id, value = incident
            if value is not None:
                distribution_data.append({
                    "incident_id": incident_id,
                    "value": value
                })

        # Convert the distribution data to JSON format
        distribution_json = json.dumps(distribution_data)

        return distribution_json

    except Exception as e:
        print(f"An error occurred: {e}")
        return json.dumps([])

# Example usage
if __name__ == "__main__":
    distribution_json = get_compliance_metric_distribution()
    print(distribution_json)
