import sqlite3
import eel
from database_filter_variables import *

@eel.expose
def insert_assessment_result(name, entry_type, incident_ids_list, db_path = "../data/security_controls.db"):
    """
    Inserts a new record into the assessment_results table.
    
    Parameters:
    db_path (str): Path to the SQLite database.
    entry_type (str): The type of the assessment result ('finding', 'area of concern', 'non-conformaty').
    incident_ids_list (str): A comma-separated string of incident IDs.
    """

    print(name)
    print(entry_type)
    print(incident_ids_list)
    try:
        # Check if the entry_type is valid
        if entry_type not in ('finding', 'area of concern', 'non-conformaty'):
            raise ValueError("Invalid entry type. Must be one of: 'finding', 'area of concern', 'non-conformaty'.")

        # Connect to the SQLite database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Insert the record into the assessment_results table
        cursor.execute("""
            INSERT INTO assessment_results (name, type, incident_ids_list) 
            VALUES (?, ?, ?)
        """, (name, entry_type, incident_ids_list))

        # Commit the transaction and close the connection
        conn.commit()
        cursor.close()
        conn.close()

        print(f"Successfully inserted {entry_type} with name {name} and incident IDs: {incident_ids_list}")

    except Exception as e:
        print(f"An error occurred: {e}")

@eel.expose
def get_all_assessment_ids_and_names(db_path="../data/security_controls.db"):
    """
    Queries the assessment_results table and returns a list of all assessment ids and names.
    
    Parameters:
    db_path (str): Path to the SQLite database.
    
    Returns:
    list: A list of dictionaries with 'id' and 'name' keys for each assessment result.
    """
    try:
        # Connect to the SQLite database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Query to fetch all ids and names from the assessment_results table
        cursor.execute("SELECT id, name FROM assessment_results")
        results = cursor.fetchall()

        # Close the cursor and connection
        cursor.close()
        conn.close()

        # Extract the ids and names from the results
        assessment_list = [{"id": row[0], "name": row[1]} for row in results]

        return assessment_list

    except Exception as e:
        print(f"An error occurred: {e}")
        return []      

@eel.expose
def apply_what_if_analysis(assessment_id, db_path="../data/security_controls.db"):
    """
    Fetches the incident_ids_list for a given assessment ID and appends it to the 'filters.whatif_analysis' key
    via the set_filter_value function.
    
    Parameters:
    assessment_id (int): The ID of the assessment result to query.
    db_path (str): Path to the SQLite database.
    
    Returns:
    str: Success message or error.
    """
    try:
        # Connect to the SQLite database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Query to fetch the incident_ids_list for the given assessment ID
        cursor.execute("SELECT incident_ids_list FROM assessment_results WHERE id = ?", (assessment_id,))
        result = cursor.fetchone()

        if result is None:
            raise ValueError(f"No assessment found with ID {assessment_id}")

        incident_ids_list = result[0]
        incident_ids_array = incident_ids_list.split(",")  # Convert comma-separated string to a list

        # Set the filter value using the set_filter_value function
        set_filter_value("filters.whatIf_analysis", incident_ids_array)

        # Close the cursor and connection
        cursor.close()
        conn.close()

        return f"Successfully applied what-if analysis for assessment ID {assessment_id}"

    except Exception as e:
        print(f"An error occurred: {e}")
        return str(e)
    
# Example usage:
if __name__ == "__main__":
    # Provide your database path and parameters
    db_path = "../data/incidents.db"  # Adjust the path to your SQLite database
    entry_type = "finding"  # Options: 'finding', 'area of concern', 'non-conformaty'
    incident_ids_list = "INC0012345,INC0012346,INC0012347"  # Example list of incident IDs

    insert_assessment_result(name, entry_type, incident_ids_list)
