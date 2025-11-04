import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { eel } from './App';
import './IncidentsLineChart.css'; // Add a CSS file for styling

const IncidentsLineChart = ({ height, graphCursorTrigger, refreshTrigger }) => {
  const svgRef = useRef();
  const [viewMode, setViewMode] = useState('reduced'); // 'reduced' or 'full'
  const [summaryData, setSummaryData] = useState(null);
  const [parsedData, setParsedData] = useState(null); // Store parsed data for rendering the chart

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    try {
    eel.get_incidents_open_and_closed_over_time()().then(data => {
      const parsed = data;

      // Calculate summary data for reduced view
      const firstActiveIncident = parsed.active_incidents[0];
      const lastActiveIncident = parsed.active_incidents[parsed.active_incidents.length - 1];
      const lastClosedIncident = parsed.closed_selected_incidents[parsed.closed_selected_incidents.length - 1];

      const summary = {
        active: {
          first: firstActiveIncident ? firstActiveIncident.count : 0,
          last: lastActiveIncident ? lastActiveIncident.count : 0,
        },
        low: lastClosedIncident ? lastClosedIncident.low || 0 : 0,
        moderate: lastClosedIncident ? lastClosedIncident.moderate || 0 : 0,
        high: lastClosedIncident ? lastClosedIncident.high || 0 : 0,
        critical: lastClosedIncident ? lastClosedIncident.critical || 0 : 0,
      };

      
      setSummaryData(summary); // Update the tiles with the latest data
      setParsedData(parsed); // Store parsed data for rendering the chart
      setLoading(false);
    });
  } catch(error) {
      console.error('Error fetching data:', error);
    }
    
  }, [refreshTrigger]); // Re-run whenever refreshTrigger changes

  useEffect(() => {
    // Render the chart when switching to full view
    if (viewMode === 'full' && parsedData) {
      renderChart(parsedData);
    }
  }, [viewMode, parsedData]); // Re-run when viewMode or parsedData changes

  const renderChart = (data) => {
    const svgElement = d3.select(svgRef.current);
    const containerWidth = svgElement.node().parentNode.clientWidth;

    const width = containerWidth;
    const margin = { top: 10, right: 20, bottom: 25, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Clear previous SVG content if any
    svgElement.selectAll('*').remove();

    // Parse the data
    const parsedData = data;

    // Calculate total closed incidents categorized by severity levels
    const closedIncidents = parsedData.closed_selected_incidents.map(d => ({
      time: d.time,
      low: d.low || 0,
      moderate: d.moderate || 0,
      high: d.high || 0,
      critical: d.critical || 0,
      total: (d.low || 0) + (d.moderate || 0) + (d.high || 0) + (d.critical || 0)
    }));

    // Get the max value for closed incidents (stacked)
    const maxClosedIncidents = d3.max(closedIncidents, d => d.total) || 0;

    // Get the max value for active incidents
    const maxActiveIncidents = d3.max(parsedData.active_incidents, d => d.count) || 0; 
  

    // Create time scale based on both active and closed incidents' time range
    const xScale = d3.scaleTime()
      .domain([
        d3.timeDay.floor(d3.min(parsedData.opened_incidents, d => new Date(d.time))),
        d3.timeDay.ceil(d3.max(parsedData.closed_incidents, d => new Date(d.time)))
      ])
      .range([0, innerWidth]);

    // Get the min and max values for both active and closed incidents for Y scale
    const yMin = 0;
    const yMax = Math.max(maxClosedIncidents, maxActiveIncidents); // Ensure yMax is at least 0

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
    const areaGenerator = (y0Accessor, y1Accessor) => d3.area()
      .x(d => xScale(new Date(d.time)))
      .y0(y0Accessor)
      .y1(y1Accessor)
      .curve(d3.curveMonotoneX);

    // Area paths for each severity level
    const areaLow = areaGenerator(
      () => innerHeight,
      d => yScale(d.low)
    );

    const areaModerate = areaGenerator(
      d => yScale(d.low),
      d => yScale(d.low + d.moderate)
    );

    const areaHigh = areaGenerator(
      d => yScale(d.low + d.moderate),
      d => yScale(d.low + d.moderate + d.high)
    );

    const areaCritical = areaGenerator(
      d => yScale(d.low + d.moderate + d.high),
      d => yScale(d.total)
    );

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
      .attr('d', areaModerate);

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

    // Append active incidents line
    g.append('path')
      .datum(parsedData.active_incidents)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 2)
      .attr('class', 'line-active')
      .attr('d', lineActive);

    // Append the x-axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .attr('class', 'x-axis')
      .call(d3.axisBottom(xScale).tickPadding(5))
      .selectAll('text')
      .attr('fill', 'white');  // Make the axis text white

    g.select('.x-axis path').style('stroke', 'white'); // Set x-axis line color to white
    g.select('.x-axis line').style('stroke', 'white'); // Set x-axis ticks color to white
    g.select('.x-axis').selectAll('.tick line').attr('stroke', 'white');

    // Append the y-axis with 5 ticks
    g.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yScale)
        .ticks(5) // Specify 5 ticks on the y-axis
        .tickSize(-innerWidth)
        .tickPadding(5))
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

    const legendItemWidth = containerWidth / 5 - 80; // Adjust spacing as needed

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
        g.select('.x-axis').call(d3.axisBottom(newXScale).tickPadding(5));

        // Update line paths with new x-scale
        g.select('.line-active').attr('d', lineActive.x(d => newXScale(new Date(d.time))));

        // Update areas with new x-scale
        g.select('.area-low').attr('d', areaLow.x(d => newXScale(new Date(d.time))));
        g.select('.area-moderate').attr('d', areaModerate.x(d => newXScale(new Date(d.time))));
        g.select('.area-high').attr('d', areaHigh.x(d => newXScale(new Date(d.time))));
        g.select('.area-critical').attr('d', areaCritical.x(d => newXScale(new Date(d.time))));

        // Reapply styles to x-axis elements after zoom
        g.select('.x-axis').selectAll('text').attr('fill', 'white');
        g.select('.x-axis path').style('stroke', 'white');
        g.select('.x-axis line').style('stroke', 'white');
        g.select('.x-axis').selectAll('.tick line').attr('stroke', 'white');
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
  };

  // Handler to toggle view mode
  const handleToggleView = () => {
    setViewMode(viewMode === 'reduced' ? 'full' : 'reduced');
  };

  return (
    <div style={{ position: 'relative', minHeight: height }}>
      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(30,30,30,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10
        }}>
          <div className="spinner" />
        </div>
      )}
    <div
      style={{ cursor: 'pointer', width: '100%' }}
      onClick={handleToggleView}
      title={`Click to switch to ${viewMode === 'reduced' ? 'full' : 'reduced'} view`}
    >
      {/* Reduced View */}
      {viewMode === 'reduced' && summaryData && (
        <div className="tile" style={{ display: 'flex', gap: '10px', height: height}}>
          <div className="tile active-tile">
            <h4>Active Incidents</h4>
            <p>
              {summaryData.active.first}
              <span
                style={{
                  display: 'inline-block',
                  transform: `rotate(${summaryData.active.last > summaryData.active.first 
                    ? '-45deg' 
                    : summaryData.active.last < summaryData.active.first 
                    ? '45deg' 
                    : '0deg'})`,
                  margin: '0 5px',
                }}
              >
                →
              </span>
              {summaryData.active.last}
            </p>
          </div>
          <div className="tile low-tile">
            <h4>Closed Low Severity</h4>
            <p>{summaryData.low}</p>
          </div>
          <div className="tile moderate-tile">
            <h4>Closed Moderate Severity</h4>
            <p>{summaryData.moderate}</p>
          </div>
          <div className="tile high-tile">
            <h4>Closed High Severity</h4>
            <p>{summaryData.high}</p>
          </div>
          <div className="tile critical-tile">
            <h4>Closed Critical Severity</h4>
            <p>{summaryData.critical}</p>
          </div>
        </div>
      )}

      {/* Full View */}
      {viewMode === 'full' && <svg ref={svgRef} style={{ width: '100%', height: height }} />}
    </div>
    </div>
  );
};

export default IncidentsLineChart;
