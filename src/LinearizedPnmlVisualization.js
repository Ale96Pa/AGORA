import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { eel } from './App';
import { XMLParser } from 'fast-xml-parser';

const LinearizedPnmlVisualization = ({ height, refreshTrigger }) => {
  const svgRef = useRef();

  useEffect(() => {
    const parsePnml = async (pnmlString) => {
      try {
        const parserOptions = {
          ignoreAttributes: false,
          attributeNamePrefix: "@_"
        };
        const parser = new XMLParser(parserOptions);
        const result = parser.parse(pnmlString);
        return result;
      } catch (err) {
        console.error("Error parsing PNML:", err);
        throw err;
      }
    };

    // Function to create and update circular bar charts
    function createCircularBarChart(svg, chartInnerRadius, deviations, activity, x, y, id) {
      let categories = ['MISSING', 'REPETITION', 'MISMATCH'];
      let colors = ['green', 'lime', 'yellow', 'darkorange'];

      let values = {
        'MISSING': deviations.missing[activity],
        'REPETITION': deviations.repetition[activity],
        'MISMATCH': deviations.mismatch[activity]
      };

      let maxDeviation = values.MISSING + values.REPETITION + values.MISMATCH;

      let data = categories.map((c, i) => ({
        name: c,
        value: values[c],
        color: colors[i]
      }));

      let chartOuterRadius = chartInnerRadius + 20;
      let barPadding = 1;
      let nBars = categories.length;
      let barWidth = (chartOuterRadius - chartInnerRadius) / nBars - barPadding;

      data.forEach((d, i) => {
        d.radius = (chartOuterRadius - chartInnerRadius) / nBars * i + barPadding;
      });

      let bgArc = d3.arc()
        .innerRadius(d => chartInnerRadius + d.radius)
        .outerRadius(d => chartInnerRadius + d.radius + barWidth)
        .startAngle(0)
        .endAngle(Math.PI);

      let chartGroup = svg.select(`.chart-${id}`);
      if (chartGroup.empty()) {
        chartGroup = svg.append('g').attr('class', `chart-${id}`);
      }
      chartGroup.attr('transform', `translate(${x},${y})`);

      let bgBars = chartGroup.selectAll('path.arc')
        .data(data)
        .join('path')
        .attr('class', 'arc')
        .style('fill', d => d.color)
        .style('opacity', 0.5)
        .attr('d', d => bgArc(d));

      let arc = d3.arc()
        .innerRadius(d => chartInnerRadius + d.radius)
        .outerRadius(d => chartInnerRadius + d.radius + barWidth)
        .startAngle(0)
        .endAngle(d => angle(d.value / maxDeviation));

      let bars = chartGroup;
      bars.selectAll('path.bar')
        .data(data)
        .join('path')
        .attr('class', 'bar')
        .style('fill', d => d.color)
        .attr('d', d => arc(d));

      // Add text labels at the end of each bar
      bars.selectAll('text.value')
        .data(data)
        .join(enter => enter.append('text')
          .attr('class', 'value')
          .attr('x', d => coord(1.50, chartInnerRadius + d.radius + barWidth / 2).x - 5)
          .attr('y', d => coord(0.50, chartInnerRadius + d.radius + barWidth / 2).y)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'end')
          .attr('fill', '#fff')
          .attr('font-size', '8px')
          .text(d => d.value));

      // Add category names to the left of the starting point of each bar
      bars.selectAll('text.category')
        .data(data)
        .join(enter => enter.append('text')
          .attr('class', 'category')
          .attr('x', d => coord(1.50, chartInnerRadius + d.radius + barWidth / 2).x - 5)
          .attr('y', d => coord(1.50, chartInnerRadius + d.radius + barWidth / 2).y)
          .attr('dy', '0.2em')
          .attr('text-anchor', 'end')
          .attr('fill', '#fff')
          .attr('font-size', '8px')
          .text(d => d.name));

      function angle(value) {
        return d3.scaleLinear()
          .domain([0, 1])
          .range([0, Math.PI])(value);
      }

      function coord(value, radius) {
        let a = angle(value);
        let x_off = Math.cos(a) * radius;
        let y_off = Math.sin(a) * radius;
        return { x: x_off, y: y_off };
      }
    }

    const createVisualization = async (container, pnmlString, deviations, stateMapping, stateTimes, transitionTimes) => {
      const parent = d3.select(container);
      parent.selectAll('*').remove();

      const width = parent.node().getBoundingClientRect().width;
      const nodeRadius = 40;
      const nodeYPosition = ( height + nodeRadius/ 2 ) / 2 ;

      // Parse the PNML string
      const parsedPnml = await parsePnml(pnmlString);

      const net = parsedPnml?.pnml?.net;
      if (!net) {
        throw new Error("PNML data does not contain 'net' property.");
      }

      const netData = Array.isArray(net) ? net[0] : net;

      const places = netData.place ? netData.place.map(place => {
        const name = place?.name?.text ?? place['@_id'];
        return {
          id: place['@_id'],
          label: name,
          type: 'place'
        };
      }) : [];

      const transitions = netData.transition ? netData.transition.map(transition => {
        const name = transition?.name?.text ?? transition['@_id'];
        return {
          id: transition['@_id'],
          label: name,
          type: 'transition'
        };
      }) : [];

      const arcs = netData.arc ? netData.arc.map(arc => ({
        source: arc['@_source'],
        target: arc['@_target']
      })) : [];

      // Combine places and transitions
      const allNodes = [...places, ...transitions];
      const availableWidth = width - 2 * (nodeRadius + 14); // Account for node radius and 2px padding on each side
      const nodeSpacing = availableWidth / (allNodes.length - 1); // Adjust spacing to fill the available width

      allNodes.forEach((node, index) => {
        node.x = nodeRadius + 14 + index * nodeSpacing; // Start at nodeRadius + 2px
        node.y = nodeYPosition;
      });

      // Create a color scale
      const colorScale = d3.scaleOrdinal()
        .domain(allNodes.map((d, i) => i))  // Assuming nodes are colored in their order
        .range(['steelblue', 'orange', 'green', 'red', 'purple']);

      const svg = parent.append("svg")
        .attr("width", "100%")
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("background-color", "#1b1b1b");

      // Draw links with corners (elbows)
      const link = svg.append("g")
        .attr("class", "links")
        .selectAll("path")
        .data(arcs)
        .enter().append("path")
        .attr("stroke-width", 2)
        .attr("stroke", "#aaa")
        .attr("fill", "none")
        .attr("d", d => calculateArcPath(d));

      // Draw nodes with colorScale
      const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(allNodes)
        .enter().append("g")
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended))
        .on("click", function(event, d) {
          const chartGroup = svg.select(`.chart-${d.id}`);
          if (!chartGroup.empty()) {
            chartGroup.remove();
          } else {
            if (stateMapping[d.label]) {
              createCircularBarChart(svg, nodeRadius, deviations, stateMapping[d.label], d.x, d.y, d.id);
            } else {
              console.error('Label not found in the mapping:', d.label);
              return null;
            }
          }
        });

      node.append("circle")
        .attr("r", nodeRadius)
        .attr("fill", (d, i) => colorScale(i));

      node.append("text")
        .attr("text-anchor", "middle")
        .attr("fill", "#FFF")
        .text(d => d.label);

      node.append("text")
        .attr("dy", "2em")
        .attr("text-anchor", "middle")
        .attr("fill", "#FFF")
        .attr("font-size", "8px")
        .text(d => stateMapping[d.label] && stateTimes[stateMapping[d.label]] ? stateTimes[stateMapping[d.label]] : '');

      // Draw transition texts (visible by default)
      const transitionTexts = svg.append("g")
        .attr("class", "transition-texts")
        .selectAll("text")
        .data(arcs)
        .enter().append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "-0.5em")
        .attr("fill", "#FFF")
        .attr("font-size", "8px")
        .attr("x", arc => (allNodes.find(n => n.id === arc.source).x + allNodes.find(n => n.id === arc.target).x) / 2)
        .attr("y", arc => (allNodes.find(n => n.id === arc.source).y + allNodes.find(n => n.id === arc.target).y) / 2)
        .text(d => {
          const sourceNode = allNodes.find(n => n.id === d.source);
          const targetNode = allNodes.find(n => n.id === d.target);
          if (sourceNode && targetNode) {
            const transitionKey = `${stateMapping[sourceNode.label]}->${stateMapping[targetNode.label]}`;
            return transitionTimes[transitionKey] || '';
          }
          return '';
        });

      function calculateArcPath(arc) {
        const sourceNode = allNodes.find(n => n.id === arc.source);
        const targetNode = allNodes.find(n => n.id === arc.target);

        // Ensure both source and target nodes are defined
        if (!sourceNode || !targetNode) {
          return;  // Skip this arc if either source or target node is undefined
        }

        const dx = targetNode.x - sourceNode.x;
        const midX = sourceNode.x + dx / 2;

        const skippedNodes = allNodes.filter(n => n.x > sourceNode.x && n.x < targetNode.x);

        if (skippedNodes.length > 0) {
          const radius = dx / 1.05;  // Adjust this value to make the arc radius smaller
          const sweepFlag = 1;
          return `M${sourceNode.x},${sourceNode.y} A${radius},${radius} 0 0,${sweepFlag} ${targetNode.x},${targetNode.y}`;
        } else {
          return `M${sourceNode.x},${sourceNode.y} H${midX} V${targetNode.y} H${targetNode.x}`;
        }
      };

      function dragstarted(event, d) {
        d3.select(this).raise();
      }

      function dragged(event, d) {
        d.x = event.x;
        d.y = event.y;
        d3.select(this).attr("transform", `translate(${d.x},${d.y})`);

        // Update arcs and transition texts
        svg.selectAll("path").attr("d", calculateArcPath);
        transitionTexts
          .attr("x", arc => (allNodes.find(n => n.id === arc.source).x + allNodes.find(n => n.id === arc.target).x) / 2)
          .attr("y", arc => (allNodes.find(n => n.id === arc.source).y + allNodes.find(n => n.id === arc.target).y) / 2);

        // Update the circular bar chart position
        const chartGroup = svg.select(`.chart-${d.id}`);
        if (!chartGroup.empty()) {
          chartGroup.attr('transform', `translate(${d.x},${d.y})`);
        }
      }

      function dragended(event, d) {
      }
    };

    const fetchAndVisualizePnml = async () => {
      try {
        const [pnmlString, deviations, stateMapping, stateTimes, transitionTimes] = await Promise.all([
          eel.get_pnml_data()(),
          eel.count_frequencies()(),
          eel.read_mapping_from_file()(),
          eel.get_average_state_times()(),
          eel.get_average_transition_times()(),
        ]);

        const container = svgRef.current;

        if (pnmlString) {
          createVisualization(container, pnmlString, deviations, stateMapping, stateTimes, transitionTimes);
        }
      } catch (error) {
        console.error("Failed to fetch and visualize PNML data:", error);
      }
    };

    fetchAndVisualizePnml();
  }, [height, refreshTrigger]);  // Re-render the visualization if height or refreshTrigger changes

  return <div ref={svgRef} style={{ width: '100%', height: `${height}px` }}></div>;
};

export default LinearizedPnmlVisualization;
