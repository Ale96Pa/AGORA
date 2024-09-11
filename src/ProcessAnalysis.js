import './ProcessAnalysis.css';
import createProgressBar from './progress_bar.js';
import tabular from './tabular.js'
import visualizePnml from './visualize_pnml.js';
import CommonVariants from './common_variants.js';
import IncidentSelection from './incident_selection.js';
import { useEffect, useState } from 'react';
import './ProcessStateTimes.js';
import DistributionViolinPlot from './ComplianceDistributionViolinPlot.js';
import { eel } from './App';
import TechnicalAnalysis from './TechnicalAnalysis.js';
import LinearizedPnmlVisualization from './LinearizedPnmlVisualization.js';
import IndividualAnalysis from './IndividualAnalysis.js';
import ProcessIndicatorsVisualization from './ProcessIndicatorsVisualization.js';
import IncidentsLineChart from './IncidentsLineChart.js';

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
  // Add a state for refreshTrigger
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  const fetchData = async () => {
    try {
      createProgressBar('compliance-progress-container', await eel.get_incident_compliance_metric()(), [0, 1]);
      tabular('table-container');
      const pnmlData = await getPNML();
      visualizePnml('pnml-container', pnmlData);
      
    } catch (error) {
      console.error('An error occurred:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]); // Include refreshTrigger in the dependency array

  const handleSelectionChange = () => {
    // Toggle the refreshTrigger to force re-render of the chart
    setRefreshTrigger(prev => !prev);
    // Re-fetch all the data and update visualizations based on the new date range
    fetchData();
  };

  return (
    <div className="conduct-audit-activities">
      <div className="div-114">
        <div className="aggregated-view">
          <div className="view" style={{ flex: '2'}}>
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
                />
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/8895bd9f8d97cf1ce797fbfd735df7d6f317969a72619e5b468bb33460611015?"
                  className="img-41"
                />
              </div>
            </div>
            <IncidentSelection onSelectionChange={handleSelectionChange} />
            <div id="compliance-progress-container"></div>
            <div className="tag-container">
              <div className="tags-box">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/c2f5e035522b816cb51a71137ab4407d6be46a71358d3cb0e7e8c02a54f78df7?"
                  className="img-75"
                />
                <div className="div-252">
                  <div className="tag">Selected Incidents</div>
                  <div className="tag">Compliance Meter</div>
                </div>
              </div>
            </div>
            <div className="name">STATISTICAL ANALYSIS</div>
            <div className="name">ACTIVE/(COMPLIANT)CLOSED INCIDENTS OVER TIME</div>
            <IncidentsLineChart height={300} refreshTrigger={refreshTrigger} />
          </div>
          <div className="view" style={{ flex: '3'}}>
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
                />
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/8895bd9f8d97cf1ce797fbfd735df7d6f317969a72619e5b468bb33460611015?"
                  className="img-41"
                />
              </div>
            </div>
            <LinearizedPnmlVisualization height={150} refreshTrigger={refreshTrigger} />
            <ProcessIndicatorsVisualization refreshTrigger={refreshTrigger} />
          </div>
          <div className="view" style={{ flex: '1'}}>
            <div className="div-155">
              <div className="div-156">
                <div className="div-157" />
                <div className="div-158">Common Variants</div>
              </div>
              <div className="div-159">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/b8802bce4b2328afc3828723fb3f6019547d9405c4147e72d184d0ccb80e867c?"
                  className="img-43"
                />
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/79f3833540a5f686ca5f9e789cde206e3cc3439275efc77c26b77963765104f3?"
                  className="img-44"
                />
              </div>
            </div>
            <CommonVariants height={200} refreshTrigger={refreshTrigger} />
            <div className="name">MOST CRITICAL INCIDENTS TBD</div>
            <div className="name">COMPLIANCE DISTRIBUTION</div>
            <DistributionViolinPlot height={250} refreshTrigger={refreshTrigger} />
            <div className="tag-container">
              <div className="tags-box">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/93e295a61d18502fff4488b64966b7279dba43b5b9d37df2b7f3b3bfda6ed02e?"
                  className="img-45"
                />
                <div className="tag">Common Variants</div>
              </div>
            </div>
          </div>
        </div>
        <div className="aggregated-view">
          <div className="div-256">
            <div className="view" style={{ flex: '2'}}>
              <div className="div-258">
                <div className="div-259">
                  <div className="div-260" />
                  <div className="div-261">Technical Analysis</div>
                </div>
                <div className="div-262">
                  <img
                    loading="lazy"
                    src="https://cdn.builder.io/api/v1/image/assets/TEMP/247bed24a7d4f2c3c91739144cd671e38774320b936ec7e542e65ce70b7fb329?"
                    className="img-76"
                  />
                  <img
                    loading="lazy"
                    src="https://cdn.builder.io/api/v1/image/assets/TEMP/475ecedfbaad1db822df345503478a70f3355aee312eff89648301026c86ddf2?"
                    className="img-77"
                  />
                </div>
              </div>
              <TechnicalAnalysis height={300}/>
            </div>
            <div className="view" style={{ flex: '2'}}>
              <div className="div-258">
                <div className="div-259">
                  <div className="div-260" />
                  <div className="div-261">Tabular Analysis</div>
                </div>
                <div className="div-262">
                  <img
                    loading="lazy"
                    src="https://cdn.builder.io/api/v1/image/assets/TEMP/247bed24a7d4f2c3c91739144cd671e38774320b936ec7e542e65ce70b7fb329?"
                    className="img-76"
                  />
                  <img
                    loading="lazy"
                    src="https://cdn.builder.io/api/v1/image/assets/TEMP/475ecedfbaad1db822df345503478a70f3355aee312eff89648301026c86ddf2?"
                    className="img-77"
                  />
                </div>
              </div>
              <div id="table-container"></div>
              <div className="tag-container">
                <div className="tags-box">
                  <img
                    loading="lazy"
                    src="https://cdn.builder.io/api/v1/image/assets/TEMP/c2f5e035522b816cb51a71137ab4407d6be46a71358d3cb0e7e8c02a54f78df7?"
                    className="img-75"
                  />
                  <div className="div-252">
                    <div className="tag">Tabular Analysis</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="view" style={{ flex: '1'}}>
              <div className="div-258">
                <div className="div-259">
                  <div className="div-260" />
                  <div className="div-261">Individual Analysis</div>
                </div>
                <div className="div-262">
                  <img
                    loading="lazy"
                    src="https://cdn.builder.io/api/v1/image/assets/TEMP/247bed24a7d4f2c3c91739144cd671e38774320b936ec7e542e65ce70b7fb329?"
                    className="img-76"
                  />
                  <img
                    loading="lazy"
                    src="https://cdn.builder.io/api/v1/image/assets/TEMP/475ecedfbaad1db822df345503478a70f3355aee312eff89648301026c86ddf2?"
                    className="img-77"
                  />
                </div>
              </div>
              <IndividualAnalysis height="500px" />
              <div className="tag-container">
                <div className="tags-box">
                  <img
                    loading="lazy"
                    src="https://cdn.builder.io/api/v1/image/assets/TEMP/c2f5e035522b816cb51a71137ab4407d6be46a71358d3cb0e7e8c02a54f78df7?"
                    className="img-75"
                  />
                  <div className="div-252">
                    <div className="tag">Individual Analysis</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="div-284">
            <div className="div-285">
              <div className="div-286">
                <div className="div-287" />
                <div className="div-288">What-if Analysis</div>
              </div>
              <div className="div-289">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/8791a28fd8fdd1db22786bc32c1411c012ed991e5dcdea6907e9ea89771d1781?"
                  className="img-85"
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
                  className="img-87"
                />
                <div className="tag" style={{ backgroundColor: 'rgba(255, 0, 122, 0.5)' }}>What-if Analysis</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProcessAnalysis;
