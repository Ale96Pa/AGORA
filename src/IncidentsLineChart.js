import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { eel } from './App';

const IncidentsLineChart = ({ height, refreshTrigger }) => {
  const svgRef = useRef();

  useEffect(() => {
    // Fetch data from the exposed Python function
    eel.get_incidents_open_and_closed_over_time()().then(data => {
      const svgElement = d3.select(svgRef.current);
      const containerWidth = svgElement.node().parentNode.clientWidth;

      const width = containerWidth;
      const margin = { top: 5, right: 5, bottom: 30, left: 30 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      // Clear previous SVG content if any
      svgElement.selectAll('*').remove();

      // Parse the data
      const parsedData = JSON.parse(data);

      // Create time scale based on both active and closed incidents' time range
      const xScale = d3.scaleTime()
        .domain([
          d3.timeDay.floor(d3.min(parsedData.opened_incidents, d => new Date(d.time))),
          d3.timeDay.ceil(d3.max(parsedData.closed_incidents, d => new Date(d.time)))
        ])
        .range([0, innerWidth]);

      // Get the min and max values for both active and closed incidents for Y scale
      const yMin = d3.min([...parsedData.active_incidents, ...parsedData.closed_selected_incidents], d => d.count);
      const yMax = d3.max([...parsedData.active_incidents, ...parsedData.closed_selected_incidents], d => d.count);

      // Create Y scale for counts of incidents, with domain fitting to min/max values
      const yScale = d3.scaleLinear()
        .domain([yMin, yMax])
        .nice()
        .range([innerHeight, 0]);

      const g = svgElement.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)
        .attr('class', 'graph-group')
        .attr('pointer-events', 'all');

      // Line generators for active and closed incidents
      const lineActive = d3.line()
        .x(d => xScale(new Date(d.time)))
        .y(d => yScale(d.count))
        .curve(d3.curveMonotoneX);

      const lineClosed = d3.line()
        .x(d => xScale(new Date(d.time)))
        .y(d => yScale(d.count))
        .curve(d3.curveMonotoneX);

      // Append active incidents line
      g.append('path')
        .datum(parsedData.active_incidents)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 2)
        .attr('class', 'line-active')
        .attr('d', lineActive);

      // Append closed incidents line
      g.append('path')
        .datum(parsedData.closed_selected_incidents)
        .attr('fill', 'none')
        .attr('stroke', 'tomato')
        .attr('stroke-width', 2)
        .attr('class', 'line-closed')
        .attr('d', lineClosed);

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

      // Add a legend
      const legend = g.append('g')
        .attr('transform', `translate(${innerWidth - 160}, 20)`);

      legend.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', 'steelblue');

      legend.append('text')
        .attr('x', 20)
        .attr('y', 10)
        .attr('fill', 'white')
        .text('Active Incidents');

      legend.append('rect')
        .attr('x', 0)
        .attr('y', 20)
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', 'tomato');

      legend.append('text')
        .attr('x', 20)
        .attr('y', 30)
        .attr('fill', 'white')
        .text('Closed Incidents');

      // Zoom behavior for the x-axis
      const zoom = d3.zoom()
        .scaleExtent([1, 10]) // Allow zoom between 1x and 10x
        .translateExtent([[0, 0], [innerWidth, innerHeight]]) // Restrict panning to the bounds of the chart
        .extent([[0, 0], [innerWidth, innerHeight]]) // Set the zoomable area
        .on('zoom', (event) => {
          // Rescale x-axis
          const newXScale = event.transform.rescaleX(xScale);
          g.select('.x-axis').call(d3.axisBottom(newXScale));

          // Update line paths with new x-scale
          g.select('.line-active').attr('d', lineActive.x(d => newXScale(new Date(d.time))));
          g.select('.line-closed').attr('d', lineClosed.x(d => newXScale(new Date(d.time))));
        });

      // Apply zoom behavior to the SVG
      svgElement.call(zoom);
    });
  }, [height, refreshTrigger]);

  return (
    <svg ref={svgRef} style={{ width: '100%', height: height }} />
  );
};

export default IncidentsLineChart;
