import React, { useState, useEffect } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import './ThresholdSlider.css';
import { eel } from './App.js';

const ThresholdSlider = ({ onThresholdChange }) => {
  // Initialize thresholds with default values
  const [thresholds, setThresholds] = useState([0, 0.25, 0.5, 0.75, 1]);

  // Use useEffect to asynchronously fetch the initial thresholds
  useEffect(() => {
    const fetchThresholds = async () => {
      const fetchedThresholds = JSON.parse(await eel.get_compliance_metric_thresholds()());
      
      // Map the JSON structure to an array of threshold values
      const thresholdArray = [
        fetchedThresholds.critical[0],
        fetchedThresholds.critical[1],
        fetchedThresholds.moderate[1],
        fetchedThresholds.high[1],
        fetchedThresholds.low[1]
      ];

      setThresholds(thresholdArray);
    };
    fetchThresholds();
  }, []); // Empty dependency array ensures this runs once when the component is mounted

  const handleSliderChange = (newThresholds) => {
    setThresholds(newThresholds);
    onThresholdChange(newThresholds); // Pass the new values back to the parent component
  };

  // Send thresholds to backend when the user is done moving the slider
  const handleAfterChange = async (newThresholds) => {
    // Map the array of threshold values back into the JSON format
    const thresholds = {
      critical: [newThresholds[0], newThresholds[1]],
      moderate: [newThresholds[1], newThresholds[2]],
      high: [newThresholds[2], newThresholds[3]],
      low: [newThresholds[3], newThresholds[4]]
    };

    await eel.set_compliance_metric_thresholds(JSON.stringify(thresholds))(); // Save to backend
  };

  return (
    <div className="threshold-slider-container">
      <div className="threshold-labels">
        <div>Critical</div>
        <div>High</div>
        <div>Moderate</div>
        <div>Low</div>
      </div>

      <div className="slider-row">
        <Slider
          range
          min={0}
          max={1}
          step={0.01}
          value={thresholds}
          onChange={handleSliderChange}    // Update the state during dragging
          onAfterChange={handleAfterChange} // Save to backend after user stops adjusting
          marks={{
            [thresholds[0]]: thresholds[0].toFixed(2),
            [thresholds[1]]: thresholds[1].toFixed(2),
            [thresholds[2]]: thresholds[2].toFixed(2), 
            [thresholds[3]]: thresholds[3].toFixed(2),
            [thresholds[4]]: thresholds[4].toFixed(2)
          }}
          trackStyle={[
            { backgroundColor: 'purple' },  // Critical range
            { backgroundColor: 'red' }, // High range
            { backgroundColor: 'orange' },    // Moderate range
            { backgroundColor: 'green' } // Low range
          ]}
          railStyle={{ backgroundColor: 'lightgrey' }} // Style the rail
        />
      </div>
    </div>
  );
};

export default ThresholdSlider;
