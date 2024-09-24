import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { eel } from './App';
import './ComplianceBar.css';  // Assuming you have a CSS file for custom styles

const ComplianceBar = ({ height = 30, refreshTrigger }) => {
  const containerRef = useRef(); // Use ref for the container element
  const [severityLevels, setSeverityLevels] = useState({});
  const [progress, setProgress] = useState(0);
  const [limits, setLimits] = useState([0, 1]);
  const [metricName, setMetricName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Set limits to the default values
        setLimits([0, 1]);

        // Fetch the metric name
        const fetchedMetricName = await eel.get_incident_compliance_metric()();
        console.log("Fetched Metric Name: ", fetchedMetricName);
        setMetricName(fetchedMetricName);

        // Fetch the severity levels based on the metric name
        const levels = JSON.parse(await eel.get_compliance_metric_thresholds()());
        setSeverityLevels(levels);

        // Fetch the progress based on the metric name
        const metricProgress = await eel.calculate_column_average(fetchedMetricName)();
        setProgress(metricProgress);

      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, [refreshTrigger]); // Fetch data when refreshTrigger changes

  useEffect(() => {
    if (severityLevels && Object.keys(severityLevels).length > 0 && metricName) {
      drawProgressBar();
    }
  }, [severityLevels, progress, metricName]); // Draw the progress bar when severity levels, progress, or metric name changes

  const drawProgressBar = () => {
    const [min, max] = limits;
    const scaledProgress = ((progress - min) / (max - min)) * 100;
    const roundedProgress = progress.toFixed(3);

    const container = d3.select(containerRef.current);
    const width = container.node().getBoundingClientRect().width;

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
    const severityColors = ['purple', 'red', 'orange', 'green'];
    const severityRanges = [
      severityLevels.critical,
      severityLevels.moderate,
      severityLevels.high,
      severityLevels.low
    ];

    // Create background rectangles for each severity range
    severityRanges.forEach((range, index) => {
      const rangeStart = range[0];
      const rangeEnd = range[1];

      svg.append('rect')
        .attr('x', (width * (rangeStart - min)) / (max - min))
        .attr('y', 0)
        .attr('width', (width * (rangeEnd - rangeStart)) / (max - min))
        .attr('height', height)
        .attr('fill', severityColors[index])
        .attr('stroke', 'none')
        .on('click', async function () {
          const isSelected = d3.select(this).attr('stroke') === '#007FFF';
          d3.select(this).attr('stroke', isSelected ? 'none' : '#007FFF').attr('stroke-width', isSelected ? '0' : '3');
          
          // Set the filter for the clicked severity range
          const severity = ['critical', 'high', 'moderate', 'low'][index];
          await eel.set_filter_value(`filters.overview_metrics.compliance_bar.${severity}`, !isSelected)();
          
          // Log the action
          console.log(`Set filter: filters.overview_metrics.compliance_bar.${severity} = ${!isSelected}`);
          
          // Additional actions if needed after setting the filter
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
