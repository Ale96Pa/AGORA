import React, { useEffect, useState } from 'react';
import { eel } from './App'; // Assuming eel is set up in your App
import './ComplianceDevelopment.css'; // Custom CSS for layout and styling
import Collapsible from 'react-collapsible';
import ProcessComplianceBarChart from './ProcessComplianceBarChart';

const ComplianceDevelopment = ({ refreshTrigger }) => {
  const [statesData, setStatesData] = useState([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch state mapping, compliance data, and compliance metric
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch state mapping from eel
        const states = await eel.read_mapping_from_file()(); // Directly use the returned JavaScript object
        const compliance = await eel.get_average_compliance_per_state()(); // Directly use the returned JavaScript object
        const compliance_metric = await eel.get_filter_value('filters.compliance_metric')(); // Directly use the returned value

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
        setLoading(false);
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
    <div style={{ position: 'relative' }}>
      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(30,30,30,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10
        }}>
          <div className="spinner" />
        </div>
      )}
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
    </div>
  );
};

export default ComplianceDevelopment;
