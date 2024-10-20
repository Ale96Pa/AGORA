import React, { useEffect, useState } from 'react';
import { eel } from './App'; // Assuming eel is set up in your App
import './ComplianceDevelopment.css'; // Custom CSS for layout and styling
import Collapsible from 'react-collapsible';
import ProcessComplianceBarChart from './ProcessComplianceBarChart';


const ComplianceDevelopment = ({ refreshTrigger }) => {
  const [statesData, setStatesData] = useState([]);

  useEffect(() => {
    // Fetch state mapping, compliance data, and compliance metric
    const fetchData = async () => {
      try {
        // Fetch state mapping from eel
        const states = await eel.read_mapping_from_file()();
        const compliance = JSON.parse(await eel.get_average_compliance_per_state()());
        const compliance_metric = await eel.get_filter_value('filters.compliance_metric')();

        // Process data for each state
        const statesArray = Object.keys(states).map((state) => {
          const stateId = states[state];
          const compValue = parseFloat(compliance[stateId]);

          return {
            state,
            compliance_metric: compliance_metric.toUpperCase(),
            comp: compValue, // Ensure comp is a number
          };
        });

        setStatesData(statesArray);
      } catch (error) {
        console.error('Error fetching states data from eel:', error);
      }
    };

    fetchData();
  }, [refreshTrigger]);

  // Helper function to determine color based on comp value
  const determineColor = (compValue) => {
    if (compValue <= 0.1) {
      return 'red';
    } else if (compValue > 0.1 && compValue < 0.15) {
      return 'orange';
    } else {
      return 'green';
    }
  };

  return (
    <div className="visualization-wrapper">
      {/* Right column with values */}
      <div className="layer-values">
        {/* COMP Row */}
        <Collapsible
          trigger={[
            <div className="layer-row full-width-trigger" key="comp-trigger">
              {statesData.map((state, i) => (
                <div
                  className="state-column"
                  key={`comp-${i}`}
                  style={{ color: determineColor(state.comp) }}
                >
                  AVG {state.compliance_metric} {state.comp}
                </div>
              ))}
            </div>,
          ]}
        >
          <ProcessComplianceBarChart height={111} refreshTrigger={refreshTrigger} />
        </Collapsible>
      </div>
    </div>
  );
};

export default ComplianceDevelopment;
