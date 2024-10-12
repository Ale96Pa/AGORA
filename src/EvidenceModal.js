import React, { useEffect, useState } from 'react';
import './EvidenceModal.css';
import html2canvas from 'html2canvas';
import { eel } from './App'; 

const EvidenceModal = ({ isVisible, onClose, containerRef }) => {
  const [securityControls, setSecurityControls] = useState([]);
  const [selectedControl, setSelectedControl] = useState('');
  const [resultMessage, setResultMessage] = useState('');  // To display the result message

  // Handle screenshot capture and save
  const handleLinkViewtoSecurityControl = async () => {
    if (containerRef && containerRef.current && selectedControl) {
      try {
        // Capture the screenshot
        const canvas = await html2canvas(containerRef.current);
        const image = canvas.toDataURL('image/png');
        const base64Screenshot = image.split(',')[1];  // Extract base64 part of the image

        // Call Python function to save screenshot and link to security control
        const result = await eel.save_screenshot_and_link_to_control(
          base64Screenshot,                 // Screenshot data               
          selectedControl                   // Security control ID selected from the dropdown
        )();

        // Show the result in the modal
        if (result && result.assessment_result_id && result.view_id) {
          setResultMessage(`Screenshot saved and linked to control ID ${selectedControl}. View ID: ${result.view_id}`);
        } else {
          setResultMessage('Failed to save screenshot and link to security control.');
        }
      } catch (error) {
        console.error('Screenshot capture or save failed:', error);
        setResultMessage('An error occurred while saving the screenshot.');
      }
    } else {
      setResultMessage('Please select a security control before capturing the screenshot.');
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
