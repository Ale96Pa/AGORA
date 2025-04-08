import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import 'bootstrap/dist/css/bootstrap.min.css';
import './StatisticalAnalysis.css';
import { eel } from './App';  // Ensure eel is imported

const StatisticalAnalysis = ({ globalFilterTrigger, refreshTrigger }) => {
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

  // Helper function to convert minutes to XXd, XXh, XXm format
  const convertMinutesToReadableFormat = (minutes) => {
    const days = Math.floor(minutes / (60 * 24));
    const hours = Math.floor((minutes % (60 * 24)) / 60);
    const remainingMinutes = Math.floor(minutes % 60);

    const dayText = days > 0 ? `${days}d ` : '';
    const hourText = hours > 0 ? `${hours}h ` : '';
    const minuteText = remainingMinutes > 0 ? `${remainingMinutes}m` : '';

    return `${dayText}${hourText}${minuteText}`.trim() || '0m';
  };

  // Severity levels for TTR
  const severityLevels = {
    low: [0, 1440],          // 0-1 day in minutes
    moderate: [1440, 4320],  // 1-3 days in minutes
    high: [4320, 10080],     // 3-7 days in minutes
  };

  const severityColors = {
    low: 'green',
    moderate: 'orange',
    high: 'red',
  };

  // Function to handle bar click events
  const handleBarClick = async (metric, part) => {
    const isCoveredSelected = part === 'covered';
    const filterKey = {
      sla: 'filters.statistical_analysis.perc_sla_met',
      resolve: 'filters.statistical_analysis.avg_time_to_resolve',
      assigned: 'filters.statistical_analysis.perc_assigned_to_resolved_by',
      falsePositives: 'filters.statistical_analysis.perc_false_positives'
    };

    const isSameSelection = selectedParts[metric] === part;

    const newSelectedPart = isSameSelection ? null : part;

    setSelectedParts((prevSelected) => ({
      ...prevSelected,
      [metric]: newSelectedPart,
    }));

    try {
      const filterValue = newSelectedPart ? isCoveredSelected : null;
      await eel.set_filter_value(filterKey[metric], filterValue)();
      globalFilterTrigger();
      console.log(`Set filter ${filterKey[metric]} to ${filterValue}`);
    } catch (error) {
      console.error(`Failed to set filter for ${filterKey[metric]}:`, error);
    }
  };

  // Function to render the progress bar using D3 for TTR
  const renderTTRProgressBar = (ref, valueInMinutes) => {
    const container = d3.select(ref.current);
    const width = container.node().getBoundingClientRect().width;
    const height = 15;
    const min = 0;
    const max = severityLevels.high[1]; // Max time from high severity level
    const scaledProgress = ((valueInMinutes - min) / (max - min)) * 100;
    const cappedScaledProgress = Math.min(scaledProgress, 100); // Cap at 100%
    const adjustedValue = Math.min(valueInMinutes, max); // Adjust value if it exceeds max

    container.selectAll('*').remove(); // Clear previous content

    const svg = container.append('svg')
      .attr('width', width)
      .attr('height', height);

    // Create severity ranges
    Object.keys(severityLevels).forEach(level => {
      const [rangeStart, rangeEnd] = severityLevels[level];
      const startPos = (width * (rangeStart - min)) / (max - min);
      const endPos = (width * (rangeEnd - min)) / (max - min);
      const severityWidth = endPos - startPos;

      svg.append('rect')
        .attr('x', startPos)
        .attr('y', 0)
        .attr('width', severityWidth > 0 ? severityWidth : 0) // Ensure no negative width
        .attr('height', height)
        .attr('fill', severityColors[level]);
    });

    // Display the readable format of time (XXd, XXh, XXm) in the middle
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .text(convertMinutesToReadableFormat(valueInMinutes))
      .style('font-size', '14px');

    // If value exceeds max, adjust the line and text
    if (valueInMinutes > max) {
      // Move dashed line to the right edge
      svg.select('line')
        .attr('x1', width)
        .attr('x2', width);

      // Indicate that the value exceeds the maximum
      svg.select('text')
        .text(`${convertMinutesToReadableFormat(valueInMinutes)}+`);
    }
  };

  // Function to render the progress bars using D3 for percentage values
  const renderProgressBar = (ref, metric, value, isPercentage = true) => {
    const container = d3.select(ref.current);
    const width = container.node().getBoundingClientRect().width;
    const height = 15;
    const coveredWidth = (value / (isPercentage ? 100 : 240)) * width;
    const uncoveredWidth = width - coveredWidth;

    container.selectAll('*').remove(); // Clear previous content

    const svg = container.append('svg')
      .attr('width', width)
      .attr('height', height);

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

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .text(`${value} ${isPercentage ? '%' : ''}`)
      .style('font-size', '14px');
  };

  // Use useEffect to render the progress bars whenever the data or selection changes
  useEffect(() => {
    renderProgressBar(slaRef, 'sla', percSLAMet);
    renderTTRProgressBar(resolveRef, avgToResolve); // Render TTR bar with severity levels
    //renderProgressBar(assignedRef, 'assigned', percAssignedToResolved);
    //renderProgressBar(falsePositivesRef, 'falsePositives', percFalsePositives);
  }, [percSLAMet, avgToResolve, percAssignedToResolved, percFalsePositives, selectedParts]);

  return (
    <div className="progress-bars-layout">
      <div className="progress-box">
        <div className="name">SLA MET</div>
        <div ref={slaRef}></div>
      </div>
      <div className="progress-box">
        <div className="name">AVG TTR</div>
        <div ref={resolveRef}></div>
      </div>
      {/*
      <div className="progress-box">
        <div className="name">ASSIGN/RES.</div>
        <div ref={assignedRef}></div>
      </div>
      <div className="progress-box">
        <div className="name">FALSE POS.</div>
        <div ref={falsePositivesRef}></div>
      </div>
      */}
    </div>
  );
};

export default StatisticalAnalysis;
