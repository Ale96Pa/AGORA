import './ProcessAnalysis.css';
import CommonVariants from './common_variants.js';
import IncidentSelection from './incident_selection.js';
import { useEffect, useState, useRef } from 'react';
import './ProcessStateTimes.js';
import DistributionViolinPlot from './ComplianceDistributionViolinPlot.js';
import { eel } from './App';
import TechnicalAnalysis from './TechnicalAnalysis.js';
import LinearizedPnmlVisualization from './LinearizedPnmlVisualization.js';
import IndividualAnalysis from './IndividualAnalysis.js';
import IncidentsLineChart from './IncidentsLineChart.js';
import CriticalIncidents from './CriticalIncidents.js';
import StatisticalAnalysis from './StatisticalAnalysis.js';
import TabularAnalysis from './TabularAnalysis.js';
import ComplianceBar from './ComplianceBar.js';
import ProcessStatistics from './ProcessStatistics.js';
import ComplianceDevelopment from './ComplianceDevelopment.js';
import WhatIfAnalysis from './WhatIfAnalysis.js';
import EvidenceModal from './EvidenceModal.js';
import html2canvas from 'html2canvas';  // Import html2canvas for screenshot functionality

async function getPNML() {
  try {
    const pnmlData = await eel.communicate_pnml_data_py()();
    if (pnmlData !== "Error reading file") {
      return pnmlData;
    } else {
      console.error("Failed to read PNML file:", pnmlData);
      return;
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

const ProcessAnalysis = ({ analysisTrigger}) => {
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [selectionTabularTrigger, setTabularSelectionTrigger] = useState(false);
  const [globalFilterTrigger, setGlobalFilterTrigger] = useState(false);
  const [graphCursorTrigger, setGraphCursorTrigger] = useState(false);
  const [whatIfAnalysisTrigger, setWhatIfAnalysisTrigger] = useState(false);

  const [isModalVisible, setModalVisible] = useState(false);  // State to track modal visibility

  // Create separate refs for each view container
  const activeclosedIncidentsRef = useRef(null);
  const statisticalAnalysisRef = useRef(null);
  const processStatisticsRef = useRef(null);
  const referenceModelRef = useRef(null);
  const commonVariantsRef = useRef(null);
  const criticalIncidentsRef = useRef(null);
  const complianceDevelopmentRef = useRef(null);
  const complianceDistributionRef = useRef(null);
  const technicalAnalysisRef = useRef(null);
  const tabularAnalysisRef = useRef(null);
  const individualAnalysisRef = useRef(null);
  const whatIfAnalysisRef = useRef(null);

  const [currentRef, setCurrentRef] = useState(null);

  const openModalWithRef = (ref) => {
    setCurrentRef(ref);  // Set the current ref
    setModalVisible(true);  // Show the modal
  };

  const fetchData = async () => {
    try {
      const pnmlData = await getPNML();
    } catch (error) {
      console.error('An error occurred:', error);
    }
  };

  useEffect(() => {
    fetchData();
    setRefreshTrigger(prev => !prev);
    console.log("works?");
  }, [analysisTrigger]);

  const handleSelectionChange = () => {
    setRefreshTrigger(prev => !prev);
  };

  const handleTabularSelectionChange = () => {
    setTabularSelectionTrigger(prev => !prev);
    console.log("Process trigger");
  };

  const handleTabularFilterChange = () => {
    setGlobalFilterTrigger(prev => ! prev);
    console.log("Global Filter trigger");
  };

  const handleGraphCursorChange = () => {
    setGraphCursorTrigger(prev => ! prev);
    console.log("Graph cursor trigger");
  };

  const handleWhatIfAnalysisUpdate = () => {
    setWhatIfAnalysisTrigger(prev => !  prev);
  }


  const handleModalClose = () => {
    setModalVisible(false);
  };

  // Function to handle the screenshot capture
  const handleScreenshot = async (ref) => {
    if (ref.current) {
      try {
        const canvas = await html2canvas(ref.current);  // Capture the screenshot
        const image = canvas.toDataURL("image/png");  // Convert the canvas to a data URL
        const link = document.createElement('a');
        link.href = image;
        link.download = 'process_analysis_screenshot.png';
        link.click();  // Trigger the download
      } catch (error) {
        console.error("Screenshot capture failed:", error);
      }
    }
  };

  return (
    <div className="conduct-audit-activities">
      {/* EvidenceModal */}
      <EvidenceModal
            isVisible={isModalVisible}
            onClose={handleModalClose}
            containerRef={currentRef}  // Pass the correct ref to the modal
          />
      <div className="div-114">
        <div className="aggregated-view">
          {/* Active and (compliantly) closed incidents */}
          <div className="view" style={{ flex: '3'}} ref={activeclosedIncidentsRef}>
            <div className="view-header">
              <div className="view-title">
                <div className="view-color" />
                <div className="view-name">Active & (compliantly) closed incidents</div>
              </div>
              <div className="view-options">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/a596cbe0638ef32530bc667ec818053e9585b1e23beaba7e39db2a185087af5b?"
                  className="img-40"
                  onClick={() => openModalWithRef(activeclosedIncidentsRef)}  // Capture referenceModelRef
                  style={{ cursor: 'pointer' }}
                />
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/8895bd9f8d97cf1ce797fbfd735df7d6f317969a72619e5b468bb33460611015?"
                  className="img-41"
                />
              </div>
            </div>
            <IncidentsLineChart height={150} graphCursorTrigger={handleGraphCursorChange} refreshTrigger={refreshTrigger} />
          </div>

          {/* Statistical Analysis */}
          <div className="view" style={{ flex: '1'}} ref={statisticalAnalysisRef}>
            <div className="div-155">
              <div className="div-156">
                <div className="div-157" />
                <div className="div-158">Statistical Analysis</div>
              </div>
              <div className="div-159">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/b8802bce4b2328afc3828723fb3f6019547d9405c4147e72d184d0ccb80e867c?"
                  className="img-40"
                  onClick={() => handleScreenshot(statisticalAnalysisRef)}  // Capture commonVariantsRef
                  style={{ cursor: 'pointer' }}
                />
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/79f3833540a5f686ca5f9e789cde206e3cc3439275efc77c26b77963765104f3?"
                  className="img-44"
                />
              </div>
            </div>
            <ComplianceBar globalFilterTrigger={handleTabularFilterChange} refreshTrigger={refreshTrigger} />
            <StatisticalAnalysis globalFilterTrigger={handleTabularFilterChange} refreshTrigger={refreshTrigger} />
          </div>
        </div>
        <div className="aggregated-view">
          {/* Reference Model */}
          <div className="view" style={{ flex: '3'}} ref={referenceModelRef}>
            <div className="view-header">
              <div className="view-title">
                <div className="view-color" />
                <div className="view-name">Reference Model</div>
              </div>
              <div className="view-options">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/a596cbe0638ef32530bc667ec818053e9585b1e23beaba7e39db2a185087af5b?"
                  className="img-40"
                  onClick={() => handleScreenshot(referenceModelRef)}  // Capture referenceModelRef
                  style={{ cursor: 'pointer' }}
                />
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/8895bd9f8d97cf1ce797fbfd735df7d6f317969a72619e5b468bb33460611015?"
                  className="img-41"
                />
              </div>
            </div>
            <LinearizedPnmlVisualization height={160} refreshTrigger={refreshTrigger} />
          </div>

          {/* Common Variants */}
          <div className="view" style={{ flex: '1'}} ref={commonVariantsRef}>
            <div className="div-155">
              <div className="div-156">
                <div className="div-157" />
                <div className="div-158">Common Variants</div>
              </div>
              <div className="div-159">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/b8802bce4b2328afc3828723fb3f6019547d9405c4147e72d184d0ccb80e867c?"
                  className="img-40"
                  onClick={() => handleScreenshot(commonVariantsRef)}  // Capture commonVariantsRef
                  style={{ cursor: 'pointer' }}
                />
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/79f3833540a5f686ca5f9e789cde206e3cc3439275efc77c26b77963765104f3?"
                  className="img-44"
                />
              </div>
            </div>
            <CommonVariants height={130} globalFilterTrigger={handleTabularFilterChange} refreshTrigger={refreshTrigger} />
          </div>
        </div>
        <div className="aggregated-view">
          {/* Process Statistics */}
          <div className="view" style={{ flex: '3'}} ref={processStatisticsRef}>
            <div className="view-header">
              <div className="view-title">
                <div className="view-color" />
                <div className="view-name">Process Statistics</div>
              </div>
              <div className="view-options">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/a596cbe0638ef32530bc667ec818053e9585b1e23beaba7e39db2a185087af5b?"
                  className="img-40"
                  onClick={() => handleScreenshot(processStatisticsRef)}  // Capture referenceModelRef
                  style={{ cursor: 'pointer' }}
                />
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/8895bd9f8d97cf1ce797fbfd735df7d6f317969a72619e5b468bb33460611015?"
                  className="img-41"
                />
              </div>
            </div>
            <ProcessStatistics globalFilterTrigger={handleTabularFilterChange} graphCursorTrigger={handleGraphCursorChange} refreshTrigger={refreshTrigger} />
          </div>
          <div className="view" style={{ flex: '1'}} ref={criticalIncidentsRef}>
            <div className="view-header">
              <div className="view-title">
                <div className="view-color"/>
                <div className="view-name">Most critical Incidents</div>
              </div>
              <div className="view-options">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/a596cbe0638ef32530bc667ec818053e9585b1e23beaba7e39db2a185087af5b?"
                  className="img-40"
                  onClick={() => handleScreenshot(criticalIncidentsRef)}  // Capture criticalIncidentsRef
                  style={{ cursor: 'pointer' }}
                />
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/8895bd9f8d97cf1ce797fbfd735df7d6f317969a72619e5b468bb33460611015?"
                  className="img-41"
                />
              </div>
            </div>
            <CriticalIncidents refreshTrigger={refreshTrigger} height={200} />
          </div>
        </div>
        <div className="aggregated-view">
          {/* Complaince Development */}
          <div className="view" style={{ flex: '3'}} ref={complianceDevelopmentRef}>
            <div className="view-header">
              <div className="view-title">
                <div className="view-color" />
                <div className="view-name">Compliance Development</div>
              </div>
              <div className="view-options">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/a596cbe0638ef32530bc667ec818053e9585b1e23beaba7e39db2a185087af5b?"
                  className="img-40"
                  onClick={() => handleScreenshot(complianceDevelopmentRef)}  // Capture referenceModelRef
                  style={{ cursor: 'pointer' }}
                />
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/8895bd9f8d97cf1ce797fbfd735df7d6f317969a72619e5b468bb33460611015?"
                  className="img-41"
                />
              </div>
            </div>
            <ComplianceDevelopment refreshTrigger={refreshTrigger} />
          </div>

          {/* Compliance Distribution */}
          <div className="view" style={{ flex: '1'}} ref={complianceDistributionRef}>
            <div className="view-header">
              <div className="view-title">
                <div className="view-color"/>
                <div className="view-name">Compliance Distribution</div>
              </div>
              <div className="view-options">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/a596cbe0638ef32530bc667ec818053e9585b1e23beaba7e39db2a185087af5b?"
                  className="img-40"
                  onClick={() => handleScreenshot(complianceDistributionRef)}  // Capture complianceDistributionRef
                  style={{ cursor: 'pointer' }}
                />
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/8895bd9f8d97cf1ce797fbfd735df7d6f317969a72619e5b468bb33460611015?"
                  className="img-41"
                />
              </div>
            </div>
            <DistributionViolinPlot height={150} refreshTrigger={refreshTrigger} />
          </div>
        </div>
        {/* Third row of views */}
        <div className="aggregated-view">
          {/* Technical Analysis */}
          <div className="view" style={{ flex: '1.5'}} ref={technicalAnalysisRef}>
            <div className="div-258">
              <div className="div-259">
                <div className="div-260" />
                <div className="div-261">Technical Analysis</div>
              </div>
              <div className="div-262">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/247bed24a7d4f2c3c91739144cd671e38774320b936ec7e542e65ce70b7fb329?"
                  className="img-40"
                  onClick={() => handleScreenshot(technicalAnalysisRef)}  // Capture technicalAnalysisRef
                  style={{ cursor: 'pointer' }}
                />
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/475ecedfbaad1db822df345503478a70f3355aee312eff89648301026c86ddf2?"
                  className="img-77"
                />
              </div>
            </div>
            <TechnicalAnalysis height={250} globalFilterTrigger={handleTabularFilterChange} refreshTrigger={refreshTrigger}/>
          </div>

          {/* Tabular Analysis */}
          <div className="view" style={{ flex: '1.5'}} ref={tabularAnalysisRef}>
            <div className="div-258">
              <div className="div-259">
                <div className="div-260" />
                <div className="div-261">Tabular Analysis</div>
              </div>
              <div className="div-262">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/247bed24a7d4f2c3c91739144cd671e38774320b936ec7e542e65ce70b7fb329?"
                  className="img-40"
                  onClick={() => handleScreenshot(tabularAnalysisRef)}  // Capture tabularAnalysisRef
                  style={{ cursor: 'pointer' }}
                />
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/475ecedfbaad1db822df345503478a70f3355aee312eff89648301026c86ddf2?"
                  className="img-77"
                />
              </div>
            </div>
            <TabularAnalysis refreshTrigger={refreshTrigger} globalFilterTrigger={handleTabularFilterChange} selectionTabularChange={handleTabularSelectionChange}/>
          </div>

          {/* Individual Analysis */}
          <div className="view" style={{ flex: '0.5'}} ref={individualAnalysisRef}>
            <div className="div-258">
              <div className="div-259">
                <div className="div-260" />
                <div className="div-261">Individual Analysis</div>
              </div>
              <div className="div-262">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/247bed24a7d4f2c3c91739144cd671e38774320b936ec7e542e65ce70b7fb329?"
                  className="img-40"
                  onClick={() => handleScreenshot(individualAnalysisRef)}  // Capture individualAnalysisRef
                  style={{ cursor: 'pointer' }}
                />
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/475ecedfbaad1db822df345503478a70f3355aee312eff89648301026c86ddf2?"
                  className="img-77"
                />
              </div>
            </div>
            <IndividualAnalysis height={250} selectionTrigger={selectionTabularTrigger} updateAssessmentsResultsTrigger={handleWhatIfAnalysisUpdate}/>
          </div>
          <div className="view" style={{ flex: '0.5'}} ref={whatIfAnalysisRef}>
            <div className="div-258">
              <div className="div-259">
                <div className="div-287" />
                <div className="div-261">What-if Analysis</div>
              </div>
              <div className="div-262">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/247bed24a7d4f2c3c91739144cd671e38774320b936ec7e542e65ce70b7fb329?"
                  className="img-40"
                  onClick={() => handleScreenshot(whatIfAnalysisRef)}  // Capture individualAnalysisRef
                  style={{ cursor: 'pointer' }}
                />
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/475ecedfbaad1db822df345503478a70f3355aee312eff89648301026c86ddf2?"
                  className="img-77"
                />
              </div>
            </div>
            <WhatIfAnalysis height={250} refreshTrigger={handleSelectionChange} updateTrigger={whatIfAnalysisTrigger}/>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProcessAnalysis;
