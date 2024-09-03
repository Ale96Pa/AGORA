import sqlite3
import json
from database_filter_variables import *
import eel

@eel.expose
def get_ordered_time_to_states_last_occurrence(db_name='../data/incidents.db'):
    """
    Fetches and returns the time to last occurrence of states for each incident in a structured format.
    The data is returned in a list of dictionaries, each containing:
    - incident_id: The ID of the incident
    - closed_at: The date and time when the incident was closed
    - time_to_states: A dictionary where keys are state codes and values are times in minutes
    """
    conn = sqlite3.connect(db_name)
    cursor = conn.cursor()

    try:
        # Get the list of incident IDs from get_incident_ids_selection
        incident_ids = get_incident_ids_selection()

        # Create a placeholder string for the incident_ids list for the SQL query
        placeholder = ', '.join('?' for _ in incident_ids)

        # Query to select the incidents, filter by selected incident IDs, and order by closed_at
        cursor.execute(f'''
            SELECT incident_id, closed_at, time_to_states_last_occurrence
            FROM incidents_fa_values_table
            WHERE incident_id IN ({placeholder})
            ORDER BY closed_at ASC
        ''', incident_ids)

        # Fetch all the results
        incidents = cursor.fetchall()

        # Process each incident to return in the desired format
        result = []
        for incident in incidents:
            incident_id = incident[0]
            closed_at = incident[1]
            time_to_states = json.loads(incident[2])  # Assuming time_to_states_last_occurrence is stored as a JSON string
            result.append({
                'incident_id': incident_id,
                'closed_at': closed_at,
                'time_to_states': time_to_states
            })

        return result

    except sqlite3.Error as e:
        print(f"An error occurred: {e}")
        return None
    
    finally:
        # Close the connection
        conn.close()


def main():
    
    ordered_incidents = get_ordered_time_to_states_last_occurrence()

    if ordered_incidents:
        print("Ordered Incidents:")
        for incident in ordered_incidents:
            print(f"ID: {incident['incident_id']}, Closed At: {incident['closed_at']}, Time to States: {incident['time_to_states']}")

    print(ordered_incidents)

if __name__ == "__main__":
    main()
