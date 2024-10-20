import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { eel } from './App';
import './ProcessStateTimes.css';

const ProcessStateTimes = ({ height = 500, graphCursorTrigger, refreshTrigger }) => {
  const svgRef = useRef();
  const [enabledStates, setEnabledStates] = useState({
    detection: true,
    activation: true,
    awaiting: true,
    resolution: true,
    closure: true,
  });

  const formatTimeForYAxis = (minutes) => {
    const days = Math.floor(minutes / 1440); // Convert minutes to days (1440 minutes in a day)
    return `${days}d`;
  };

  // Function to calculate the moving average
  const calculateMovingAverage = (data, windowSize) => {
    return data.map((d, i, arr) => {
      const start = Math.max(0, i - windowSize + 1);
      const subset = arr.slice(start, i + 1);
      const sum = subset.reduce((acc, val) => acc + val.value, 0);
      return { date: d.date, value: sum / subset.length };
    });
  };

  useEffect(() => {
    // Fetch data from the exposed Python function
    eel.get_ordered_time_to_states_last_occurrence()().then(data => {
      const svgElement = d3.select(svgRef.current);
      const containerWidth = svgElement.node().parentNode.clientWidth;

      const width = containerWidth;
      const margin = { top: 10, right: 10, bottom: 25, left: 30 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      // Clear previous SVG content
      svgElement.selectAll('*').remove();

      // State code to state name mapping
      const stateMapping = {
        'TTN': 'detection',
        'TTA': 'activation',
        'TTW': 'awaiting',
        'TTR': 'resolution',
        'TTC': 'closure'
      };

      // Parse and transform data into the desired format
      const parsedData = data.reduce((acc, d) => {
        const closedDate = new Date(d.closed_at);
        const incidentPoints = [];

        Object.entries(d.time_to_states).forEach(([stateCode, value]) => {
          const stateKey = stateMapping[stateCode]; // Use mapping to get the correct state name
          if (enabledStates[stateKey]) {
            if (!acc[stateKey]) acc[stateKey] = [];
            const point = { date: closedDate, value };
            acc[stateKey].push(point);
            incidentPoints.push(point);
          }
        });

        if (incidentPoints.length > 1) {
          acc['_lines'].push(incidentPoints);
        }

        return acc;
      }, { _lines: [] });

      // Apply moving average to each state's data
      const windowSize = 5; // You can adjust the window size as needed
      const movingAverageData = {};
      Object.keys(parsedData).forEach(state => {
        if (state !== '_lines' && parsedData[state].length) {
          movingAverageData[state] = calculateMovingAverage(parsedData[state], windowSize);
        }
      });

      // Set up scales
      const xScale = d3.scaleTime()
        .domain([
          d3.timeDay.floor(d3.min(data, d => new Date(d.closed_at))),  // Start at the beginning of the first date
          d3.timeDay.ceil(d3.max(data, d => new Date(d.closed_at)))    // End at the end of the last date
        ])
        .range([0, innerWidth]);

      const yScale = d3.scaleLinear()
        .domain([0, d3.max(Object.values(parsedData).flat().filter(Boolean), d => d.value)]) // Ensure y-axis starts at 0
        .range([innerHeight, 0]);

      const colorScale = d3.scaleOrdinal()
        .domain(Object.values(stateMapping))
        .range(['steelblue', 'orange', 'green', 'red', 'purple']);

      const g = svgElement.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)
        .attr('class', 'graph-group')
        .attr('pointer-events', 'all');

      const updateYAxis = (yScale) => {
        const yDomain = yScale.domain();
        const yRange = yDomain[1] - yDomain[0];

        // Format for days, reducing the tick frequency for clarity
        const format = d => formatTimeForYAxis(d);

        // Set fewer ticks on the Y-axis
        g.select('.y-axis')
          .call(d3.axisLeft(yScale)
            .ticks(5)  // Reduce the number of ticks to 5
            .tickSize(-innerWidth)
            .tickPadding(10)
            .tickFormat(format)
          );
      };

      // Initial y-axis setup
      g.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickPadding(10))
        .selectAll('text')
        .attr('fill', 'white') // Make the axis text white
        .style('font-size', '9.5px'); // Make font size smaller

      g.select('.y-axis path').style('stroke', 'white'); // Set y-axis line color to white
      g.select('.y-axis line').style('stroke', 'white'); // Set y-axis ticks color to white

      // Append the x-axis
      g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .attr('class', 'x-axis')
        .call(d3.axisBottom(xScale).tickPadding(10))
        .selectAll('text')
        .attr('fill', 'white'); // Make the axis text white

      g.select('.x-axis path').style('stroke', 'white'); // Set x-axis line color to white
      g.select('.x-axis line').style('stroke', 'white'); // Set x-axis ticks color to white

      // Draw connecting lines between points for each incident
      const lineSelection = g.selectAll('.line')
        .data(parsedData['_lines'])
        .join('path')
        .attr('class', 'line')
        .attr('fill', 'none')
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.1)  // Reduce opacity for original data
        .attr('d', d3.line()
          .x(d => xScale(d.date))
          .y(d => yScale(d.value))
        );

      // Draw points and connect same-state points with lines
      const originalLines = {}; // Store original data lines for zoom updates
      Object.keys(parsedData).forEach(state => {
        if (state !== '_lines') {
          const data = parsedData[state];
          if (data && data.length) {
            // Draw the original points for each state with reduced opacity
            g.selectAll(`.point-${state}`)
              .data(data)
              .join('circle')
              .attr('class', `point-${state}`)
              .attr('cx', d => xScale(d.date))
              .attr('cy', d => yScale(d.value))
              .attr('r', 4)
              .attr('fill', colorScale(state))
              .attr('fill-opacity', 0.1); // Reduce opacity for original data points

            // Connect same-state points with original lines with reduced opacity
            originalLines[state] = g.append("path")
              .datum(data)
              .attr("fill", "none")
              .attr("stroke", colorScale(state))
              .attr("stroke-width", 1)
              .attr("stroke-opacity", 0.1) // Reduce opacity for original data lines
              .attr("d", d3.line()
                .x(d => xScale(d.date))
                .y(d => yScale(d.value))
              );
          }
        }
      });

      // Draw moving average lines on top without data points
      const movingAverageLines = {}; // Store moving average lines for zoom updates
      Object.keys(movingAverageData).forEach(state => {
        if (movingAverageData[state].length) {
          movingAverageLines[state] = g.append("path")
            .datum(movingAverageData[state])
            .attr("fill", "none")
            .attr("stroke", colorScale(state))
            .attr("stroke-width", 2)
            .attr('class', `state-line-${state}`)
            .attr("d", d3.line()
              .x(d => xScale(d.date))
              .y(d => yScale(d.value))
            );
        }
      });

      // Add brush for selecting date range
      const brush = d3.brushX()
        .extent([[0, 0], [innerWidth, innerHeight]])
        .on("end", (event) => {
          if (!event.selection) return; // If no selection, ignore
          const [start, end] = event.selection.map(xScale.invert); // Convert pixel values to dates

          // Extract date without time
          const startDate = d3.timeFormat("%Y-%m-%d")(start);
          const endDate = d3.timeFormat("%Y-%m-%d")(end);

          console.log(`Selected range: ${startDate} to ${endDate}`);

          // Store the date without time in filters
          eel.set_filter_value("filters.graph_x-axis-sliders.min_date", startDate)();
          eel.set_filter_value("filters.graph_x-axis-sliders.max_date", endDate)();
        });

      // Append brush to the chart and remove the gray background
      g.append("g")
        .attr("class", "brush")
        .call(brush)
        .selectAll(".selection")
        .style("fill", "transparent"); // Remove the gray background by setting it to transparent

      // Apply zoom behavior (x-axis only)
      const zoom = d3.zoom()
        .scaleExtent([1, 1000])  // Matching zoom extent to ProcessComplianceBarChart
        .translateExtent([[margin.left, margin.top], [containerWidth - margin.right, height - margin.top]])
        .extent([[margin.left, margin.top], [containerWidth - margin.right, height - margin.top]])
        .on("zoom", (event) => {
          const newXScale = event.transform.rescaleX(xScale);

          // Update all elements that rely on x-scale
          g.selectAll('circle')
            .attr('cx', d => newXScale(d.date));  // Only update the x position for the circles

          // Update the incident lines
          lineSelection.attr('d', d3.line()
            .x(d => newXScale(d.date))
            .y(d => yScale(d.value))  // Keep y value static
          );

          // Update same-state lines for original data
          Object.keys(originalLines).forEach(state => {
            originalLines[state].attr("d", d3.line()
              .x(d => newXScale(d.date))
              .y(d => yScale(d.value))
            );
          });

          // Update moving average lines
          Object.keys(movingAverageLines).forEach(state => {
            movingAverageLines[state].attr("d", d3.line()
              .x(d => newXScale(d.date))
              .y(d => yScale(d.value))
            );
          });

          // Update the x-axis based on the new x-scale
          g.select('.x-axis').call(d3.axisBottom(newXScale).tickPadding(10));

          // Reapply styles to x-axis elements after zoom
          g.select('.x-axis').selectAll('text').attr('fill', 'white');
          g.select('.x-axis path').style('stroke', 'white');
          g.select('.x-axis line').style('stroke', 'white');
        });

      svgElement.call(zoom);

      updateYAxis(yScale);
    });
  }, [enabledStates, height, refreshTrigger]);

  const toggleState = state => {
    setEnabledStates({
      ...enabledStates,
      [state]: !enabledStates[state],
    });
  };

  return (
    <div>
      <div className="header-row">
        <div className='name'>ACTIVITY DURATIONS OVER TIME</div>
        <div className="controls">
          {Object.keys(enabledStates).map(state => (
            <label key={state} style={{ color: 'white', marginLeft: '10px' }}>
              <input
                type="checkbox"
                checked={enabledStates[state]}
                onChange={() => toggleState(state)}
              />
              {state.toUpperCase()}
            </label>
          ))}
        </div>
      </div>
      <svg ref={svgRef} style={{ width: '100%', height: `${height}px` }} />
    </div>
  );
};

export default ProcessStateTimes;
