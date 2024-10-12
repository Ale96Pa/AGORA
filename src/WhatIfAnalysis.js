import React, { useEffect, useState, useRef } from 'react';
import { eel } from './App';  // Import eel to fetch data from the backend
import './WhatIfAnalysis.css';

const WhatIfAnalysis = ({ height, refreshTrigger, updateTrigger }) => {
  const [assessments, setAssessments] = useState([]);  // Store assessment data (id and name)
  const [selectedAssessment, setSelectedAssessment] = useState(null);  // Store the selected assessment
  const [isActive, setIsActive] = useState(false);  // Track whether the assessment is active
  const svgRef = useRef();  // Reference for the container element
  const [containerWidth, setContainerWidth] = useState(0);  // Store the container width

  // Fetch all assessment results from the backend once on mount
  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const result = await eel.get_all_assessment_ids_and_names()();  // Fetch assessment data
        setAssessments(result);
      } catch (error) {
        console.error('Failed to fetch assessments:', error);
      }
    };

    fetchAssessments();  // Fetch data on mount
  }, [updateTrigger]);  // Empty dependency array to only fetch once on mount

  // Dynamically set container width using getBoundingClientRect
  useEffect(() => {
    const updateContainerWidth = () => {
      if (svgRef.current) {
        const newWidth = svgRef.current.getBoundingClientRect().width;
        setContainerWidth(newWidth);
      }
    };

    // Set initial width
    updateContainerWidth();

    // Add event listener to update the width when window resizes
    window.addEventListener('resize', updateContainerWidth);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('resize', updateContainerWidth);
    };
  }, []);

  // Handle assessment selection
  const handleAssessmentChange = (event) => {
    setSelectedAssessment(event.target.value);
    setIsActive(false);  // Reset the active state when a new assessment is selected
  };

  // Handle the "Activate" button click
  const handleActivateClick = async () => {
    if (selectedAssessment) {
      try {
        if (!isActive) {
          // Activate the assessment
          await eel.apply_what_if_analysis(selectedAssessment)();  
          console.log(`Applied what-if analysis for assessment ID: ${selectedAssessment}`);
          setIsActive(true);  // Set the state to active
        } else {
          // Deactivate the assessment
          await eel.set_filter_value("filters.whatIf_analysis", [])();  // New eel function to clear filters.whatif_analysis
          console.log('Cleared what-if analysis');
          setIsActive(false);  // Set the state to inactive
        }

        refreshTrigger();  // Refresh data after activating/deactivating
      } catch (error) {
        console.error('Failed to toggle what-if analysis:', error);
      }
    }
  };

  return (
    <div
      className="what-if-analysis-container"
      ref={svgRef}
      style={{ width: `100%`, height: `${height}px` }}  // Dynamically set width, height is passed as a prop
    >
      <label htmlFor="assessmentDropdown" className="name">Select Tag:</label>
      <select
        id="assessmentDropdown"
        value={selectedAssessment || ""}
        onChange={handleAssessmentChange}
        className="assessment-dropdown"
        disabled={isActive}  // Disable dropdown when assessment is active
      >
        <option value="" disabled>Select an assessment</option>
        {assessments.map((assessment) => (
          <option key={assessment.id} value={assessment.id}>
            {assessment.name}
          </option>
        ))}
      </select>

      <button
        className={`activate-button ${isActive ? 'deactivate' : ''}`}  // Apply 'deactivate' class when active
        onClick={handleActivateClick}
        disabled={!selectedAssessment}  // Disable button if no assessment is selected
      >
        {isActive ? 'Deactivate' : 'Activate'}
      </button>
    </div>
  );
};

export default WhatIfAnalysis;
