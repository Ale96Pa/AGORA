import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import { eel } from './App.js';  // Adjust the path to where your eel is located
import './TabularAnalysis.css';  // Import custom styles for the table

const TabularAnalysis = ({ refreshTrigger, globalFilterTrigger, selectionTabularChange }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch tabular data from backend (Python via Eel)
  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await eel.get_tabular_incidents_entries()();  // Fetch the data from Python
      const parsedData = JSON.parse(result);  // Assuming data is JSON stringified
      setData(parsedData);
    } catch (error) {
      console.error("Failed to fetch data from Python:", error);
      setData([]);  // Set an empty array if there's an error
    } finally {
      setLoading(false);
    }
  };

  // Run fetchData on component mount and when refreshTrigger changes
  useEffect(() => {
    fetchData();  // Fetch data when the component mounts
  }, [refreshTrigger, globalFilterTrigger]);  // Re-fetch data when refreshTrigger changes

  // Handle selection of incidents and send them to the backend
  const handleIncidentSelection = (selectedRows) => {
    const selectedIncidentIds = selectedRows.map(row => row.incident_id);
    console.log('Selected incidents:', selectedIncidentIds);
    eel.set_incident_ids_from_tabular_selection(selectedIncidentIds);  // Send selected incidents to backend
    selectionTabularChange();
  };

  // When the component renders, use Inputs.table to display the data
  useEffect(() => {
    if (!data || data.length === 0 || !window.Inputs) return;  // Don't attempt to render if there's no data or Inputs isn't loaded

    // Clear the container before appending the new table
    const container = d3.select('#table-container');
    container.selectAll("*").remove();  // Clear any previous table

    try {
      const table = window.Inputs.table(data, {
        multiple: true,  // Allow multiple row selection
        width: '100%',
        layout: 'fixed',  // Auto layout for flexible column widths
        maxWidth: 600
      });

      table.style.tableLayout = "fixed";  // Ensure fixed layout for consistent column widths

      // Listen to input events to capture selected rows
      table.addEventListener('input', () => {
        const selectedRows = table.value;  // Get the selected rows
        handleIncidentSelection(selectedRows);  // Handle selection of incidents
      });

      container.node().appendChild(table);  // Append the table to the container
    } catch (error) {
      console.error("Error creating table with ObservableHQ Inputs:", error);
    }
  }, [data]);  // Re-render the table when data changes

  return (
    <div>
      <div id="table-container" className="table-layout">
        {loading ? (
          <p>Loading data...</p>
        ) : (
          data.length === 0 ? <p>No data available</p> : null
        )}
      </div>
    </div>
  );
};

export default TabularAnalysis;
