import React, { useEffect, useState, useRef } from 'react';
import { eel } from './App';  // Import eel to fetch data from the backend
import './WhatIfAnalysis.css';

const WhatIfAnalysis = ({ height, refreshTrigger, updateTrigger }) => {
  const [assessments, setAssessments] = useState([]);  // Store assessment data (id and name)
  const [selectedAssessments, setSelectedAssessments] = useState([]);  // Store the selected assessments
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
    const options = event.target.options;
    const selectedValues = [];
    for (let i = 0, l = options.length; i < l; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    setSelectedAssessments(selectedValues);  // Update selected assessments
    setIsActive(false);  // Reset the active state when a new assessment is selected
  };

  // Handle the "Activate" button click
  const handleActivateClick = async () => {
    if (selectedAssessments.length > 0) {
      try {
        if (!isActive) {
          // Activate the what-if analysis for all selected assessments
          await eel.apply_what_if_analysis_multiple(selectedAssessments)();  
          console.log(`Applied what-if analysis for assessment IDs: ${selectedAssessments.join(', ')}`);
          setIsActive(true);  // Set the state to active
        } else {
          // Deactivate the what-if analysis
          await eel.set_filter_value("filters.whatIf_analysis", [])();  // Clear the filter
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
      <label htmlFor="assessmentDropdown" className="name">Select Tags:</label>
      <select
        id="assessmentDropdown"
        multiple  // Enable multiple selection
        value={selectedAssessments}
        onChange={handleAssessmentChange}
        className="assessment-dropdown"
        disabled={isActive}  // Disable dropdown when assessment is active
      >
        {assessments.map((assessment) => (
          <option key={assessment.id} value={assessment.id}>
            {assessment.name}
          </option>
        ))}
      </select>

      <button
        className={`activate-button ${isActive ? 'deactivate' : ''}`}  // Apply 'deactivate' class when active
        onClick={handleActivateClick}
        disabled={selectedAssessments.length === 0}  // Disable button if no assessment is selected
      >
        {isActive ? 'Deactivate' : 'Activate'}
      </button>
    </div>
  );
};

export default WhatIfAnalysis;
