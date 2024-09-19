import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { eel } from './App';

const DeviationsBarChart = ({ height, refreshTrigger }) => {
  const containerRef = useRef(); 
  const [deviationData, setDeviationData] = useState([]);
  const [containerWidth, setContainerWidth] = useState(0);

  // Sample data for deviations
  const sampleDeviations = {
    MISSING: [10, 20, 15, 30, 5],
    REPETITION: [5, 10, 8, 15, 3],
    MISMATCH: [8, 5, 12, 10, 2]
  };

  // Function to fetch state mapping
  const fetchStateMapping = async () => {
    try {
      const stateMapping = await eel.read_mapping_from_file()();

      const statesArray = Object.keys(stateMapping).map((state, index) => ({
        stateName: state,
        deviations: {
          MISSING: sampleDeviations.MISSING[index],
          REPETITION: sampleDeviations.REPETITION[index],
          MISMATCH: sampleDeviations.MISMATCH[index],
        }
      }));

      setDeviationData(statesArray);
    } catch (error) {
      console.error('Error fetching state mapping:', error);
    }
  };

  // Function to render bar chart for a single state
  const renderBarChart = (data, width, height, container) => {
    const svg = d3.select(container).append('svg')
      .attr('width', width)
      .attr('height', height);

    // X and Y scales
    const xScale = d3.scaleBand()
      .domain(['MISSING', 'REPETITION', 'MISMATCH'])
      .range([0, width])
      .paddingOuter(3);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(Object.values(data.deviations))])
      .range([height - 20, 0]); // 20px padding for labels

    // Color scale for deviation types
    const colorScale = d3.scaleOrdinal()
      .domain(['MISSING', 'REPETITION', 'MISMATCH'])
      .range(['green', 'lime', 'yellow']);

    // Create bars
    svg.selectAll('rect')
      .data(Object.entries(data.deviations))
      .enter()
      .append('rect')
      .attr('x', d => xScale(d[0]))
      .attr('y', d => yScale(d[1]))
      .attr('width', xScale.bandwidth())
      .attr('height', d => height - 20 - yScale(d[1]))
      .attr('fill', d => colorScale(d[0]));

    // Add text for each bar to show the number of deviations
    svg.selectAll('text')
      .data(Object.entries(data.deviations))
      .enter()
      .append('text')
      .attr('x', d => xScale(d[0]) + xScale.bandwidth() / 2)  // Center text in the bar
      .attr('y', d => yScale(d[1]) - 5)  // Position above the bar
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')  // Text color
      .style('font-size', '10px')  // Font size
      .text(d => d[1]);  // Display the deviation value

    // Add X-axis with ticks and labels but hide the axis line
    const xAxis = svg.append('g')
      .attr('transform', `translate(0, ${height - 20})`)
      .call(d3.axisBottom(xScale).tickSize(0));

    // Remove the X-axis line but keep the ticks and labels
    xAxis.select('path').remove();

    // Style and adjust the labels
    xAxis.selectAll('.tick text')
      .attr('fill', 'white')
      .style('font-size', '8px')
      .attr('dx', (d, i) => {
        if (i === 0) return '-1em'; // Adjust for spacing
        if (i === 2) return '1em';
      })
      .attr('dy', (d, i) => {
        if (i === 1) return '2em'; // Lower middle label
        return '1em';
      });

    // Remove the tick lines
    xAxis.selectAll('.tick line').remove();
  };

  useEffect(() => {
    fetchStateMapping();
  }, [refreshTrigger]);

  useEffect(() => {
    if (deviationData.length > 0 && containerRef.current) {
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      setContainerWidth(containerWidth);

      d3.select(containerRef.current).selectAll('*').remove();

      const chartWidth = containerWidth / deviationData.length;

      // Render a chart for each state
      deviationData.forEach((stateData, index) => {
        const chartContainer = d3.select(containerRef.current)
          .append('div')
          .attr('class', 'state-chart')
          .style('width', `${chartWidth}px`)
          .style('display', 'inline-block');

        renderBarChart(stateData, chartWidth, height, chartContainer.node());
      });
    }
  }, [deviationData]);

  return <div ref={containerRef} className="bar-chart-container"></div>;
};

export default DeviationsBarChart;
