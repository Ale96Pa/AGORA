import React, { useEffect, useState } from 'react';
import { eel } from './App'; // Assuming eel is set up in your App
import './ProcessIndicatorsVisualization.css'; // Custom CSS for layout and styling
import Collapsible from 'react-collapsible';
import ProcessStateTimes from './ProcessStateTimes';
import ProcessComplianceBarChart from './ProcessComplianceBarChart';
import DeviationsBarChart from './DeviationsBarChart';

const ComplianceDevelopment = ({ refreshTrigger }) => {
  const [statesData, setStatesData] = useState([]);

  useEffect(() => {
    // Fetch state mapping, deviations, and durations
    const fetchData = async () => {
      try {
        // Fetch state mapping from eel
        const states = await eel.read_mapping_from_file()();
        const compliance = JSON.parse(await eel.get_average_compliance_per_state()());
        const compliance_metric = await eel.get_filter_value('filters.compliance_metric')();
        // Calculate deviations and durations for each state
        const statesArray = Object.keys(states).map(state => {
          const stateId = states[state];
          console.log(stateId);
          console.log(compliance[stateId]);
          return {
            state,
            compliance_metric: compliance_metric.toUpperCase(),
            comp: compliance[stateId] * 4// Simulated compliance percentage
          };
        });

        setStatesData(statesArray);
      } catch (error) {
        console.error("Error fetching states data from eel:", error);
      }
    };

    fetchData();
  }, [refreshTrigger]);

  return (
    <div className="visualization-wrapper">
      {/* Right column with values */}
      <div className="layer-values">

        {/* COMP Row */}
        <Collapsible
          trigger={[
            <div className="layer-row full-width-trigger">
              {statesData.map((state, i) => (
                <div className="state-column" key={`comp-${i}`}>
                  AVG {state.compliance_metric} {state.comp}
                </div>
              ))}
            </div>]}>
          <ProcessComplianceBarChart height={130} refreshTrigger={refreshTrigger} />
        </Collapsible>
      </div>
    </div>
  );
};

export default ComplianceDevelopment;
