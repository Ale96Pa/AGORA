import './ProcessAnalysis.css';
import CommonVariants from './CommonVariants.js';
import { useEffect, useState, useRef } from 'react';
import './ProcessStateTimes.js';
import DistributionPlot from './ComplianceDistribution.js';
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
import TimeStatistics from './TimeStatistics.js';
import html2canvas from 'html2canvas';  

const ProcessAnalysis = ({ analysisTrigger, updateProgress }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [selectionTabularTrigger, setTabularSelectionTrigger] = useState(false);
  const [globalFilterTrigger, setGlobalFilterTrigger] = useState(false);
  const [graphCursorTrigger, setGraphCursorTrigger] = useState(false);
  const [whatIfAnalysisTrigger, setWhatIfAnalysisTrigger] = useState(false);

  const [isModalVisible, setModalVisible] = useState(false);

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
  const [infoView, setInfoView] = useState(null);

  const viewInfoTexts = {
    processActivitiesAnalysis: "The Process Activities Analysis view provides different perspectives on the related metrics, compliance metric, process deviations and time durations while adhereing to the process-centric view from the Refernce Model view. Each view is collapsed by default showing the related metrics for each process activity. The top view (Compliance Development) can be expanded to show a graph that shows the temporal complaince development as a stacked bar chart represeinting the different process activities with distinct colours. The middle view provides the total numbers of deviations per activity that can be expanded to show the numbers of deviation typer per process activity. The lower view provides the average durations per activity and can be expanded to a temporal development graph stacked by process activities.",
    complianceDistributon: "The Compliance Distribution view provides a distribution plot of the compliance metric across all incidents. This allows to quickly identify the overall compliance posture and to spot non-conformities, areas of concern and findings.",
    criticalIncidents: "Provides the most critical incidents according to the selected compliance metric in a decreasing severity order.",
    technicalAnalysis: "The Technical Analysis provides insights into the technical attributes (symptoms, impact, urgency, priority, location & category) of incidents. The information are either displayed as summarizing pie charts or via a flow chart where each axis provides an attribute. Axis (except category are selectable or can be hidden. Each incident is represented as a line drifting through the chart. This view allows to identify patterns and correlations between different technical attributes of incidents.",
    tabularAnalysis: "Tabular Analysis displays selected incidents via the global filter mechanism in a table together with metrics, improtant to incident management for detailed review. Incidents my be bulk or single selected to appear within the Individual Analysis view.",
    individualAnalysis: "Individual Analysis allows assessment of single incidents or multiple selected incidents via the Tabular Analysis view. The incidents can than be collected within a tag and connected to a security control.",
    whatIfAnalysis: "What-if Analysis simulates alternative scenario outcomes by excluding previously defined incidents via tags from the overall assessment. This allows to quickly verify the impact on the overall compliance posture when certain incidents (findings, area of concerns and non-conformities) are not considered.",
  };
  const [currentRef, setCurrentRef] = useState(null);

  const openModalWithRef = (ref) => {
    setCurrentRef(ref);  // Set the current ref
    setModalVisible(true);  // Show the modal
  };

  const showViewInformation = (viewKey) => {
    setInfoView(viewKey);
  };

  const closeInfoModal = () => setInfoView(null);

  useEffect(() => {
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

  const handleUpdateProgress = () => {
    updateProgress();
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
            containerRef={currentRef} 
            updateProgress={handleUpdateProgress}
          />
      <div className="aggregated-views-container">
        <div className="aggregated-view">

          {/* Incidents Development */}
          <div className="view" style={{ flex: '3'}} ref={activeclosedIncidentsRef}>
            <div className="view-header">
              <div className="view-title">
                <div className="view-color" />
                <div className="view-name">Incidents Development</div>
              </div>
              <div className="view-options">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/a596cbe0638ef32530bc667ec818053e9585b1e23beaba7e39db2a185087af5b?"
                  className="img-bookmark"
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
            <IncidentsLineChart height={110} graphCursorTrigger={handleGraphCursorChange} refreshTrigger={refreshTrigger} />
          </div>

          {/* Statistical Analysis */}
          <div className="view" style={{ flex: '1'}} ref={statisticalAnalysisRef}>
            <div className="view-header">
              <div className="view-title">
                <div className="view-color" />
                <div className="view-name">Statistical Analysis</div>
              </div>
              <div className="view-options">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/b8802bce4b2328afc3828723fb3f6019547d9405c4147e72d184d0ccb80e867c?"
                  className="img-bookmark"
                  onClick={() => openModalWithRef(statisticalAnalysisRef)}  // Capture commonVariantsRef
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
                  className="img-bookmark"
                  onClick={() => openModalWithRef(referenceModelRef)}  // Capture referenceModelRef
                  style={{ cursor: 'pointer' }}
                />
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/8895bd9f8d97cf1ce797fbfd735df7d6f317969a72619e5b468bb33460611015?"
                  className="img-41"
                />
              </div>
            </div>
            <LinearizedPnmlVisualization height={100} refreshTrigger={refreshTrigger} />
          </div>

          {/* Common Variants */}
          <div className="view" style={{ flex: '1'}} ref={commonVariantsRef}>
            <div className="view-header">
              <div className="view-title">
                <div className="view-color" />
                <div className="view-name">Common Variants</div>
              </div>
              <div className="view-options">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/b8802bce4b2328afc3828723fb3f6019547d9405c4147e72d184d0ccb80e867c?"
                  className="img-bookmark"
                  onClick={() => openModalWithRef(commonVariantsRef)}  // Capture commonVariantsRef
                  style={{ cursor: 'pointer' }}
                />
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/79f3833540a5f686ca5f9e789cde206e3cc3439275efc77c26b77963765104f3?"
                  className="img-44"
                />
              </div>
            </div>
            <CommonVariants height={100} globalFilterTrigger={handleTabularFilterChange} refreshTrigger={refreshTrigger} />
          </div>
        </div>
        <div className="aggregated-view">
          {/* Process Statistics */}
          <div
            className="view"
            style={{ flex: '3', display: 'flex', flexDirection: 'column' , height: 'fixed'}}
            ref={processStatisticsRef}
          >
            <div className="view-header">
              <div className="view-title">
                <div className="view-color" />
                <div className="view-name">Process Activities Analysis</div>
              </div>
              <div className="view-options">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/a596cbe0638ef32530bc667ec818053e9585b1e23beaba7e39db2a185087af5b?"
                  className="img-bookmark"
                  onClick={() => openModalWithRef(processStatisticsRef)} // Capture referenceModelRef
                  style={{ cursor: 'pointer' }}
                />
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/8895bd9f8d97cf1ce797fbfd735df7d6f317969a72619e5b468bb33460611015?"
                  className="img-41"
                />
              </div>
            </div>


            <div className="view-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* ComplianceDevelopment Component */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                <ComplianceDevelopment refreshTrigger={refreshTrigger} />
              </div>

              <div className="divider" style={{ flex: '0 0 auto' }}></div>

              {/* ProcessStatistics Component */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <ProcessStatistics
                  globalFilterTrigger={handleTabularFilterChange}
                  graphCursorTrigger={handleGraphCursorChange}
                  refreshTrigger={refreshTrigger}
                />
              </div>

              <div className="divider" style={{ flex: '0 0 auto' }}></div>

              {/* TimeStatistics Component */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <TimeStatistics
                  globalFilterTrigger={handleTabularFilterChange}
                  graphCursorTrigger={handleGraphCursorChange}
                  refreshTrigger={refreshTrigger}
                />
              </div>
            </div>
          </div>
          <div className="view" style={{ flex: '1'}} ref={criticalIncidentsRef}>
            <div className="view-header">
              <div className="view-title">
                <div className="view-color"/>
                <div className="view-name">Compliance Distribution</div>
              </div>
              <div className="view-options">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/a596cbe0638ef32530bc667ec818053e9585b1e23beaba7e39db2a185087af5b?"
                  className="img-bookmark"
                  onClick={() => openModalWithRef(criticalIncidentsRef)}  // Capture criticalIncidentsRef
                  style={{ cursor: 'pointer' }}
                />
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/8895bd9f8d97cf1ce797fbfd735df7d6f317969a72619e5b468bb33460611015?"
                  className="img-41"
                />
              </div>
            </div>
            <DistributionPlot height={150} refreshTrigger={refreshTrigger} />
            <div className="view-header">
              <div className="view-title">
                <div className="view-color"/>
                <div className="view-name">Critical Incidents</div>
              </div>
              <div className="view-options">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/a596cbe0638ef32530bc667ec818053e9585b1e23beaba7e39db2a185087af5b?"
                  className="img-bookmark"
                  onClick={() => openModalWithRef(criticalIncidentsRef)}  // Capture criticalIncidentsRef
                  style={{ cursor: 'pointer' }}
                />
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/8895bd9f8d97cf1ce797fbfd735df7d6f317969a72619e5b468bb33460611015?"
                  className="img-41"
                />
              </div>
            </div>
            <CriticalIncidents refreshTrigger={refreshTrigger} height={250} />
          </div>
        </div>
        <div className="aggregated-view">
          {/* Technical Analysis */}
          <div className="view" style={{ flex: '1.5'}} ref={technicalAnalysisRef}>
            <div className="view-header">
              <div className="view-title">
                <div className="view-color" />
                <div className="view-name">Technical Analysis</div>
              </div>
              <div className="view-options">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/247bed24a7d4f2c3c91739144cd671e38774320b936ec7e542e65ce70b7fb329?"
                  className="img-bookmark"
                  onClick={() => openModalWithRef(technicalAnalysisRef)}
                  style={{ cursor: 'pointer' }}
                />
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/475ecedfbaad1db822df345503478a70f3355aee312eff89648301026c86ddf2?"
                  className="img-three-dots"
                  onClick={() => showViewInformation('technicalAnalysis')}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </div>

            <div className={`view-content${infoView === 'technicalAnalysis' ? ' blurred' : ''}`}>
              <TechnicalAnalysis height={210} globalFilterTrigger={handleTabularFilterChange} refreshTrigger={refreshTrigger}/>
            </div>

            {infoView === 'technicalAnalysis' && (
              <div className="view-info-overlay">
                <div className="view-info-content">
                  <button className="close-info-btn" onClick={closeInfoModal}>Close</button>
                  <h3>View Information</h3>
                  <p>{viewInfoTexts['technicalAnalysis']}</p>
                </div>
              </div>
            )}

          </div>

          {/* Tabular Analysis */}
          <div className="view" style={{ flex: '1.5'}} ref={tabularAnalysisRef}>
            <div className="view-header">
              <div className="view-title">
                <div className="view-color" />
                <div className="view-name">Tabular Analysis</div>
              </div>
              <div className="view-options">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/247bed24a7d4f2c3c91739144cd671e38774320b936ec7e542e65ce70b7fb329?"
                  className="img-bookmark"
                  onClick={() => openModalWithRef(tabularAnalysisRef)}  // Capture tabularAnalysisRef
                  style={{ cursor: 'pointer' }}
                />
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/475ecedfbaad1db822df345503478a70f3355aee312eff89648301026c86ddf2?"
                  className="img-three-dots"
                />
              </div>
            </div>
            <TabularAnalysis refreshTrigger={refreshTrigger} globalFilterTrigger={globalFilterTrigger} selectionTabularChange={handleTabularSelectionChange}/>
          </div>

          {/* Individual Analysis */}
          <div className="view" style={{ flex: '0.5'}} ref={individualAnalysisRef}>
            <div className="view-header">
              <div className="view-title">
                <div className="view-color" />
                <div className="view-name">Individual Analysis</div>
              </div>
              <div className="view-options">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/247bed24a7d4f2c3c91739144cd671e38774320b936ec7e542e65ce70b7fb329?"
                  className="img-bookmark"
                  onClick={() => openModalWithRef(individualAnalysisRef)}  // Capture individualAnalysisRef
                  style={{ cursor: 'pointer' }}
                />
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/475ecedfbaad1db822df345503478a70f3355aee312eff89648301026c86ddf2?"
                  className="img-three-dots"
                />
              </div>
            </div>
            <IndividualAnalysis height={210} selectionTrigger={selectionTabularTrigger} updateAssessmentsResultsTrigger={handleWhatIfAnalysisUpdate} updateProgress={handleUpdateProgress}/>
          </div>
          <div className="view" style={{ flex: '0.5'}} ref={whatIfAnalysisRef}>
            <div className="view-header">
              <div className="view-title">
                <div className="view-color" />
                <div className="view-name">What-if Analysis</div>
              </div>
              <div className="view-options">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/247bed24a7d4f2c3c91739144cd671e38774320b936ec7e542e65ce70b7fb329?"
                  className="img-bookmark"
                  onClick={() => openModalWithRef(whatIfAnalysisRef)}  // Capture individualAnalysisRef
                  style={{ cursor: 'pointer' }}
                />
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/475ecedfbaad1db822df345503478a70f3355aee312eff89648301026c86ddf2?"
                  className="img-three-dots"
                />
              </div>
            </div>
            <WhatIfAnalysis height={210} refreshTrigger={handleSelectionChange} updateTrigger={whatIfAnalysisTrigger}/>
          </div>
        </div>
      </div>
      {infoView && (
        <div className="view-info-modal">
          <div className="view-info-content">
            <button className="close-info-btn" onClick={closeInfoModal}>Close</button>
            <h3>View Information</h3>
            <p>{viewInfoTexts[infoView]}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProcessAnalysis;
