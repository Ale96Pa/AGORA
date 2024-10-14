import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { eel } from './App';
import { XMLParser } from 'fast-xml-parser';

const LinearizedPnmlVisualization = ({ height, refreshTrigger }) => {
  const svgRef = useRef();
  const [showNonCompliantTransitions, setShowNonCompliantTransitions] = useState(false); // State for toggle

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
      // ... (Existing code for circular bar chart remains unchanged)
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
      const nodeYPosition = (height + nodeRadius / 2) / 2 - 35;

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
        target: arc['@_target'],
        compliant: true, // Mark original arcs as compliant
      })) : [];

      // Combine places and transitions
      const allNodes = [...places, ...transitions];
      const availableWidth = width - 2 * (nodeRadius + 75); // Account for node radius and padding
      const nodeSpacing = availableWidth / (allNodes.length - 1); // Adjust spacing to fill the available width

      allNodes.forEach((node, index) => {
        node.x = nodeRadius + 75 + index * nodeSpacing;
        node.y = nodeYPosition;
      });

      // Create a color scale
      const colorScale = d3.scaleOrdinal()
        .domain(allNodes.map((d, i) => i))
        .range(['steelblue', 'orange', 'green', 'red', 'purple']);

      const svg = parent.append("svg")
        .attr("width", "100%")
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("background-color", "#1b1b1b");

      // Build set of valid transitions from arcs
      const validTransitions = new Set();
      arcs.forEach(arc => {
        const sourceNode = allNodes.find(n => n.id === arc.source);
        const targetNode = allNodes.find(n => n.id === arc.target);

        if (sourceNode && targetNode) {
          const sourceState = stateMapping[sourceNode.label];
          const targetState = stateMapping[targetNode.label];
          if (sourceState && targetState) {
            validTransitions.add(`${sourceState}->${targetState}`);
          }
        }
      });

      // Build set of observed transitions from transitionTimes
      const observedTransitions = new Set(Object.keys(transitionTimes));

      // Identify non-compliant transitions
      const nonCompliantTransitions = Array.from(observedTransitions).filter(
        transition => !validTransitions.has(transition)
      );

      // Map non-compliant transitions to source and target nodes
      const nonCompliantArcs = nonCompliantTransitions.map(transition => {
        const [sourceState, targetState] = transition.split('->');

        // Find nodes with these state codes
        const sourceNode = allNodes.find(n => stateMapping[n.label] === sourceState);
        const targetNode = allNodes.find(n => stateMapping[n.label] === targetState);

        if (sourceNode && targetNode) {
          return {
            source: sourceNode.id,
            target: targetNode.id,
            compliant: false,  // Mark as non-compliant
          };
        } else {
          return null;
        }
      }).filter(arc => arc !== null);

      // Combine compliant and non-compliant arcs based on toggle
      let allArcs = arcs;
      if (showNonCompliantTransitions) {
        allArcs = arcs.concat(nonCompliantArcs);
      }

      // Calculate arc paths and label positions
      allArcs.forEach(arc => calculateArcPath(arc));

      // Draw compliant arcs
      const compliantArcs = allArcs.filter(arc => arc.compliant);
      svg.append("g")
        .attr("class", "links")
        .selectAll("path")
        .data(compliantArcs)
        .enter().append("path")
        .attr("stroke-width", 3)
        .attr("stroke", "#aaa")
        .attr("fill", "none")
        .attr("d", d => d.path);

      // Draw non-compliant arcs (from underside)
      if (showNonCompliantTransitions) {
        const nonCompliantArcsVisible = allArcs.filter(arc => !arc.compliant);
        svg.append("g")
          .attr("class", "links")
          .selectAll("path")
          .data(nonCompliantArcsVisible)
          .enter().append("path")
          .attr("stroke-width", 3)
          .attr("stroke", "red")
          .attr("fill", "none")
          .attr("d", d => d.path);
      }

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
        .on("click", function (event, d) {
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
        .data(allArcs)
        .enter().append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "-0.5em")
        .attr("fill", "#FFF")
        .attr("font-size", "8px")
        .attr("x", arc => arc.labelX)
        .attr("y", arc => arc.labelY)
        .text(d => {
          const sourceNode = allNodes.find(n => n.id === d.source);
          const targetNode = allNodes.find(n => n.id === d.target);
          if (sourceNode && targetNode) {
            const sourceState = stateMapping[sourceNode.label];
            const targetState = stateMapping[targetNode.label];
            const transitionKey = `${sourceState}->${targetState}`;
            return transitionTimes[transitionKey] || '';
          }
          return '';
        });

      function calculateArcPath(arc) {
        const sourceNode = allNodes.find(n => n.id === arc.source);
        const targetNode = allNodes.find(n => n.id === arc.target);

        // Ensure both source and target nodes are defined
        if (!sourceNode || !targetNode) {
          arc.path = '';
          return;
        }

        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const midX = sourceNode.x + dx / 2;
        const midY = sourceNode.y + dy / 2;

        const nodesBetween = allNodes.filter(n =>
          n !== sourceNode &&
          n !== targetNode &&
          (
            (n.x > Math.min(sourceNode.x, targetNode.x) && n.x < Math.max(sourceNode.x, targetNode.x)) ||
            (n.y > Math.min(sourceNode.y, targetNode.y) && n.y < Math.max(sourceNode.y, targetNode.y))
          )
        );

        if (arc.compliant) {
          if (nodesBetween.length === 0) {
            // Draw straight line for compliant transitions with no nodes in between
            arc.labelX = midX;
            arc.labelY = midY - 10; // Slightly above the line
            arc.path = `M${sourceNode.x},${sourceNode.y} L${targetNode.x},${targetNode.y}`;
          } else {
            // Draw arc over the top for compliant transitions with nodes in between
            let radius = Math.abs(dx) / 0.75;  // Adjust this value to make the arc radius smaller
            if (radius === 0) radius = 1; // Avoid division by zero

            const sweepFlag = 1; // Arc over the top
            const arcDirection = -1; // Upwards

            // Calculate the sagitta (arc height)
            const c = Math.abs(dx);
            const r = radius;
            const h = r - Math.sqrt(r * r - (c / 2) * (c / 2));

            const labelX = midX;
            const labelY = sourceNode.y + (arcDirection * (h + 10)); // Position label above the arc

            arc.labelX = labelX;
            arc.labelY = labelY;

            arc.path = `M${sourceNode.x},${sourceNode.y} A${radius},${radius} 0 0,${sweepFlag} ${targetNode.x},${targetNode.y}`;
          }
        } else {
          // Non-compliant transitions (always drawn as arcs from underside)
          let radius = Math.abs(dx) / 0.75;
          if (radius === 0) radius = 1;

          const sweepFlag = 0; // Arc from underside
          const arcDirection = 1; // Downwards

          // Calculate the sagitta (arc height)
          const c = Math.abs(dx);
          const r = radius;
          const h = r - Math.sqrt(r * r - (c / 2) * (c / 2));

          const labelX = midX;
          const labelY = sourceNode.y + (arcDirection * (h + 10)); // Position label below the arc

          arc.labelX = labelX;
          arc.labelY = labelY;

          arc.path = `M${sourceNode.x},${sourceNode.y} A${radius},${radius} 0 0,${sweepFlag} ${targetNode.x},${targetNode.y}`;
        }
      }

      function dragstarted(event, d) {
        d3.select(this).raise();
      }

      function dragged(event, d) {
        d.x = event.x;
        d.y = event.y;
        d3.select(this).attr("transform", `translate(${d.x},${d.y})`);

        // Update arcs and transition texts
        allArcs.forEach(arc => calculateArcPath(arc));

        svg.selectAll("path").attr("d", d => d.path);

        transitionTexts
          .attr("x", arc => arc.labelX)
          .attr("y", arc => arc.labelY);

        // Update the circular bar chart position
        const chartGroup = svg.select(`.chart-${d.id}`);
        if (!chartGroup.empty()) {
          chartGroup.attr('transform', `translate(${d.x},${d.y})`);
        }
      }

      function dragended(event, d) {
        // Optionally, implement logic for when dragging ends
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
        console.log(transitionTimes);
        if (pnmlString) {
          createVisualization(container, pnmlString, deviations, stateMapping, stateTimes, transitionTimes);
        }
      } catch (error) {
        console.error("Failed to fetch and visualize PNML data:", error);
      }
    };

    fetchAndVisualizePnml();
  }, [height, refreshTrigger, showNonCompliantTransitions]);  // Re-render when toggle changes

  return (
    <div>
      <div style={{ color: '#fff' }}>
        <label>
          <input
            type="checkbox"
            checked={showNonCompliantTransitions}
            onChange={(e) => setShowNonCompliantTransitions(e.target.checked)}
          />
          Show Non-Compliant Transitions
        </label>
      </div>
      <div ref={svgRef} style={{ width: '100%', height: `${height}px` }}></div>
    </div>
  );
};

export default LinearizedPnmlVisualization;