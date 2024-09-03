import os
import eel

@eel.expose
def get_pnml_data():
    try:
        # Define the path for the data directory and file
        data_dir = os.path.abspath(os.path.join(os.getcwd(), '..', 'data'))
        file_path = os.path.join(data_dir, 'reference_model.pnml')

        # Read the file content
        with open(file_path, 'r') as file:
            pnml_data = file.read()
        
        return pnml_data
    except Exception as e:
        print(f"Error reading file: {e}")
        return "Error reading file"
