import sqlite3
import json
import re  # To handle extracting numbers from string
import eel
from database_filter_variables import *

def extract_numeric_value(value):
    """
    Extracts the first numeric value from a string.
    If the value is already an integer, it returns it as is.
    If no numeric value is found, returns None.
    """
    if isinstance(value, int):
        return value
    elif isinstance(value, str):
        match = re.search(r'\d+', value)  # Find the first numeric value in the string
        return int(match.group()) if match else None
    return None

@eel.expose
def get_incident_technical_attributes(db_path="../data/incidents.db"):
    """
    Fetches selected incidents from 'incident_ids_from_tabular_selection',
    queries the 'incidents_fa_values_table' to retrieve specified attributes,
    and formats them into a list of dictionaries, removing all non-numeric text from the attribute values.

    Args:
        db_path (str): Path to the SQLite database file.

    Returns:
        list: A list of dictionaries containing the selected incidents' attributes.
    """
    try:
        # Connect to the SQLite database
        conn = sqlite3.connect(db_path)

        # Fetch the selected incident IDs
        incident_ids = get_incident_ids_selection()  # Directly use the list

        if not incident_ids:
            return {"error": "No incidents selected."}

        # Query to get the desired columns from the incidents_fa_values_table
        query = f"""
        SELECT incident_id, u_symptom, impact, urgency, priority, location, category
        FROM incidents_fa_values_table
        WHERE incident_id IN ({','.join(['?'] * len(incident_ids))})
        """

        # Add the 'whatif_analysis' exclusion clause
        whatif_clause = apply_whatif_analysis_filter()
        if whatif_clause:
            query += f" AND ( {whatif_clause} )"

        # Execute the query
        cursor = conn.cursor()
        cursor.execute(query, incident_ids)
        rows = cursor.fetchall()

        # Format the result into a list of dictionaries
        traces = []
        for row in rows:
            traces.append({
                "symptom": extract_numeric_value(row[1]),
                "impact": extract_numeric_value(row[2]),
                "urgency": extract_numeric_value(row[3]),
                "priority": extract_numeric_value(row[4]),
                "location": extract_numeric_value(row[5]),
                "category": extract_numeric_value(row[6])
            })

        # Return the result as a list of dictionaries
        return traces

    except Exception as e:
        return {"error": str(e)}

    finally:
        # Close the database connection
        if conn:
            conn.close()

# Example usage
if __name__ == "__main__":
    result = get_incident_technical_attributes()
    print("technical_analysis.py")
    print(result)
