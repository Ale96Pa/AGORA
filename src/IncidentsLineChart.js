import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { eel } from './App';

const IncidentsLineChart = ({ height, graphCursorTrigger, refreshTrigger }) => {
  const svgRef = useRef();

  useEffect(() => {
    // Fetch data from the exposed Python function
    eel.get_incidents_open_and_closed_over_time()().then(data => {
      const svgElement = d3.select(svgRef.current);
      const containerWidth = svgElement.node().parentNode.clientWidth;

      const width = containerWidth;
      const margin = { top: 10, right: 5, bottom: 30, left: 30 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      // Clear previous SVG content if any
      svgElement.selectAll('*').remove();

      // Parse the data
      const parsedData = JSON.parse(data);

      // Calculate total closed incidents categorized by severity levels
      const closedIncidents = parsedData.closed_selected_incidents.map(d => ({
        time: d.time,
        low: d.low || 0,
        moderate: d.moderate || 0,
        high: d.high || 0,
        critical: d.critical || 0,
        total: d.low + d.moderate + d.high + d.critical
      }));

      // Create time scale based on both active and closed incidents' time range
      const xScale = d3.scaleTime()
        .domain([
          d3.timeDay.floor(d3.min(parsedData.opened_incidents, d => new Date(d.time))),
          d3.timeDay.ceil(d3.max(parsedData.closed_incidents, d => new Date(d.time)))
        ])
        .range([0, innerWidth]);

      // Get the min and max values for both active and closed incidents for Y scale
      const yMin = 0;
      const yMax = d3.max(closedIncidents, d => d.total);

      // Create Y scale for counts of incidents, with domain fitting to min/max values
      const yScale = d3.scaleLinear()
        .domain([yMin, yMax])
        .nice()
        .range([innerHeight, 0]);

      const g = svgElement.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)
        .attr('class', 'graph-group')
        .attr('pointer-events', 'all');

      // Line generator for active incidents
      const lineActive = d3.line()
        .x(d => xScale(new Date(d.time)))
        .y(d => yScale(d.count))
        .curve(d3.curveMonotoneX);

      // Area generator for different severity levels
      const areaGenerator = (y0Accessor, y1Accessor, color, opacity = 0.5) => d3.area()
        .x(d => xScale(new Date(d.time)))
        .y0(y0Accessor)
        .y1(y1Accessor)
        .curve(d3.curveMonotoneX);

      // Area paths for each severity level
      const areaLow = areaGenerator(
        () => innerHeight,
        d => yScale(d.low),
        'green'
      );

      const areamoderate = areaGenerator(
        d => yScale(d.low),
        d => yScale(d.low + d.moderate),
        'orange'
      );

      const areaHigh = areaGenerator(
        d => yScale(d.low + d.moderate),
        d => yScale(d.low + d.moderate + d.high),
        'red'
      );

      const areaCritical = areaGenerator(
        d => yScale(d.low + d.moderate + d.high),
        d => yScale(d.total),
        'purple'
      );

      // Append active incidents line
      g.append('path')
        .datum(parsedData.active_incidents)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 2)
        .attr('class', 'line-active')
        .attr('d', lineActive);

      // Append areas for different severity levels
      g.append('path')
        .datum(closedIncidents)
        .attr('fill', 'green')
        .attr('opacity', 0.5)
        .attr('class', 'area-low')
        .attr('d', areaLow);

      g.append('path')
        .datum(closedIncidents)
        .attr('fill', 'orange')
        .attr('opacity', 0.5)
        .attr('class', 'area-moderate')
        .attr('d', areamoderate);

      g.append('path')
        .datum(closedIncidents)
        .attr('fill', 'red')
        .attr('opacity', 0.5)
        .attr('class', 'area-high')
        .attr('d', areaHigh);

      g.append('path')
        .datum(closedIncidents)
        .attr('fill', 'purple')
        .attr('opacity', 0.5)
        .attr('class', 'area-critical')
        .attr('d', areaCritical);

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
        .attr("fill", 'white'); // Set y-axis text color to white

      g.select('.y-axis path').style('stroke', 'white'); // Set y-axis line color to white
      g.select('.y-axis line').style('stroke', 'white'); // Set y-axis ticks color to white

      // Add a horizontal legend at the top of the chart
      const legend = g.append('g')
        .attr('transform', `translate(0, 10)`); // Move legend above the chart

      // Legend items data
      const legendData = [
        { color: 'steelblue', label: 'Active\nIncidents' },
        { color: 'green', label: 'Closed low\nseverity' },
        { color: 'orange', label: 'Closed moderate\nseverity' },
        { color: 'red', label: 'Closed high\nseverity' },
        { color: 'purple', label: 'Closed critical\nseverity' }
      ];

      const legendItemWidth = containerWidth / 5 - 80 ; // Adjust spacing as needed

      // Append legend items
      const legendItem = legend.selectAll('.legend-item')
        .data(legendData)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => {
          const x = 10 + i * legendItemWidth; // Horizontal spacing for legend items
          return `translate(${x}, 0)`;
        });

      // Append legend color boxes
      legendItem.append('rect')
        .attr('x', 0)
        .attr('y', -5)
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', d => d.color);

      // Append legend text in two lines
      legendItem.append('text')
        .selectAll('tspan')
        .data(d => d.label.split('\n'))  // Split label into two lines
        .enter()
        .append('tspan')
        .attr('x', 20)
        .attr('dy', (d, i) => i * 10) // Line height
        .style("font-size", "10px") // Set font size here
        .attr('fill', 'white')
        .text(d => d);

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

          // Update areas with new x-scale
          g.select('.area-low').attr('d', areaLow.x(d => newXScale(new Date(d.time))));
          g.select('.area-moderate').attr('d', areamoderate.x(d => newXScale(new Date(d.time))));
          g.select('.area-high').attr('d', areaHigh.x(d => newXScale(new Date(d.time))));
          g.select('.area-critical').attr('d', areaCritical.x(d => newXScale(new Date(d.time))));
        });

      // Apply zoom behavior to the SVG
      svgElement.call(zoom);

      // Add brush for selecting range
      const brush = d3.brushX()
        .extent([[0, 0], [innerWidth, innerHeight]])
        .on("end", (event) => {
          if (!event.selection) return; // If no selection, ignore
          const [start, end] = event.selection.map(xScale.invert); // Convert pixel values to dates
          
          // Extract date without time
          const startDate = d3.timeFormat("%Y-%m-%d")(start);
          const endDate = d3.timeFormat("%Y-%m-%d")(end);
          
          console.log(`Selected range: ${startDate} to ${endDate}`);
          
          // Store the date without time
          eel.set_filter_value("filters.graph_x-axis-sliders.min_date", startDate)();
          eel.set_filter_value("filters.graph_x-axis-sliders.max_date", endDate)();

          graphCursorTrigger();
        });

      // Append brush to the chart and remove the gray background
      g.append("g")
        .attr("class", "brush")
        .call(brush)
        .selectAll(".selection")
        .style("fill", "transparent"); // Remove the gray background by setting it to transparent

    }).catch(error => {
      console.error('Error fetching data:', error);
    });
  }, [height, refreshTrigger]);

  return (
    <svg ref={svgRef} style={{ width: '100%', height: height }} />
  );
};

export default IncidentsLineChart;
