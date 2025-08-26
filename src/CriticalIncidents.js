import React, { useState, useEffect } from 'react';
import { eel } from './App.js'; // Adjust the import based on your App structure
import './CriticalIncidents.css'; // Import custom styles if needed

const CriticalIncidents = ({ refreshTrigger, height = 400 }) => {
  const [criticalIncidents, setCriticalIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [complianceMetric, setComplianceMetric] = useState('');

  // Fetch critical incidents from the backend
  const fetchCriticalIncidents = async () => {
    setLoading(true);
    try {
      const incidents = await eel.get_critical_incidents()(); // Fetch data from the backend
      setCriticalIncidents(incidents); // Parse the returned JSON
    } catch (error) {
      console.error('Error fetching critical incidents:', error);
      setCriticalIncidents([]); // Handle errors by setting an empty array
    }
    setLoading(false);
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
    <div style={{ position: 'relative' }}>
      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(30,30,30,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10
        }}>
          <div className="spinner" />
        </div>
      )}
    <div className="critical-incidents-container" style={{ maxHeight: `${height}px`, overflowY: 'auto' }}>
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
                <td>
                  {incident[complianceMetric] !== undefined
                    ? incident[complianceMetric].toFixed(3) // Format the value if it exists
                    : 'N/A'} {/* Fallback value if the property is undefined */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
    </div>
    </div>
  );
};

export default CriticalIncidents;
