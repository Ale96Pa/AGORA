import pandas as pd
import sqlite3
from collections import Counter
import eel
from database_filter_variables import *

def process_alignment(alignment):
    """Extracts relevant events and creates a variant."""
    try:
        events = alignment.split(';')
        return ' '.join([event[3] for event in events if event.startswith('[S]') or event.startswith('[L]')])
    except Exception as e:
        print(f"Failed processing alignment {alignment}: {e}")
        return ""

def analyze_alignments(df):
    """Analyzes alignments in a DataFrame and returns sorted variants."""
    try:
        df['processed'] = df['alignment'].apply(process_alignment)
        variant_counts = Counter(df['processed'])
        return sorted(variant_counts.items(), key=lambda x: x[1], reverse=True)
    except Exception as e:
        print(f"Error during analysis: {e}")
        return []

@eel.expose
def get_sorted_variants_from_db():
    """
    Queries the incidents_alignment_table in a SQLite database containing 'alignment' data,
    processes the data to extract variants, and returns sorted variants based on frequency.
    
    Returns:
    list of tuples: A sorted list of tuples, where each tuple is (variant, frequency).
    """
    try:
        db_path = "../data/incidents.db"
        conn = sqlite3.connect(db_path)

        # Format the incident IDs for SQL query
        formatted_incident_ids = ', '.join(f"'{incident_id}'" for incident_id in get_incident_ids_selection())

        # Build the base SQL query to select the desired columns
        query = f"""
        SELECT alignment
        FROM incident_alignment_table
        WHERE incident_id IN ({formatted_incident_ids})
        """
        df = pd.read_sql(query, conn)
        conn.close()
        return analyze_alignments(df)
    except Exception as e:
        print(f"An error occurred while querying the database: {e}")
        return []

# Example usage
if __name__ == "__main__":
    sorted_variants = get_sorted_variants_from_db()
    print(sorted_variants)
