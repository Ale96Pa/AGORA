import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { eel } from './App';
import './ProcessStateTimes.css';

const ProcessStateTimes = ({ height = 500, refreshTrigger }) => {
  const svgRef = useRef();
  const [enabledStates, setEnabledStates] = useState({
    detection: true,
    activation: true,
    awaiting: true,
    resolution: true,
    closure: true,
  });

  const formatTimeForYAxis = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours} h ${remainingMinutes} min`;
    } else {
      const days = Math.floor(minutes / 1440);
      const hours = Math.floor((minutes % 1440) / 60);
      return `${days} d ${hours} h`;
    }
  };

  useEffect(() => {
    // Fetch data from the exposed Python function
    eel.get_ordered_time_to_states_last_occurrence()().then(data => {
      const svgElement = d3.select(svgRef.current);
      const containerWidth = svgElement.node().parentNode.clientWidth;

      const width = containerWidth;
      const margin = { top: 20, right: 5, bottom: 30, left: 40 };
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

      console.log(d3.extent(data, d => new Date(d.closed_at)));
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

        const format = yRange < 60
          ? d => `${d} min`
          : yRange < 1440
            ? d => `${Math.floor(d / 60)} h ${d % 60} min`
            : d => `${Math.floor(d / 1440)} d ${Math.floor((d % 1440) / 60)} h`;

        g.select('.y-axis').call(d3.axisLeft(yScale).tickSize(-innerWidth).tickPadding(10).tickFormat(format));

        // Remove the upper grid line on the max y value
        g.select('.y-axis').selectAll('.tick line')
          .filter(d => d === yDomain[1])
          .remove();
      };

      g.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickPadding(10))
        .selectAll('text')
        .attr('fill', 'white');  // Make the axis text white

      g.select('.y-axis path').style('stroke', 'white'); // Make y-axis line white
      g.select('.y-axis line').style('stroke', 'white'); // Make y-axis ticks white

      g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .attr('class', 'x-axis')
        .call(d3.axisBottom(xScale).tickPadding(10))
        .selectAll('text')
        .attr('fill', 'white');  // Make the axis text white

      g.select('.x-axis path').style('stroke', 'white'); // Make x-axis line white
      g.select('.x-axis line').style('stroke', 'white'); // Make x-axis ticks white

      // Draw connecting lines between points for each incident
      const lineSelection = g.selectAll('.line')
        .data(parsedData['_lines'])
        .join('path')
        .attr('class', 'line')
        .attr('fill', 'none')
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.2)
        .attr('d', d3.line()
          .x(d => xScale(d.date))
          .y(d => yScale(d.value))
        );

      // Draw points for each process state
      Object.keys(parsedData).forEach(state => {
        if (state !== '_lines') {
          const data = parsedData[state];
          if (data && data.length) {
            g.selectAll(`.point-${state}`)
              .data(data)
              .join('circle')
              .attr('class', `point-${state}`)
              .attr('cx', d => xScale(d.date))
              .attr('cy', d => yScale(d.value))
              .attr('r', 4)
              .attr('fill', colorScale(state));
          }
        }
      });

      // Apply zoom behavior
      const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .translateExtent([[margin.left, margin.top], [width - margin.right, height - margin.top]])
        .extent([[margin.left, margin.top], [width - margin.right, height - margin.top]])
        .on("zoom", (event) => {
          const newXScale = event.transform.rescaleX(xScale);
          const newYScale = event.transform.rescaleY(yScale);

          g.selectAll('circle')
            .attr('cx', d => newXScale(d.date))
            .attr('cy', d => newYScale(d.value));

          lineSelection.attr('d', d3.line()
            .x(d => newXScale(d.date))
            .y(d => newYScale(d.value))
          );

          g.select('.x-axis').call(d3.axisBottom(newXScale).tickPadding(10));
          updateYAxis(newYScale);
        });

      svgElement.call(zoom);

      updateYAxis(yScale);  // Initial call to set the y-axis format and remove the upper grid line
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
      <div className="controls">
        {Object.keys(enabledStates).map(state => (
          <label key={state} style={{ color: 'white' }}>
            <input
              type="checkbox"
              checked={enabledStates[state]}
              onChange={() => toggleState(state)}
            />
            {state.charAt(0).toUpperCase() + state.slice(1)}
          </label>
        ))}
      </div>
      <svg ref={svgRef} style={{ width: '100%', height: `${height}px`}} />
    </div>
  );
};

export default ProcessStateTimes;
