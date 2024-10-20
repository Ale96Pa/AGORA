import React, { useState, useEffect } from 'react';
import { eel } from './App'; // Adjust the import path based on your project structure
import './Reporting.css';  // Include your styles here

const Reporting = () => {
  const [controls, setControls] = useState([]);
  const [assessmentResultsWithImages, setAssessmentResultsWithImages] = useState([]);
  const [loadingAssessmentResultsWithImages, setLoadingAssessmentResultsWithImages] = useState(true);
  const [assessmentDetails, setAssessmentDetails] = useState([]);
  const [loadingAssessmentDetails, setLoadingAssessmentDetails] = useState(true);
  const [loadingControls, setLoadingControls] = useState(true);
  const [expandedIncidentIds, setExpandedIncidentIds] = useState({}); // Track expanded states for incident IDs
  const [selectedControl, setSelectedControl] = useState(null); // Track the selected control

  // Fetch security controls and assessment results when the component mounts
  useEffect(() => {
    const fetchControls = async () => {
      try {
        const result = await eel.fetch_all_security_controls()(); // Fetch security controls
        const controlsData = JSON.parse(result);
        setControls(controlsData);
      } catch (error) {
        console.error('Error fetching security controls:', error);
      } finally {
        setLoadingControls(false);
      }
    };

    const fetchAssessmentResultsWithImages = async () => {
      try {
        const result = await eel.fetch_all_assessment_views()();  // Fetch assessment results with images
        const assessmentData = JSON.parse(result);
        setAssessmentResultsWithImages(assessmentData);
      } catch (error) {
        console.error('Error fetching assessment results with images:', error);
      } finally {
        setLoadingAssessmentResultsWithImages(false);
      }
    };

    const fetchAssessmentDetails = async () => {
      try {
        const result = await eel.get_all_assessment_details()();  // Fetch all assessment details
        const assessmentData = JSON.parse(result);
        setAssessmentDetails(assessmentData);
      } catch (error) {
        console.error('Error fetching assessment details:', error);
      } finally {
        setLoadingAssessmentDetails(false);
      }
    };

    fetchControls();
    fetchAssessmentResultsWithImages();
    fetchAssessmentDetails();
  }, []);

  // Find the security control that matches the assessment's evidence filename
  const getControlForAssessmentByFilename = (evidenceFilename) => {
    return controls.find(control => {
      if (control.evidence) {
        const evidenceFiles = control.evidence.split(';'); // Split by ';' to handle multiple filenames
        return evidenceFiles.includes(evidenceFilename); // Check if the filename is in the list
      }
      return false;
    });
  };

  // Find the security control that matches the assessment's name
  const getControlForAssessmentByName = (assessmentName) => {
    return controls.find(control => {
      if (control.evidence) {
        const evidenceFiles = control.evidence.split(';');
        return evidenceFiles.includes(assessmentName);
      }
      return false;
    });
  };

  // Toggle the expansion of incident IDs
  const toggleIncidentIds = (assessmentId) => {
    setExpandedIncidentIds(prevState => ({
      ...prevState,
      [assessmentId]: !prevState[assessmentId] // Toggle expanded state for this assessment ID
    }));
  };

  // Handle control selection
  const handleControlClick = (controlId) => {
    setSelectedControl(controlId === selectedControl ? null : controlId); // Deselect if the same control is clicked again
  };

  // Filter the assessment results by selected control
  const filteredAssessmentResultsWithImages = assessmentResultsWithImages.filter(result => {
    const linkedControl = getControlForAssessmentByFilename(result.image_filename);
    return selectedControl ? linkedControl && linkedControl.id === selectedControl : true;
  });

  const filteredAssessmentDetails = assessmentDetails.filter(result => {
    const linkedControl = getControlForAssessmentByName(result.name);
    return selectedControl ? linkedControl && linkedControl.id === selectedControl : true;
  });

  return (
    <div className="reporting-container">
      <div className="div-114">
        <div className="aggregated-view">
          {/* Security Controls Section */}
          <div className="view" style={{ flex: '2' }}>
            <div className="view-header">
              <div className="view-title">
                <div className="view-color" />
                <div className="view-name">Security Controls List</div>
              </div>
              <div className="view-options">
                {/* Options icons (if any) */}
              </div>
            </div>
            {/* Security Controls Table */}
            <div className="controls-table-container">
              {loadingControls ? (
                <p>Loading security controls...</p>
              ) : controls.length === 0 ? (
                <p>No security controls available.</p>
              ) : (
                <table className="controls-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Description</th>
                      <th>Operator ID</th>
                      <th>Status</th>
                      <th>Evidence</th>
                      <th>Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {controls.map((control) => (
                      <tr
                        key={control.id}
                        className={selectedControl === control.id ? 'selected-row-stroke' : ''}
                        onClick={() => handleControlClick(control.id)}
                      >
                        <td>{control.id}</td>
                        <td>{control.title}</td>
                        <td>{control.description}</td>
                        <td>{control.operator_id}</td>
                        <td>{control.status}</td>
                        <td>{control.evidence}</td>
                        <td>{control.comments}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Assessment Results View */}
          <div className="view" style={{ flex: '1' }}>
            <div className="view-header">
              <div className="view-title">
                <div className="view-color" />
                <div className="view-name">Assessment Results</div>
              </div>
              <div className="view-options">
                {/* Options icons (if any) */}
              </div>
            </div>
            {/* Assessment Results Display */}
            <div className="assessment-results-container">
              {/* First, display assessment results with images */}
              <h2>Assessment Views</h2>
              {loadingAssessmentResultsWithImages ? (
                <p>Loading assessment results with images...</p>
              ) : filteredAssessmentResultsWithImages.length === 0 ? (
                <p>No assessment results with images available.</p>
              ) : (
                <div className="assessment-results-list">
                  {filteredAssessmentResultsWithImages.map((result) => {
                    const linkedControl = getControlForAssessmentByFilename(result.image_filename);
                    return (
                      <div key={result.id} className={`assessment-item ${selectedControl ? 'selected-stroke' : ''}`}>
                        {result.encoded_image ? (
                          <img
                            src={`data:image/png;base64,${result.encoded_image}`}
                            alt="Assessment Screenshot"
                            className="assessment-screenshot"
                            style={{
                              maxHeight: '300px',
                              maxWidth: '100%',
                              objectFit: 'contain',
                            }}
                          />
                        ) : (
                          <p>No image available</p>
                        )}
                        {linkedControl ? (
                          <p className="assessment-control-info">
                            Linked Control: ID {linkedControl.id} - {linkedControl.title}
                          </p>
                        ) : (
                          <p className="assessment-control-info">No linked control found</p>
                        )}
                        <p className="assessment-comments">Comments: {result.comments}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Now, display assessment details */}
              <h2>Incident Tags</h2>
              {loadingAssessmentDetails ? (
                <p>Loading assessment details...</p>
              ) : filteredAssessmentDetails.length === 0 ? (
                <p>No assessment details available.</p>
              ) : (
                <div className="assessment-results-list">
                  {filteredAssessmentDetails.map((result) => {
                    const linkedControl = getControlForAssessmentByName(result.name);
                    return (
                      <div key={result.id} className={`assessment-item ${selectedControl ? 'selected-stroke' : ''}`}>
                        <p className="assessment-id-name">Tag Name: {result.name}</p>
                        {linkedControl ? (
                          <p className="assessment-control-info">
                            Linked Control: ID {linkedControl.id} - {linkedControl.title}
                          </p>
                        ) : (
                          <p className="assessment-control-info">No linked control found</p>
                        )}
                        <p
                          className="assessment-incident-ids-toggle"
                          onClick={() => toggleIncidentIds(result.id)}
                        >
                          {expandedIncidentIds[result.id] ? 'Hide' : 'Show'} Incident IDs
                        </p>
                        {expandedIncidentIds[result.id] && (
                          <div className="assessment-incident-ids">
                            Incident IDs: {result.incident_ids_list}
                          </div>
                        )}
                        <p className="assessment-type">Type: {result.type}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reporting;
