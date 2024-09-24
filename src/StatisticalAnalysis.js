import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import 'bootstrap/dist/css/bootstrap.min.css';
import './StatisticalAnalysis.css';
import { eel } from './App';  // Ensure eel is imported

const StatisticalAnalysis = ({ refreshTrigger }) => {
  // State to store the progress bar data
  const [percSLAMet, setPercSLAMet] = useState(0);
  const [avgToResolve, setAvgToResolve] = useState(0);
  const [percAssignedToResolved, setPercAssignedToResolved] = useState(0);
  const [percFalsePositives, setPercFalsePositives] = useState(0);
  const [selectedParts, setSelectedParts] = useState({
    sla: null,
    resolve: null,
    assigned: null,
    falsePositives: null,
  });

  // Refs for D3 rendering
  const slaRef = useRef();
  const resolveRef = useRef();
  const assignedRef = useRef();
  const falsePositivesRef = useRef();

  // Function to fetch statistical data from the backend
  const fetchStatisticalData = async () => {
    try {
      // Call the exposed function from the backend via Eel
      const result = await eel.get_statistical_analysis_data()();
      
      // Parse the JSON response
      const data = JSON.parse(result);

      // Update the state with the fetched data
      setPercSLAMet(data.perc_sla_met || 0);
      setAvgToResolve(data.avg_time_to_resolve || 0);
      setPercAssignedToResolved(data.perc_assigned_to_resolved_by || 0);
      setPercFalsePositives(data.perc_false_positives || 0);
    } catch (error) {
      console.error('Failed to fetch statistical data:', error);
    }
  };

  // Fetch data when the component mounts or when refreshTrigger changes
  useEffect(() => {
    fetchStatisticalData();
  }, [refreshTrigger]);

  // Function to handle bar click events
  const handleBarClick = async (metric, part) => {
    const isCoveredSelected = part === 'covered';
    const filterKey = {
      sla: 'filters.statistical_analysis.perc_sla_met',
      resolve: 'filters.statistical_analysis.avg_time_to_resolve',
      assigned: 'filters.statistical_analysis.perc_assigned_to_resolved_by',
      falsePositives: 'filters.statistical_analysis.perc_false_positives'
    };

    // Check if the selected part is the same as the current selection
    const isSameSelection = selectedParts[metric] === part;

    // If the same part is clicked again, deselect it
    const newSelectedPart = isSameSelection ? null : part;

    // Update the selected parts in the state
    setSelectedParts((prevSelected) => ({
      ...prevSelected,
      [metric]: newSelectedPart,
    }));

    try {
      // Update the backend filter value based on the click or deselection
      const filterValue = newSelectedPart ? isCoveredSelected : null; // If deselected, set to None
      await eel.set_filter_value(filterKey[metric], filterValue)();
      console.log(`Set filter ${filterKey[metric]} to ${filterValue}`);
    } catch (error) {
      console.error(`Failed to set filter for ${filterKey[metric]}:`, error);
    }
  };

  // Function to render the progress bars using D3
  const renderProgressBar = (ref, metric, value, isPercentage = true) => {
    const container = d3.select(ref.current);
    const width = container.node().getBoundingClientRect().width;
    const height = 30;
    const coveredWidth = (value / (isPercentage ? 100 : 240)) * width; // Adjust max value for non-percentage metrics
    const uncoveredWidth = width - coveredWidth;

    container.selectAll('*').remove(); // Clear previous content

    const svg = container.append('svg')
      .attr('width', width)
      .attr('height', height);

    // Covered part of the progress bar
    svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', coveredWidth)
      .attr('height', height)
      .attr('fill', 'green')
      .attr('stroke', selectedParts[metric] === 'covered' ? 'blue' : 'none')
      .attr('stroke-width', 3)
      .style('cursor', 'pointer')
      .on('click', () => handleBarClick(metric, 'covered'));

    // Uncovered part of the progress bar
    svg.append('rect')
      .attr('x', coveredWidth)
      .attr('y', 0)
      .attr('width', uncoveredWidth)
      .attr('height', height)
      .attr('fill', 'red')
      .attr('stroke', selectedParts[metric] === 'uncovered' ? 'blue' : 'none')
      .attr('stroke-width', 3)
      .style('cursor', 'pointer')
      .on('click', () => handleBarClick(metric, 'uncovered'));

    // Text label for progress value
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', '#000')
      .text(`${value} ${isPercentage ? '%' : ''}`) // Adjust for non-percentage metrics
      .style('font-size', '14px');
  };

  // Use useEffect to render the progress bars whenever the data or selection changes
  useEffect(() => {
    renderProgressBar(slaRef, 'sla', percSLAMet);
    renderProgressBar(resolveRef, 'resolve', avgToResolve, false); // Pass false for non-percentage metrics
    renderProgressBar(assignedRef, 'assigned', percAssignedToResolved);
    renderProgressBar(falsePositivesRef, 'falsePositives', percFalsePositives);
  }, [percSLAMet, avgToResolve, percAssignedToResolved, percFalsePositives, selectedParts]);

  return (
    <div className="progress-bars-layout">
      <div className="progress-box">
        <div className="name">PERC SLA MET</div>
        <div ref={slaRef}></div>
      </div>
      <div className="progress-box">
        <div className="name">AVG TIME TO RESOLVE</div>
        <div ref={resolveRef}></div>
      </div>
      <div className="progress-box-large">
        <div className="name">PERC ASSIGNED TO RESOLVED BY</div>
        <div ref={assignedRef}></div>
      </div>
      <div className="progress-box-large">
        <div className="name">FALSE POSITIVES</div>
        <div ref={falsePositivesRef}></div>
      </div>
    </div>
  );
};

export default StatisticalAnalysis;
