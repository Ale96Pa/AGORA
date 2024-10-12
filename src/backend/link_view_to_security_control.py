import sqlite3
import eel
import base64

@eel.expose
def save_screenshot_and_link_to_control(screenshot_data, control_id, db_path="../data/security_controls.db"):
    """
    Saves the screenshot to the assessment_views table and links the assessment result to a security control by updating its evidence field.
    
    Args:
        screenshot_data (str): Base64 encoded image data of the screenshot.
        name (str): The name of the assessment result.
        entry_type (str): The type of the assessment result ('finding', 'area of concern', 'non-conformaty').
        incident_ids_list (str): A comma-separated string of incident IDs.
        control_id (int): The id of the security control to link the evidence to.
        db_path (str): Path to the SQLite database.
    
    Returns:
        int: The ID of the newly inserted assessment result and the view ID.
    """
    try:
        # Connect to the SQLite database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Insert the screenshot into the assessment_views table
        cursor.execute("""
            INSERT INTO assessment_views (view_data) 
            VALUES (?)
        """, (screenshot_data,))

        # Fetch the ID of the newly inserted assessment view
        view_id = cursor.lastrowid


        # Fetch the ID of the newly inserted assessment result
        assessment_result_id = cursor.lastrowid

        # Update the evidence field in the security_controls table with the assessment result ID
        cursor.execute("""
            UPDATE security_controls 
            SET evidence = ? 
            WHERE id = ?
        """, (str(assessment_result_id), control_id))

        # Commit the transaction and close the connection
        conn.commit()
        cursor.close()
        conn.close()

        # Return the ID of the newly inserted assessment result and the view ID
        return {"assessment_result_id": assessment_result_id, "view_id": view_id}

    except sqlite3.Error as e:
        print(f"An error occurred: {e}")
        return None
