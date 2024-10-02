import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { eel } from './App';

const ProcessComplianceBarChart = ({ height = 500, refreshTrigger }) => {
  const svgRef = useRef();
  const [enabledStates, setEnabledStates] = useState({
    N: true,
    A: true,
    W: true,
    R: true,
    C: true,
  });

  useEffect(() => {
    // Fetch data from the exposed Python function
    eel.get_compliance_per_state_per_incident()().then(data => {
      const svgElement = d3.select(svgRef.current);
      const containerWidth = svgElement.node().parentNode.clientWidth;

      const width = containerWidth;
      const margin = { top: 50, right: 5, bottom: 30, left: 60 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      // Clear previous SVG content if any
      svgElement.selectAll('*').remove();

      // Parse the JSON data
      const parsedData = JSON.parse(data);

      // Process data to calculate compliance scores multiplied by fitness for each state
      const complianceData = parsedData.map(d => {
        const complianceMetric = Object.entries(d.compliance_per_state || {}).reduce((acc, [state, score]) => {
          acc[state] = score * d.fitness; // Multiply each compliance score by fitness
          return acc;
        }, {});
        return {
          incidentId: d.incident_id,
          closedAt: new Date(d.closed_at),
          complianceMetric, // Object with compliance scores per state
          totalDeviations: d.total_deviations
        };
      });

      // Group by closedAt date to check for overlaps
      const groupedByDate = d3.group(complianceData, d => d.closedAt);

      // Assign a horizontal offset based on the number of bars that share the same closedAt date
      groupedByDate.forEach((group, date) => {
        group.forEach((d, i) => {
          d.offset = i - (group.length - 1) / 2; // Center the bars around the original position
        });
      });

      // Flatten the compliance data for stacked bars, only including enabled states
      const flattenedData = [];
      complianceData.forEach(d => {
        Object.entries(d.complianceMetric).forEach(([state, score]) => {
          if (enabledStates[state]) {
            flattenedData.push({
              incidentId: d.incidentId,
              closedAt: d.closedAt,
              state,
              score,
              offset: d.offset  // Add offset to each bar
            });
          }
        });
      });

      // Define the fixed order for states and filter by enabled states
      const orderedStates = ['N', 'A', 'W', 'R', 'C'].filter(state => enabledStates[state]);

      // Set up scales
      const xScale = d3.scaleTime()
        .domain([
          d3.timeDay.floor(d3.min(flattenedData, d => d.closedAt)),  // Start at the beginning of the first date
          d3.timeDay.ceil(d3.max(flattenedData, d => d.closedAt))    // End at the end of the last date
        ])
        .range([0, innerWidth]);

      const yScale = d3.scaleLinear()
        .domain([0, 1])
        .nice()
        .range([innerHeight, 0]);

      const colorScale = d3.scaleOrdinal()
        .domain(orderedStates)
        .range(['steelblue', 'orange', 'green', 'red', 'purple']);

      const g = svgElement.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)
        .attr('class', 'graph-group')
        .attr('pointer-events', 'all');

      // Set the bar width and spacing for overlapping bars
      const barWidth = 5;
      const maxOffset = 2; // Maximum offset for bars

      // Stack the data for stacked bar chart using the fixed order of states
      const stack = d3.stack()
        .keys(orderedStates)
        .value((d, key) => d.complianceMetric[key] || 0);

      const stackedData = stack(complianceData);

      // Append the bars
      g.append("g")
        .attr("class", "bars")
        .selectAll("g")
        .data(stackedData)
        .join("g")
        .attr("fill", d => colorScale(d.key))
        .selectAll("rect")
        .data(d => d)
        .join("rect")
        .attr("x", d => xScale(d.data.closedAt) + (d.data.offset * (barWidth + maxOffset))) // Adjust position based on offset
        .attr("y", d => yScale(d[1]))
        .attr("height", d => yScale(d[0]) - yScale(d[1]))
        .attr("width", barWidth) // Adjust width of bars as needed
        .append("title") // Add tooltip on hover
        .text(d => `Incident: ${d.data.incidentId}\nState: ${d.key}\nScore: ${(d[1] - d[0]).toFixed(2)}`);

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

      // Create the legend
      const legend = svgElement.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top - 30})`) // Position legend above the chart
        .attr('class', 'legend');

      const legendItemSize = 10;
      const legendSpacing = 4;

      // Append legend items
      legend.selectAll('rect')
        .data(orderedStates)
        .enter()
        .append('rect')
        .attr('x', (d, i) => i * (legendItemSize + legendSpacing) * 6) // Adjust the x-position for spacing between legend items
        .attr('y', 0)
        .attr('width', legendItemSize)
        .attr('height', legendItemSize)
        .attr('fill', d => colorScale(d));

      // Append legend text
      legend.selectAll('text')
        .data(orderedStates)
        .enter()
        .append('text')
        .attr('x', (d, i) => i * (legendItemSize + legendSpacing) * 6 + legendItemSize + 2)
        .attr('y', legendItemSize / 2)
        .attr('dy', '0.35em')
        .style('font-size', '12px')
        .attr('fill', 'white')
        .text(d => d);

      // Apply zoom behavior
      const zoom = d3.zoom()
        .scaleExtent([1, 1000])
        .translateExtent([[margin.left, margin.top], [containerWidth - margin.right, height - margin.top]])
        .extent([[margin.left, margin.top], [containerWidth - margin.right, height - margin.top]])
        .on("zoom", (event) => {
          const newXScale = event.transform.rescaleX(xScale);
          g.selectAll(".bars rect").attr("x", d => newXScale(d.data.closedAt) + (d.data.offset * (barWidth + maxOffset))); // Adjust position on zoom
          g.select('.x-axis').call(d3.axisBottom(newXScale).tickPadding(10));
        });

      svgElement.call(zoom);
    }).catch(error => {
      console.error('Error fetching data:', error);
    });
  }, [height, refreshTrigger, enabledStates]);

  const toggleState = state => {
    setEnabledStates({
      ...enabledStates,
      [state]: !enabledStates[state],
    });
  };

  return (
    <div>
      <div className="controls">
        {Object.keys(enabledStates).map(state => (
          <label key={state} style={{ color: 'white' }}>
            <input
              type="checkbox"
              checked={enabledStates[state]}
              onChange={() => toggleState(state)}
            />
            {state}
          </label>
        ))}
      </div>
      <svg ref={svgRef} style={{ width: '100%', height: height }} />
    </div>
  );
};

export default ProcessComplianceBarChart;
