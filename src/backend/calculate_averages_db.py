import sqlite3
import eel

from database_filter_variables import *

@eel.expose
def calculate_column_average(column_name, db_path="../data/incidents.db", table_name="incidents_fa_values_table"):
    """
    Calculate the average value of a specified column in a given SQLite database table,
    only for incidents specified by the `get_incident_ids_selection()` function.

    Args:
        column_name (str): The name of the column to calculate the average for.
        db_path (str): Path to the SQLite database file.
        table_name (str): The name of the table in the database.

    Returns:
        float: The average value of the specified column.
        None: If the column does not exist or any error occurs.
    """
    try:
        # Get the list of incident IDs to consider
        incident_ids = get_incident_ids_selection()
        if not incident_ids:
            return 0.000

        # Format incident IDs for SQL query
        formatted_incident_ids = ', '.join(f"'{incident_id}'" for incident_id in incident_ids)

        # Connect to the SQLite database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Check if the specified column exists in the table
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = [info[1] for info in cursor.fetchall()]
        
        if column_name not in columns:
            raise ValueError(f"The column '{column_name}' does not exist in the table '{table_name}'.")

        # Calculate the average value of the specified column for the selected incidents
        query = f"""
        SELECT AVG({column_name}) 
        FROM {table_name}
        WHERE incident_id IN ({formatted_incident_ids})
        """

        # Add the 'whatif_analysis' exclusion clause
        whatif_clause = apply_whatif_analysis_filter()
        if whatif_clause:
            query += f" AND ( {whatif_clause} )"

        cursor.execute(query)
        average_value = cursor.fetchone()[0]

        # Close the connection
        cursor.close()
        conn.close()

        return average_value

    except sqlite3.Error as e:
        print(f"An error occurred with the database: {e}")
        return None
    except Exception as e:
        print(f"An error occurred: {e}")
        return None

# Example usage
if __name__ == "__main__":
    column_name = "cost"  # Replace with the desired column name
    average_value = calculate_column_average(column_name)
    
    if average_value is not None:
        print(f"The average value of '{column_name}' for the selected incidents is: {average_value}")
    else:
        print(f"Could not calculate the average value for '{column_name}'.")
