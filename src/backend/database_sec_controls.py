import os
import eel
import sqlite3
import json
from sqlite3 import Error

def create_connection(db_file):
    """ Create a database connection to a SQLite database in the specified directory """
    os.makedirs(os.path.dirname(db_file), exist_ok=True)
    try:
        conn = sqlite3.connect(db_file)
        print(f"Connected to SQLite, version {sqlite3.version}")
        return conn
    except Error as e:
        print(e)
    return None

def create_tables(conn):
    """ Create table by executing SQL statements """
    sql_create_security_controls_table = """
    CREATE TABLE IF NOT EXISTS security_controls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        comments TEXT,
        operator_id INTEGER,
        status TEXT NOT NULL CHECK(status IN ('covered', 'partially covered', 'not covered'))
    );
    """
    sql_create_tags_table = """
    CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
    );
    """
    sql_create_control_tags_table = """
    CREATE TABLE IF NOT EXISTS control_tags (
        control_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        FOREIGN KEY (control_id) REFERENCES security_controls (id),
        FOREIGN KEY (tag_id) REFERENCES tags (id),
        PRIMARY KEY (control_id, tag_id)
    );
    """
    try:
        cursor = conn.cursor()
        cursor.execute(sql_create_security_controls_table)
        cursor.execute(sql_create_tags_table)
        cursor.execute(sql_create_control_tags_table)
        conn.commit()
        print("Tables created successfully")
    except Error as e:
        print(e)

@eel.expose
def insert_security_control(title, description, operator_name, tags, status='not covered'):
    """Insert a security control and its associated tags into the database."""
    try:
        database = "../data/security_controls.db"  # Path to the database file
        conn = sqlite3.connect(database)

        # Inserting into security_controls table
        cursor = conn.cursor()
        cursor.execute("INSERT INTO security_controls (title, description, operator_id, status) VALUES (?, ?, ?, ?)",
                       (title, description, operator_name, status))
        control_id = cursor.lastrowid  # Fetch the last inserted id

        # Inserting tags into tags table and linking them
        for tag in tags:
            # Check if the tag already exists
            cursor.execute("SELECT id FROM tags WHERE name=?", (tag,))
            tag_id = cursor.fetchone()
            if tag_id:
                tag_id = tag_id[0]
            else:
                # Insert the tag if it does not exist
                cursor.execute("INSERT INTO tags (name) VALUES (?)", (tag,))
                tag_id = cursor.lastrowid

            # Insert into control_tags table
            cursor.execute("INSERT INTO control_tags (control_id, tag_id) VALUES (?, ?)", (control_id, tag_id))

        conn.commit()
        print("Security control and tags inserted successfully.")
        conn.close()
    except sqlite3.Error as e:
        print(f"An error occurred: {e}")
        conn.rollback()

@eel.expose
def fetch_all_security_controls():
    """Fetch and display all security controls along with their tags from the database."""
    try:
        database = "../data/security_controls.db"
        conn = sqlite3.connect(database)
        cursor = conn.cursor()
        
        sql_query = """
        SELECT sc.id, sc.title, sc.description, sc.operator_id, sc.status, sc.evidence, sc.comments
        FROM security_controls sc
        GROUP BY sc.id;
        """
        
        cursor.execute(sql_query)
        controls = cursor.fetchall()
        controls_list = [{'id': row[0], 'title': row[1], 'description': row[2], 'operator_id': row[3], 'status': row[4], 'evidence': row[5], 'comments': row[6]} for row in controls]
        
        conn.close()
        return json.dumps(controls_list)
    except sqlite3.Error as e:
        print(f"An error occurred: {e}")
        return json.dumps([])

@eel.expose
def delete_security_control(control_id):
    """Delete a security control from the database by its ID."""
    try:
        database = "../data/security_controls.db"
        conn = sqlite3.connect(database)
        cursor = conn.cursor()
        
        # SQL command to delete the security control
        sql_delete_control = "DELETE FROM security_controls WHERE id = ?"
        cursor.execute(sql_delete_control, (control_id,))
        
        # Check if the row was deleted
        if cursor.rowcount == 0:
            print("No such security control found with ID:", control_id)
        else:
            print("Security control deleted successfully.")
        
        # Commit the changes to the database
        conn.commit()

        # Also, delete any associated tags from control_tags to maintain integrity
        sql_delete_tags = "DELETE FROM control_tags WHERE control_id = ?"
        cursor.execute(sql_delete_tags, (control_id,))
        conn.commit()
        conn.close()

    except sqlite3.Error as e:
        print(f"An error occurred: {e}")
        conn.rollback()  # Roll back any changes if an error occurs

@eel.expose
def count_security_controls(security_control_status=None):
    try:
        database = "../data/security_controls.db"  # Path to your database
        conn = sqlite3.connect(database)
        cursor = conn.cursor()
        
        # SQL query to count the number of security controls
        if security_control_status:
            cursor.execute("SELECT COUNT(*) FROM security_controls WHERE status = ?", (security_control_status,))
        else:
            cursor.execute("SELECT COUNT(*) FROM security_controls")
            
        count = cursor.fetchone()[0]
        
        conn.close()
        return count
    except sqlite3.Error as e:
        print(f"An error occurred: {e}")
        return 0

# Example usage
def main():

    # Define the database path under ../data directory
    base_dir = os.path.abspath(os.path.join(os.getcwd(), '..', 'data'))
    database = os.path.join(base_dir, "security_controls.db")

    conn = create_connection(database)
    if conn is not None:
        create_tables(conn)
        conn.close()
    else:
        print("Error! cannot create the database connection.")

    # Example security control data
    example_data = [
        ("Non-compliance cost", "check average NCC", "Manager", ["High Level Overview", "NCC Meter"], 'not covered'),
        ("Security Audit", "Annual security audit", "Auditor", ["Audit", "Annual"], 'partially covered'),
        ("Access Control", "Review access control measures", "Admin", ["Access", "Control"], 'partially covered'),
        ("Data Encryption", "Encrypt sensitive data", "Security Team", ["Encryption", "Data"], 'covered'),
        ("Firewall Management", "Regularly update firewall rules", "Network Admin", ["Firewall", "Update"], 'covered'),
        ("Incident Response", "Incident response plan", "Security Officer", ["Incident", "Response"], 'covered')
    ]

    for data in example_data:
        insert_security_control(*data)

    controls = fetch_all_security_controls()
    print("All security controls:", controls)

    # Example: Delete a security control by ID
    control_id = 1  # Specify the ID of the security control to be deleted
    delete_security_control(control_id)

    # Re-fetch all controls to verify deletion
    controls = fetch_all_security_controls()
    print("After deletion:", controls)

if __name__ == '__main__':
    main()
