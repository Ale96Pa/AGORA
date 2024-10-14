import React, { useEffect, useState } from 'react';
import './EvidenceModal.css';
import html2canvas from 'html2canvas';
import { eel } from './App'; 

const EvidenceModal = ({ isVisible, onClose, containerRef }) => {
  const [securityControls, setSecurityControls] = useState([]);
  const [selectedControl, setSelectedControl] = useState('');
  const [name, setName] = useState('');  // Input for the screenshot name
  const [comments, setComments] = useState('');  // Input for comments
  const [resultMessage, setResultMessage] = useState('');  // To display the result message

  // Handle screenshot capture and save
  const handleLinkViewtoSecurityControl = async () => {
    if (containerRef && containerRef.current && selectedControl && name) {
      try {
        // Capture the screenshot
        const canvas = await html2canvas(containerRef.current);
        const image = canvas.toDataURL('image/png');
        const base64Screenshot = image.split(',')[1];  // Extract base64 part of the image

        // Call Python function to save screenshot and link to security control
        const result = await eel.save_screenshot_and_link_to_control(
          base64Screenshot,  // Screenshot data
          name,              // Name input
          comments,          // Comments input
          selectedControl    // Security control ID selected from the dropdown
        )();

        // Show the result in the modal
        if (result && result.assessment_view_id) {
          setResultMessage(`Screenshot saved and linked to control ID ${selectedControl}. Filename: ${result.filename}`);
        } else {
          setResultMessage('Failed to save screenshot and link to security control.');
        }
      } catch (error) {
        console.error('Screenshot capture or save failed:', error);
        setResultMessage('An error occurred while saving the screenshot.');
      }
    } else {
      setResultMessage('Please select a security control and provide a name before capturing the screenshot.');
    }
  };

  // Fetch security controls on component mount
  useEffect(() => {
    const fetchControls = async () => {
      try {
        const result = await eel.fetch_all_security_controls()();  // Call the Python function
        setSecurityControls(JSON.parse(result));  // Parse the result and set the state
      } catch (error) {
        console.error('Failed to fetch security controls:', error);
      }
    };

    if (isVisible) {
      fetchControls();  // Fetch data only when modal is visible
    }
  }, [isVisible]);

  // Handle security control selection
  const handleControlChange = (event) => {
    setSelectedControl(event.target.value);
  };

  // Handle name input change
  const handleNameChange = (event) => {
    setName(event.target.value);
  };

  // Handle comments input change
  const handleCommentsChange = (event) => {
    setComments(event.target.value);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Select Security Control</h2>
        <select
          value={selectedControl || ""}
          onChange={handleControlChange}
          className="security-control-dropdown"
        >
          <option value="" disabled>Select a control</option>
          {securityControls.map((control) => (
            <option key={control.id} value={control.id}>
              {control.title}
            </option>
          ))}
        </select>

        <h2>Provide Screenshot Details</h2>
        <input
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder="Enter screenshot name"
          className="name-input"
        />
        <textarea
          value={comments}
          onChange={handleCommentsChange}
          placeholder="Enter comments"
          className="comments-input"
        />

        <h2>Capture Screenshot</h2>
        <div className="modal-actions">
          <button onClick={() => onClose(null)}>Close</button>
          <button onClick={handleLinkViewtoSecurityControl}>Capture Screenshot</button>
        </div>

        {/* Display result message */}
        {resultMessage && <p className="result-message">{resultMessage}</p>}
      </div>
    </div>
  );
};

export default EvidenceModal;
