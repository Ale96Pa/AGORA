import React, { useState, useEffect } from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar';
import 'bootstrap/dist/css/bootstrap.min.css';
import './StatisticalAnalysis.css';
import { eel } from './App';  // Ensure eel is imported

const StatisticalAnalysis = ({ refreshTrigger }) => {
  // State to store the progress bar data
  const [percSLAMet, setPercSLAMet] = useState(0);
  const [avgToResolve, setAvgToResolve] = useState(0);
  const [percAssignedToResolved, setPercAssignedToResolved] = useState(0);
  const [percFalsePositives, setPercFalsePositives] = useState(0);

  // Function to fetch statistical data from the backend
  const fetchStatisticalData = async () => {
    try {
      // Call the exposed function from the backend via Eel
      const result = await eel.get_statistical_analysis_data()();
      
      // Parse the JSON response
      const data = JSON.parse(result);

      // Update the state with the fetched data
      setPercSLAMet(data.perc_sla_met || 0);
      setAvgToResolve(data.avg_time_to_resolve || 0);
      setPercAssignedToResolved(data.perc_assigned_to_resolved_by || 0);
      setPercFalsePositives(data.perc_false_positives || 0);
    } catch (error) {
      console.error('Failed to fetch statistical data:', error);
    }
  };

  // Fetch data when the component mounts or when refreshTrigger changes
  useEffect(() => {
    fetchStatisticalData();
  }, [refreshTrigger]);

  return (
    <div className="progress-bars-layout">
      <div className="progress-box">
        <div className="name">PERC SLA MET</div>
        <ProgressBar now={percSLAMet} label={`${percSLAMet}%`} />
      </div>
      <div className="progress-box">
        <div className="name">AVG TIME TO RESOLVE</div>
        <ProgressBar now={avgToResolve} label={`${avgToResolve} min`} />
      </div>
      <div className="progress-box-large">
        <div className="name">PERC ASSIGNED TO RESOLVED BY</div>
        <ProgressBar now={percAssignedToResolved} label={`${percAssignedToResolved}%`} />
      </div>
      <div className="progress-box-large">
        <div className="name">FALSE POSITIVES</div>
        <ProgressBar now={percFalsePositives} label={`${percFalsePositives}%`} />
      </div>
    </div>
  );
};

export default StatisticalAnalysis;
