import React, { useEffect, useState } from 'react';
import { eel } from './App'; // Assuming eel is set up in your App
import './ProcessIndicatorsVisualization.css'; // Custom CSS for layout and styling
import Collapsible from 'react-collapsible';
import ProcessStateTimes from './ProcessStateTimes';
import DeviationsBarChart from './DeviationsBarChart';

const ProcessStatistics = ({ globalFilterTrigger, graphCursorTrigger, refreshTrigger }) => {
  const [statesData, setStatesData] = useState([]);

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
      try {
        // Fetch state mapping from eel
        const states = await eel.read_mapping_from_file()();
        const deviations = await eel.count_frequencies()();
        const durations = await eel.get_average_state_times()();

        const filters = await eel.get_filter_value('filters')();
        const assessmentFilters = filters.thresholds;

        console.log(assessmentFilters);
        console.log(states);
        console.log(deviations);
        // Calculate deviations and durations for each state
        const statesArray = Object.keys(states).map(state => {
          const stateId = states[state];
          console.log(state);
          // Sum deviations (missing, repetition, mismatch) for each state
          const totalDeviations = 
            deviations.missing[stateId] +
            deviations.repetition[stateId] +
            deviations.mismatch[stateId];

          // Get the corresponding duration for each state
          const duration = durations[stateId] || '0h'; // Fallback to '0h' if not available
          const durationInMinutes = convertDurationToMinutes(duration);

          console.log(stateId, state);
          console.log(deviations.missing[stateId] > assessmentFilters[state].deviations.acceptableMissing.replace('<=', ''));
          // Determine if any deviations exceed acceptable thresholds
          const deviationExceedsThreshold = (
            deviations.missing[stateId] > assessmentFilters[state].deviations.acceptableMissing.replace('<=', '') ||
            deviations.repetition[stateId] > assessmentFilters[state].deviations.acceptableRepetition.replace('<=', '') ||
            deviations.mismatch[stateId] > assessmentFilters[state].deviations.acceptableMismatch.replace('<=', '')
          );

          // Determine if duration is within acceptable or non-acceptable thresholds
          const acceptableTime = parseInt(assessmentFilters[state].acceptableTime.replace('<=', ''), 10);
          const nonAcceptableTime = parseInt(assessmentFilters[state].nonAcceptableTime.replace('>=', ''), 10);

          let durationColor = 'orange'; // Default to orange (between acceptable and non-acceptable)
          if (durationInMinutes <= acceptableTime) {
            durationColor = 'green'; // Within acceptable time
          } else if (durationInMinutes >= nonAcceptableTime) {
            durationColor = 'red'; // Exceeds non-acceptable time
          }

          console.log(deviationExceedsThreshold);

          return {
            state,
            deviations: totalDeviations,
            durations: duration,
            exceedsThreshold: deviationExceedsThreshold, durationColor
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
        
        {/* DEVIATIONS Row */}
        <Collapsible
          trigger={[<div className="layer-row full-width-trigger">
            {statesData.map((state, i) => (
              <div
                className="state-column"
                key={`deviations-${i}`}
                style={{ color: state.exceedsThreshold ? 'red' : 'green' }} // Color based on threshold comparison
              >
                DEV {state.deviations} 
              </div>
            ))}
          </div>]}>
          <DeviationsBarChart height={40} globalFilterTrigger={globalFilterTrigger} refreshTrigger={refreshTrigger} />
        </Collapsible>

        {/* DURATIONS Row */}
        <Collapsible
          trigger={[
            <div className="layer-row full-width-trigger">
              {statesData.map((state, i) => (
                <div
                  className="state-column"
                  key={`durations-${i}`}
                  style={{ color: state.durationColor }} // Color based on time thresholds
                >
                  AVGt {state.durations}
                </div>
              ))}
            </div>]}>
          <ProcessStateTimes height={120} graphCursorTrigger={graphCursorTrigger} refreshTrigger={refreshTrigger} />
        </Collapsible>
      </div>
    </div>
  );
};

export default ProcessStatistics;
