import React, { useEffect, useState } from 'react';
import { eel } from './App';
import './ProcessStatistics.css';
import Collapsible from 'react-collapsible';
import ProcessStateTimes from './ProcessStateTimes';
import DeviationsBarChart from './DeviationsBarChart';

const ProcessStatistics = ({ globalFilterTrigger, graphCursorTrigger, refreshTrigger }) => {
  const [statesData, setStatesData] = useState([]);
  const [loading, setLoading] = useState(false);

  const convertDurationToMinutes = (duration) => {
    // Initialize total minutes to 0
    let totalMinutes = 0;

    // Regular expression to match 'Xd', 'Xh', and 'Xmin' parts
    const daysMatch = duration.match(/(\d+)d/); // Matches '7d'
    const hoursMatch = duration.match(/(\d+)h/); // Matches '16h'
    const minutesMatch = duration.match(/(\d+)min/); // Matches '37min'

    // If 'days' part exists, convert to minutes and add to total
    if (daysMatch) {
      const days = parseInt(daysMatch[1], 10); // Extract number of days
      totalMinutes += days * 1440; // Convert days to minutes (1 day = 1440 minutes)
    }

    // If 'hours' part exists, convert to minutes and add to total
    if (hoursMatch) {
      const hours = parseInt(hoursMatch[1], 10); // Extract number of hours
      totalMinutes += hours * 60; // Convert hours to minutes (1 hour = 60 minutes)
    }

    // If 'minutes' part exists, directly add to total
    if (minutesMatch) {
      const minutes = parseInt(minutesMatch[1], 10); // Extract number of minutes
      totalMinutes += minutes; // Add minutes directly
    }

    return totalMinutes;
  };


  useEffect(() => {
    // Fetch state mapping, deviations, and durations
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch state mapping from eel
        const [states, deviations] = await Promise.all([
          eel.read_mapping_from_file()(),
          eel.count_frequencies()(),
        ]);
        

        const filters = await eel.get_filter_value('filters')();
        const assessmentFilters = filters.thresholds;

        // Calculate deviations and durations for each state
        const statesArray = Object.keys(states).map(state => {
          const stateId = states[state];
          console.log(state);
          // Sum deviations (missing, repetition, mismatch) for each state
          const totalDeviations = 
            deviations.missing[stateId] +
            deviations.repetition[stateId] +
            deviations.mismatch[stateId];

          console.log(stateId, state);
          console.log(deviations.missing[stateId] > assessmentFilters[state].deviations.acceptableMissing.replace('<=', ''));
          // Determine if any deviations exceed acceptable thresholds
          const deviationExceedsThreshold = (
            deviations.missing[stateId] > assessmentFilters[state].deviations.acceptableMissing.replace('<=', '') ||
            deviations.repetition[stateId] > assessmentFilters[state].deviations.acceptableRepetition.replace('<=', '') ||
            deviations.mismatch[stateId] > assessmentFilters[state].deviations.acceptableMismatch.replace('<=', '')
          );

          console.log(deviationExceedsThreshold);

          return {
            state,
            deviations: totalDeviations,
            exceedsThreshold: deviationExceedsThreshold,
          };
        });

        setStatesData(statesArray);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching states data from eel:", error);
      }
    };

    fetchData();
  }, [refreshTrigger]);

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
          
          {/* DEVIATIONS Row */}
          <Collapsible
            trigger={[
              <div className="layer-row full-width-trigger" key="deviations-trigger">
                {statesData.map((state) => (
                  <div
                    className="state-column"
                    key={`deviations-${state.state}`} // Unique key for each state
                    style={{ color: state.exceedsThreshold ? 'red' : 'green' }} // Color based on threshold comparison
                  >
                    TOT DEV {state.deviations}
                  </div>
                ))}
              </div>,
            ]}
          >
            <DeviationsBarChart height={40} globalFilterTrigger={globalFilterTrigger} refreshTrigger={refreshTrigger} />
          </Collapsible>
        </div>
      </div>
    </div>
  );
};

export default ProcessStatistics;
