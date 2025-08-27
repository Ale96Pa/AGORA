import React, { useRef, useState, useEffect } from 'react';
import * as d3 from 'd3';
import { eel } from './App';

const DistributionPlot = ({ height = 500, refreshTrigger }) => {
  const svgRef = useRef();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    eel.get_compliance_metric_distribution()().then(data => {
      const svgElement = d3.select(svgRef.current);
      const containerWidth = svgElement.node().parentNode.clientWidth;

      const width = containerWidth;
      const marginTop = 10;
      const marginRight = 20;
      const marginBottom = 25;
      const marginLeft = 40;

      // Clear previous SVG content if any
      svgElement.selectAll('*').remove();

      // Parse the data
      const parsedData = JSON.parse(data).map(d => d.value);

      // Create the horizontal scale (x-axis) for data values
      const x = d3.scaleLinear()
        .domain([0, 1]).nice()
        .range([marginLeft, width - marginRight]);

      const xAxis = d3.axisBottom(x);

      // Create a histogram to get the distribution of data
      const histogram = d3.bin()
        .domain(x.domain())
        .thresholds(x.ticks(20)) // Adjust the number of thresholds as needed
        .value(d => d);

      const bins = histogram(parsedData);

      // Create the vertical scale (y-axis) for density
      const y = d3.scaleLinear()
        .range([height - marginBottom, marginTop])
        .domain([0, d3.max(bins, d => d.length)]);

      const yAxis = d3.axisLeft(y);

      // Create the area for the violin plot
      const area = d3.area()
        .x(d => x(d.x0))
        .y0(y(0))
        .y1(d => y(d.length))
        .curve(d3.curveCatmullRom); // Smooth the curve

      // Append the violin plot
      svgElement.append("path")
        .datum(bins)
        .attr("fill", "steelblue")
        .attr("opacity", 0.7)
        .attr("stroke", "#fff")
        .attr("d", area);

      // Append the x-axis and set its color to white
      svgElement.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(xAxis)
        .selectAll("text")
        .style("fill", "white");

      svgElement.select(".x-axis path").style("stroke", "white");
      svgElement.selectAll(".x-axis line").style("stroke", "white");

      // Append the y-axis and set its color to white
      svgElement.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(yAxis)
        .selectAll("text")
        .style("fill", "white");

      svgElement.select(".y-axis path").style("stroke", "white");
      svgElement.selectAll(".y-axis line").style("stroke", "white");

      // Apply zoom behavior
      svgElement.call(zoom);

      function zoom(svg) {
        const extent = [[marginLeft, marginTop], [width - marginRight, height - marginBottom]];

        svg.call(d3.zoom()
          .scaleExtent([1, 1000])
          .translateExtent(extent)
          .extent(extent)
          .on("zoom", zoomed));

        function zoomed(event) {
          const newX = event.transform.rescaleX(x);
          svg.selectAll("path").attr("d", area.x(d => newX(d.x0)));
          svg.selectAll(".x-axis").call(xAxis.scale(newX));
          svg.selectAll(".y-axis").call(yAxis);
        }
      }
      setLoading(false);
    }).catch(error => {
      console.error('Error fetching data:', error);
    });
  }, [height, refreshTrigger]);

  return (
    <div style={{ position: 'relative'}}>
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
      <svg ref={svgRef} style={{ width: '100%', height: height }} />
    </div>
  );
};

export default DistributionPlot;
