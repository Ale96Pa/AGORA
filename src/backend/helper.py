import sqlite3

def update_incidents_with_opened_at(db_path="../data/incidents.db"):
    """
    Update the incidents_fa_values_table with the earliest opened_at value from the event_log_table.
    """
    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Fetch the earliest opened_at time for each incident_id from event_log_table
        cursor.execute("""
            SELECT incident_id, MIN(opened_at) AS earliest_opened_at
            FROM event_log_table
            GROUP BY incident_id
        """)
        incident_opened_times = cursor.fetchall()

        # Update the incidents_fa_values_table with the earliest opened_at time
        for incident_id, earliest_opened_at in incident_opened_times:
            cursor.execute("""
                UPDATE incidents_fa_values_table
                SET opened_at = ?
                WHERE incident_id = ?
            """, (earliest_opened_at, incident_id))

        # Commit the changes and close the connection
        conn.commit()
        cursor.close()
        conn.close()

        print("Opened_at values successfully updated in incidents_fa_values_table.")

    except Exception as e:
        print(f"An error occurred: {e}")

# Example usage
if __name__ == "__main__":
    update_incidents_with_opened_at()
