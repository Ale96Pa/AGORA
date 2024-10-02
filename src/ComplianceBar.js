import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { eel } from './App';
import './ComplianceBar.css';  // Assuming you have a CSS file for custom styles

const ComplianceBar = ({ height = 15, globalFilterTrigger, refreshTrigger }) => {
  const containerRef = useRef(); // Use ref for the container element
  const [severityLevels, setSeverityLevels] = useState({});
  const [progress, setProgress] = useState(0);
  const [limits, setLimits] = useState([0, 1]);
  const [metricName, setMetricName] = useState('');

  // Fetch data when the component mounts or refreshTrigger changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Set limits to the default values
        setLimits([0, 1]);

        // Fetch the metric name
        const fetchedMetricName = await eel.get_incident_compliance_metric()();
        console.log("Fetched Metric Name: ", fetchedMetricName);
        setMetricName(fetchedMetricName);

        // Fetch the severity levels using get_filter_value
        const thresholdsStr = await eel.get_filter_value("filters.thresholds.compliance_metric_severity_levels")();
        console.log("Fetched Thresholds: ", thresholdsStr);

        // Parse the thresholds into numerical ranges
        const parsedThresholds = parseThresholds(thresholdsStr);
        setSeverityLevels(parsedThresholds);

        // Fetch the progress based on the metric name
        const metricProgress = await eel.calculate_column_average(fetchedMetricName)();
        setProgress(metricProgress);

      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, [refreshTrigger]); // Fetch data when refreshTrigger changes

  // Redraw the progress bar when severityLevels, progress, metricName, or container size changes
  useEffect(() => {
    if (severityLevels && Object.keys(severityLevels).length > 0 && metricName) {
      drawProgressBar();
    }
  }, [severityLevels, progress, metricName]); // Redraw on data change

  // Redraw the progress bar on window resize
  useEffect(() => {
    const handleResize = () => {
      drawProgressBar(); // Redraw the progress bar when the window is resized
    };

    // Add event listener for window resize
    window.addEventListener('resize', handleResize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [severityLevels, progress, metricName, limits]); // Dependencies include limits for accurate scaling

  // Parse the thresholds from string to numerical values
  const parseThresholds = (thresholds) => {
    const parsed = {};
    Object.keys(thresholds).forEach(level => {
      const range = thresholds[level].split('AND').map(cond => cond.trim());
      const minCondition = range[0].match(/[0-9.]+/g);
      const maxCondition = range[1].match(/[0-9.]+/g);

      const minValue = minCondition ? parseFloat(minCondition[0]) : 0;
      const maxValue = maxCondition ? parseFloat(maxCondition[0]) : 1;

      parsed[level] = [minValue, maxValue];
    });
    console.log(parsed);
    return parsed;
  };

  // Draw the progress bar based on severity levels and progress
  const drawProgressBar = () => {
    const [min, max] = limits;
    const scaledProgress = ((progress - min) / (max - min)) * 100;
    const roundedProgress = progress.toFixed(3);

    const container = d3.select(containerRef.current);
    const width = container.node().getBoundingClientRect().width;

    // Clear previous SVG content
    container.selectAll('*').remove();

    // Add metric name above the progress bar
    container.append('div')
      .attr('class', 'metric-name')
      .text(metricName)
      .style('text-align', 'center')
      .style('color', 'white')
      .style('margin-bottom', '5px');

    const svg = container.append('svg')
      .attr('width', '100%')
      .attr('height', height);

    // Define severity colors and map them to severity levels
    const severityColors = {
      critical: 'purple',
      high: 'red',
      moderate: 'orange',
      low: 'green'
    };

    // Create background rectangles for each severity range
    Object.keys(severityLevels).forEach(level => {
      const range = severityLevels[level];
      const rangeStart = range[0];
      const rangeEnd = range[1];

      svg.append('rect')
        .attr('x', (width * (rangeStart - min)) / (max - min))
        .attr('y', 0)
        .attr('width', (width * (rangeEnd - rangeStart)) / (max - min))
        .attr('height', height)
        .attr('fill', severityColors[level])
        .attr('stroke', 'none')
        .on('click', async function () {
          const isSelected = d3.select(this).attr('stroke') === '#007FFF';
          d3.select(this).attr('stroke', isSelected ? 'none' : '#007FFF').attr('stroke-width', isSelected ? '0' : '3');
          
          // Set the filter for the clicked severity range
          await eel.set_filter_value(`filters.overview_metrics.compliance_bar.${level}`, !isSelected)();
          
          // Log the action
          console.log(`Set filter: filters.overview_metrics.compliance_bar.${level} = ${!isSelected}`);
          
          // Additional actions if needed after setting the filter
          globalFilterTrigger();
        });
    });

    // Add dotted line for average value
    svg.append('line')
      .attr('x1', (width * scaledProgress) / 100)
      .attr('y1', 0)
      .attr('x2', (width * scaledProgress) / 100)
      .attr('y2', height)
      .attr('stroke', '#000')
      .attr('stroke-dasharray', '2,2')  // More dashes
      .attr('stroke-width', '2');

    // Add text label for average value next to the line
    svg.append('text')
      .attr('x', (width * scaledProgress) / 100 + 20)
      .attr('y', height / 2)  // Position at the middle of the bar
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', '#000')
      .text(`${roundedProgress}`)
      .style('font-size', '14px');
  };

  return <div ref={containerRef} style={{ width: '100%' }}></div>; // Use ref for the container
};

export default ComplianceBar;
