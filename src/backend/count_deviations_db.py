import pandas as pd
import sqlite3
import ast
import eel
import json

from database_filter_variables import *


def parse_dict_column(column):
    """
    Convert string representation of dictionary to an actual dictionary.
    """
    return column.apply(lambda x: ast.literal_eval(x))

@eel.expose
def count_frequencies():
    """
    Count frequencies of states in missing, repetition, and mismatch columns from a database,
    only for the incidents specified in `incident_ids_from_time_period`.
    """
    db_path = "../data/incidents.db"
    conn = sqlite3.connect(db_path)
    try:
        # Prepare the incident IDs for SQL query
        formatted_incident_ids = ', '.join(f"'{incident_id}'" for incident_id in get_incident_ids_selection())

        # Query the necessary data from the database
        query = f"""
        SELECT missing, repetition, mismatch 
        FROM incident_alignment_table 
        WHERE incident_id IN ({formatted_incident_ids})
        """

        # Add the 'whatif_analysis' exclusion clause
        whatif_clause = apply_whatif_analysis_filter()
        if whatif_clause:
            query += f" AND ( {whatif_clause} )"

        df = pd.read_sql_query(query, conn)

        # Initialize counters
        frequencies = {
            'missing': {'N': 0, 'A': 0, 'R': 0, 'C': 0, 'W': 0},
            'repetition': {'N': 0, 'A': 0, 'R': 0, 'C': 0, 'W': 0},
            'mismatch': {'N': 0, 'A': 0, 'R': 0, 'C': 0, 'W': 0}
        }

        # Sum up the counts for each state in each column
        for column in ['missing', 'repetition', 'mismatch']:
            parsed_column = parse_dict_column(df[column])
            for state in frequencies[column].keys():
                frequencies[column][state] = int(parsed_column.apply(lambda x: x[state]).sum())

        return frequencies  # Return the Python dictionary directly

    finally:
        conn.close()

def main():
    try:
        # Count frequencies
        frequencies = count_frequencies()

        # Print results in a cleaned format
        print("count_deviations_db.py")
        print("Frequencies of each state for missing, repetition, and mismatch activities:")
        for activity_type, counts in frequencies.items():
            print("count_deviations_db.py")
            print(f"{activity_type.capitalize()}:")
            for state, count in counts.items():
                print("count_deviations_db.py")
                print(f"  {state}: {count}")
            print("count_deviations_db.py")
            print()  # Add a blank line for readability

    except Exception as e:
        print("count_deviations_db.py")
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
