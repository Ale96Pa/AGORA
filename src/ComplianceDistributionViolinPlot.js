import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { eel } from './App';

const DistributionViolinPlot = ({ height = 500, refreshTrigger }) => {
  const svgRef = useRef();

  useEffect(() => {
    // Fetch the data from the Python function using eel
    eel.get_compliance_metric_distribution()().then(data => {
      const svgElement = d3.select(svgRef.current);
      const containerWidth = svgElement.node().parentNode.clientWidth;

      const width = containerWidth;
      const marginTop = 20;
      const marginRight = 40;
      const marginBottom = 30;
      const marginLeft = 20;

      // Clear previous SVG content if any
      svgElement.selectAll('*').remove();

      // Parse the data
      const parsedData = JSON.parse(data).map(d => d.value);

      // Create the vertical scale (y-axis)
      const y = d3.scaleLinear()
        .domain([0, d3.max(parsedData)]).nice()
        .range([height - marginBottom, marginTop]);

      const yAxis = d3.axisRight(y);

      // Create a histogram to get the distribution of data
      const histogram = d3.bin()
        .domain(y.domain())
        .thresholds(y.ticks(20)) // Adjust the number of thresholds as needed
        .value(d => d);

      const bins = histogram(parsedData);

      // Create the horizontal scale (x-axis) for the density
      const x = d3.scaleLinear()
        .range([width - marginRight, marginLeft])
        .domain([0, d3.max(bins, d => d.length)]);

      const area = d3.area()
        .x0(d => x(0))
        .x1(d => x(d.length))
        .y(d => y(d.x0))
        .curve(d3.curveCatmullRom); // Smooth the curve

      // Append the violin plot
      svgElement.append("path")
        .datum(bins)
        .attr("fill", "steelblue")
        .attr("opacity", 0.7)
        .attr("stroke", "#fff")
        .attr("d", area);

      // Append the y-axis and set its color to white
      svgElement.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${width - marginRight},0)`)
        .call(yAxis)
        .selectAll("text")
        .style("fill", "white"); // Set y-axis text color to white

      svgElement.select(".y-axis path").style("stroke", "white"); // Set y-axis line color to white
      svgElement.select(".y-axis line").style("stroke", "white"); // Set y-axis ticks color to white

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
          svg.selectAll("path").attr("d", area.x1(d => newX(d.length)));
          svg.selectAll(".y-axis").call(yAxis);
        }
      }
    }).catch(error => {
      console.error('Error fetching data:', error);
    });
  }, [height, refreshTrigger]); // Adding refreshTrigger to the dependency array

  return (
    <svg ref={svgRef} style={{ width: '100%', height: height }} />
  );
};

export default DistributionViolinPlot;
