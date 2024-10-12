import React, { useState, useEffect } from 'react';
import './NavigationBar.css';
import { eel } from './App.js';
import ThresholdSlider from './ThresholdSlider';
import TimeThresholds from './TimeThresholds.js';
import IncidentSelection from './incident_selection.js';

function NavigationBar({ refreshTrigger, onSelectionChange, toggleView }) {
  const [showSettings, setShowSettings] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('Fitness');
  const [notCoveredCount, setNotCoveredCount] = useState(0);
  const [partiallyCoveredCount, setPartiallyCoveredCount] = useState(0);
  const [coveredCount, setCoveredCount] = useState(0);
  const [thresholds, setThresholds] = useState([0.25, 0.5, 0.75]);

  // State to track the active button (either "Process Analysis" or "Reporting")
  const [activeTab, setActiveTab] = useState('processAnalysis');  // Default active tab

  const handleThresholdChange = (newThresholds) => {
    setThresholds(newThresholds);
    console.log("Updated thresholds: ", newThresholds);
  };

  const handleSettingsClick = () => {
    setShowSettings(!showSettings);
  };

  const handleMetricChange = (metric) => {
    setSelectedMetric(metric);
    eel.set_incident_compliance_metric(metric)();
    console.log(`Selected metric: ${metric}`);
  };

  const handleSelectionChange = () => {
    onSelectionChange();
    console.log("Here works");
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);  // Set the clicked tab as active
    toggleView();  // Toggle between views when a tab is clicked
  };

  useEffect(() => {
    const fetchSecurityControlsCounts = async () => {
      try {
        const notCoveredResponse = await eel.count_security_controls('not covered')();
        const partiallyCoveredResponse = await eel.count_security_controls('partially covered')();
        const coveredResponse = await eel.count_security_controls('covered')();

        setNotCoveredCount(notCoveredResponse);
        setPartiallyCoveredCount(partiallyCoveredResponse);
        setCoveredCount(coveredResponse);
      } catch (error) {
        console.error('Failed to fetch security control counts:', error);
      }
    };

    fetchSecurityControlsCounts();
  }, [refreshTrigger]);

  return (
    <div className="navbar-container">
      <div className="section-container">
        <div className="control-count">
          <div className="count-circle" style={{ backgroundColor: '#b80000' }}>{notCoveredCount}</div>
          <div className="count-label">Not covered SecControls</div>
        </div>
        <div className="control-count">
          <div className="count-circle" style={{ backgroundColor: '#FF7A00' }}>{partiallyCoveredCount}</div>
          <div className="count-label">Partially covered SecControls</div>
        </div>
        <div className="control-count">
          <div className="count-circle" style={{ backgroundColor: '#00b81d' }}>{coveredCount}</div>
          <div className="count-label">Covered SecControls</div>
        </div>
      </div>

      <div className='section-container'>
        <IncidentSelection onSelectionChange={handleSelectionChange} />
      </div>

      <div className="section-container">
        {/* Process Analysis Button */}
        <div
          className={`section-content ${activeTab === 'processAnalysis' ? 'active-tab' : ''}`}  // Apply active class if processAnalysis is active
          onClick={() => handleTabClick('processAnalysis')}
        >
          <img
            loading="lazy"
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/a0101106d9a7a8f8a3f962ef55b73d7ed82213c2a2e2060c8819adc6c98b8dda?"
            className="icon"
          />
          <div className="label">Process Analysis</div>
        </div>

        {/* Reporting Button */}
        <div
          className={`section-content ${activeTab === 'reporting' ? 'active-tab' : ''}`}  // Apply active class if reporting is active
          onClick={() => handleTabClick('reporting')}
        >
          <img
            loading="lazy"
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/c9a8d4b2ef37e2b2802b332e933fa26d144caf98f5b1bc9450d1ae093dc83243?"
            className="icon"
          />
          <div className="label">Reporting</div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-icon" onClick={handleSettingsClick}>
          <img
            loading="lazy"
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/a0dc1aa43d8dcaab4ca7b2f4afa065dfacdf8e35c3817a3f65d71e91a8101128?"
            className="icon"
          />
        </div>

        {showSettings && (
          <div className="settings-dropdown">
            <div className="settings-name">COMPLIANCE METRIC</div>
            <div className="metric-container">
              <div className="metric-label">Fitness</div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={selectedMetric === 'costTotal'}
                  onChange={(e) => handleMetricChange(e.target.checked ? 'costTotal' : 'fitness')}
                />
                <span className="slider round"></span>
              </label>
              <div className="metric-label">Non-Compliance Cost</div>
            </div>
            <ThresholdSlider onThresholdChange={handleThresholdChange} />
            <TimeThresholds />
          </div>
        )}

        <div className="settings-icon">
          <img
            loading="lazy"
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/11b127d01f10e38475e271d30a9081d6eb85debdad6155a1bfc6158be65009a0?"
            className="icon"
          />
        </div>

        <div className="profile-section">
          <div className="profile-icon">
            <img
              loading="lazy"
              srcSet="..."
              className="profile-img"
            />
          </div>
          <div className="profile-details">
            <div className="profile-name">John Doe</div>
            <div className="profile-role">FULL INTERFACE</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NavigationBar;
