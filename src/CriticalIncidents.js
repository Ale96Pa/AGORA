import React, { useState, useEffect } from 'react';
import { eel } from './App.js'; // Adjust the import based on your App structure
import './CriticalIncidents.css'; // Import custom styles if needed

const CriticalIncidents = ({ refreshTrigger, height = 400 }) => {
  const [criticalIncidents, setCriticalIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [complianceMetric, setComplianceMetric] = useState('');

  // Fetch critical incidents from the backend
  const fetchCriticalIncidents = async () => {
    setLoading(true);
    try {
      const incidents = await eel.get_critical_incidents()(); // Fetch data from the backend
      setCriticalIncidents(JSON.parse(incidents)); // Parse the returned JSON
    } catch (error) {
      console.error('Error fetching critical incidents:', error);
      setCriticalIncidents([]); // Handle errors by setting an empty array
    } finally {
      setLoading(false);
    }
  };

  // Fetch the incident compliance metric
  const fetchComplianceMetric = async () => {
    try {
      const metric = await eel.get_incident_compliance_metric()(); // Fetch compliance metric
      setComplianceMetric(metric); // Set the metric in state
    } catch (error) {
      console.error('Error fetching compliance metric:', error);
    }
  };

  // UseEffect to fetch data on mount and when refreshTrigger changes
  useEffect(() => {
    fetchCriticalIncidents(); // Fetch incidents when the component mounts
    fetchComplianceMetric(); // Fetch compliance metric when the component mounts
  }, [refreshTrigger]); // Refetch when refreshTrigger changes

  // Conditional rendering based on loading state and data presence
  return (
    <div className="critical-incidents-container" style={{ maxHeight: `${height}px`, overflowY: 'auto' }}>
      {loading ? (
        <p>Loading critical incidents...</p>
      ) : criticalIncidents.length > 0 ? (
        <table className="critical-incidents-table">
          <thead>
            <tr>
              <th>Incident ID</th>
              <th>{complianceMetric}</th>
            </tr>
          </thead>
          <tbody>
            {criticalIncidents.map((incident, index) => (
              <tr key={index}>
                <td>{incident.incident_id}</td>
                <td>{incident[complianceMetric].toFixed(3)}</td> {/* Use the fetched compliance metric */}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No critical incidents found.</p>
      )}
    </div>
  );
};

export default CriticalIncidents;
