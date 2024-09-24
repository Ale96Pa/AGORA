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
import ProcessIndicatorsVisualization from './ProcessIndicatorsVisualization.js';
import IncidentsLineChart from './IncidentsLineChart.js';
import CriticalIncidents from './CriticalIncidents.js';
import StatisticalAnalysis from './StatisticalAnalysis.js';
import TabularAnalysis from './TabularAnalysis.js';
import ComplianceBar from './ComplianceBar.js';
import ProcessStatistics from './ProcessStatistics.js';
import ComplianceDevelopment from './ComplianceDevelopment.js';
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

function ProcessAnalysis() {
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [selectionTabularTrigger, setTabularSelectionTrigger] = useState(false);
  
  // Create separate refs for each view container
  const overviewMetricsRef = useRef(null);
  const statisticalAnalysisRef = useRef(null);
  const incidentsLineChartRef = useRef(null);
  const referenceModelRef = useRef(null);
  const commonVariantsRef = useRef(null);
  const criticalIncidentsRef = useRef(null);
  const complianceDistributionRef = useRef(null);
  const technicalAnalysisRef = useRef(null);
  const tabularAnalysisRef = useRef(null);
  const individualAnalysisRef = useRef(null);
  const whatIfAnalysisRef = useRef(null);

  const fetchData = async () => {
    try {
      const pnmlData = await getPNML();
    } catch (error) {
      console.error('An error occurred:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  const handleSelectionChange = () => {
    setRefreshTrigger(prev => !prev);
    fetchData();
  };

  const handleTabularSelectionChange = () => {
    setTabularSelectionTrigger(prev => !prev);
    console.log("Process trigger");
  };

  // Function to handle the screenshot capture
  const handleScreenshot = async (ref) => {
    if (ref.current) {
      try {
        const canvas = await html2canvas(ref.current);  // Capture the screenshot
        const image = canvas.toDataURL("image/png");  // Convert the canvas to a data URL

        // Create a link element to download the screenshot
        const link = document.createElement('a');
        link.href = image;
        link.download = 'process_analysis_screenshot.png';  // Name of the downloaded image
        link.click();  // Programmatically click the link to trigger the download

      } catch (error) {
        console.error("Screenshot capture failed:", error);
      }
    }
  };

  return (
    <div className="conduct-audit-activities">
      <div className="div-114">
        <div className="aggregated-view">
          {/* Overview Metrics */}
          <div className="view" style={{ flex: '2'}} ref={overviewMetricsRef}>
            <div className="view-header">
              <div className="view-title">
                <div className="view-color"/>
                <div className="view-name">Overview Metrics</div>
              </div>
              <div className="view-options">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/a596cbe0638ef32530bc667ec818053e9585b1e23beaba7e39db2a185087af5b?"
                  className="img-40"
                  onClick={() => handleScreenshot(overviewMetricsRef)}  // Capture overviewMetricsRef
                  style={{ cursor: 'pointer' }}
                />
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/8895bd9f8d97cf1ce797fbfd735df7d6f317969a72619e5b468bb33460611015?"
                  className="img-41"
                />
              </div>
            </div>
            <IncidentSelection onSelectionChange={handleSelectionChange} />
            <ComplianceBar refreshtrigger={refreshTrigger} />
          </div>

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
            <LinearizedPnmlVisualization height={150} refreshTrigger={refreshTrigger} />
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
            <CommonVariants height={150} refreshTrigger={refreshTrigger} />
          </div>
        </div>
        <div className="aggregated-view">
          <div className="view" style={{ flex: '2'}} ref={overviewMetricsRef}>
            <div className="view-header">
              <div className="view-title">
                <div className="view-color"/>
                <div className="view-name">Statistical Analysis</div>
              </div>
              <div className="view-options">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/a596cbe0638ef32530bc667ec818053e9585b1e23beaba7e39db2a185087af5b?"
                  className="img-40"
                  onClick={() => handleScreenshot(statisticalAnalysisRef)}  // Capture statisticalAnalysisRef
                  style={{ cursor: 'pointer' }}
                />
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/8895bd9f8d97cf1ce797fbfd735df7d6f317969a72619e5b468bb33460611015?"
                  className="img-41"
                />
              </div>
            </div>
            <StatisticalAnalysis refreshTrigger={refreshTrigger} />
          </div>

          {/* Reference Model */}
          <div className="view" style={{ flex: '3'}} ref={referenceModelRef}>
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
            <ProcessStatistics refreshTrigger={refreshTrigger} />
          </div>
          <div className="view" style={{ flex: '1'}} ref={commonVariantsRef}>
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
          {/* Overview Metrics */}
          <div className="view" style={{ flex: '2'}} ref={overviewMetricsRef}>
            <div className="view-header">
              <div className="view-title">
                <div className="view-color"/>
                <div className="view-name">Active/(compliant)closed Incidents</div>
              </div>
              <div className="view-options">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/a596cbe0638ef32530bc667ec818053e9585b1e23beaba7e39db2a185087af5b?"
                  className="img-40"
                  onClick={() => handleScreenshot(incidentsLineChartRef)}  // Capture incidentsLineChartRef
                  style={{ cursor: 'pointer' }}
                />
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/8895bd9f8d97cf1ce797fbfd735df7d6f317969a72619e5b468bb33460611015?"
                  className="img-41"
                />
              </div>
            </div>
            <IncidentsLineChart height={300} refreshTrigger={refreshTrigger} />
          </div>

          {/* Reference Model */}
          <div className="view" style={{ flex: '3'}} ref={referenceModelRef}>
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
            <ComplianceDevelopment refreshTrigger={refreshTrigger} />
          </div>

          {/* Common Variants */}
          <div className="view" style={{ flex: '1'}} ref={commonVariantsRef}>
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
            <DistributionViolinPlot height={250} refreshTrigger={refreshTrigger} />
            <div className="tag-container">
              <div className="tags-box">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/93e295a61d18502fff4488b64966b7279dba43b5b9d37df2b7f3b3bfda6ed02e?"
                  className="img-40"
                  onClick={() => handleScreenshot(commonVariantsRef)}  // Capture commonVariantsRef again
                  style={{ cursor: 'pointer' }}
                />
                <div className="tag">Common Variants</div>
              </div>
            </div>
          </div>
        </div>
        {/* Second row of views */}
        <div className="aggregated-view">
          {/* Technical Analysis */}
          <div className="view" style={{ flex: '2'}} ref={technicalAnalysisRef}>
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
            <TechnicalAnalysis height={300} refreshTrigger={refreshTrigger}/>
          </div>

          {/* Tabular Analysis */}
          <div className="view" style={{ flex: '2'}} ref={tabularAnalysisRef}>
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
            <TabularAnalysis refreshTrigger={refreshTrigger} selectionTabularChange={handleTabularSelectionChange}/>
          </div>

          {/* Individual Analysis */}
          <div className="view" style={{ flex: '1'}} ref={individualAnalysisRef}>
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
            <IndividualAnalysis height="500px" selectionTrigger={selectionTabularTrigger}/>
          </div>
        </div>

        {/* What-if Analysis */}
        <div className="div-284">
          <div className="div-285">
            <div className="div-286">
              <div className="div-287" />
              <div className="div-288">What-if Analysis</div>
            </div>
            <div className="div-289" ref={whatIfAnalysisRef}>
              <img
                loading="lazy"
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/8791a28fd8fdd1db22786bc32c1411c012ed991e5dcdea6907e9ea89771d1781?"
                className="img-85"
                onClick={() => handleScreenshot(whatIfAnalysisRef)}  // Capture whatIfAnalysisRef
                style={{ cursor: 'pointer' }}
              />
              <img
                loading="lazy"
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/4e52e004c4802f530ad05dfa28f94e77af82baabec24af27e3d58fe9bdda438d?"
                className="img-86"
              />
            </div>
          </div>
          <div className="tag-container">
            <div className="tags-box">
              <img
                loading="lazy"
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/887e66b7ec60c5d2eb2f7551362639e4e7ef1b40b9685fbc7762b3c3fb07a503?"
                className="img-40"
                onClick={() => handleScreenshot(whatIfAnalysisRef)}  // Capture whatIfAnalysisRef again
                style={{ cursor: 'pointer' }}
              />
              <div className="tag" style={{ backgroundColor: 'rgba(255, 0, 122, 0.5)' }}>What-if Analysis</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProcessAnalysis;
