import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { eel } from './App';

const ProcessComplianceBarChart = ({ height = 500, refreshTrigger }) => {
  const svgRef = useRef();

  useEffect(() => {
    // Fetch data from the exposed Python function
    eel.get_closed_ordered_incidents()().then(data => {
      const svgElement = d3.select(svgRef.current);
      const containerWidth = svgElement.node().parentNode.clientWidth;

      const width = containerWidth;
      const margin = { top: 20, right: 5, bottom: 30, left: 40 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;
      const barWidth = 4; // Width of the bars

      // Clear previous SVG content if any
      svgElement.selectAll('*').remove();

      // Parse the data
      const parsedData = data.map(d => ({
        incidentId: d[0],
        closedAt: new Date(d[1]),
        complianceMetric: d[2]
      }));

      console.log(d3.extent(parsedData, d => d.closedAt));
      // Set up scales
      const xScale = d3.scaleTime()
        .domain([
          d3.timeDay.floor(d3.min(parsedData, d => d.closedAt)),  // Start at the beginning of the first date
          d3.timeDay.ceil(d3.max(parsedData, d => d.closedAt))    // End at the end of the last date
        ])
        .range([0, innerWidth]);


      const yScale = d3.scaleLinear()
        .domain([0, d3.max(parsedData, d => d.complianceMetric)])
        .nice()
        .range([innerHeight, 0]);

      const g = svgElement.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)
        .attr('class', 'graph-group')
        .attr('pointer-events', 'all');

      // Append the bars
      g.append("g")
        .attr("class", "bars")
        .attr("fill", "steelblue")
        .selectAll("rect")
        .data(parsedData)
        .join("rect")
        .attr("x", d => xScale(d.closedAt) - barWidth / 2) // Center the bar
        .attr("y", d => yScale(d.complianceMetric))
        .attr("height", d => yScale(0) - yScale(d.complianceMetric))
        .attr("width", barWidth)
        .append("title") // Add tooltip on hover
        .text(d => `Incident: ${d.incidentId}\nDate: ${d.closedAt.toLocaleString()}\nCompliance: ${d.complianceMetric}`);

      // Append the x-axis
      g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .attr('class', 'x-axis')
        .call(d3.axisBottom(xScale).tickPadding(10))
        .selectAll('text')
        .attr('fill', 'white');  // Make the axis text white

      g.select('.x-axis path').style('stroke', 'white'); // Set x-axis line color to white
      g.select('.x-axis line').style('stroke', 'white'); // Set x-axis ticks color to white

      // Append the y-axis
      g.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickPadding(10))
        .selectAll("text")
        .attr("fill", "white"); // Set y-axis text color to white

      g.select('.y-axis path').style('stroke', 'white'); // Set y-axis line color to white
      g.select('.y-axis line').style('stroke', 'white'); // Set y-axis ticks color to white

      // Apply zoom behavior
      const zoom = d3.zoom()
        .scaleExtent([1, 1000])
        .translateExtent([[margin.left, margin.top], [containerWidth - margin.right, height - margin.top]])
        .extent([[margin.left, margin.top], [containerWidth - margin.right, height - margin.top]])
        .on("zoom", (event) => {
          const newXScale = event.transform.rescaleX(xScale);
          g.selectAll(".bars rect").attr("x", d => newXScale(d.closedAt) - barWidth / 2); // Center the bar on zoom
          g.select('.x-axis').call(d3.axisBottom(newXScale).tickPadding(10));
        });

      svgElement.call(zoom);
    });
  }, [height, refreshTrigger]);

  return (
    <svg ref={svgRef} style={{ width: '100%', height: height }} />
  );
};

export default ProcessComplianceBarChart;
