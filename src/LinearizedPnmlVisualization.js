import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { eel } from './App';
import { XMLParser } from 'fast-xml-parser';

const LinearizedPnmlVisualization = ({ height }) => {
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

    const createVisualization = async (container, pnmlString) => {
      const parent = d3.select(container);
      parent.selectAll('*').remove();

      const width = parent.node().getBoundingClientRect().width;
      const nodeRadius = 40;
      const nodeYPosition = height - nodeRadius - 2;

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
      const availableWidth = width - 2 * (nodeRadius + 2); // Account for node radius and 2px padding on each side
      const nodeSpacing = availableWidth / (allNodes.length - 1); // Adjust spacing to fill the available width

      allNodes.forEach((node, index) => {
        node.x = nodeRadius + 2 + index * nodeSpacing; // Start at nodeRadius + 2px
        node.y = nodeYPosition;
      });

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

      // Draw nodes
      const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(allNodes)
        .enter().append("g")
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

      node.append("circle")
        .attr("r", nodeRadius)
        .attr("fill", d => d.type === 'place' ? '#1f77b4' : '#ff7f0e');

      node.append("text")
        .attr("text-anchor", "middle")
        .attr("fill", "#FFF")
        .text(d => d.label);

      function calculateArcPath(arc) {
        const sourceNode = allNodes.find(n => n.id === arc.source);
        const targetNode = allNodes.find(n => n.id === arc.target);

        const dx = targetNode.x - sourceNode.x;
        const midX = sourceNode.x + dx / 2;

        const skippedNodes = allNodes.filter(n => n.x > sourceNode.x && n.x < targetNode.x);

        if (skippedNodes.length > 0) {
          const radius = dx / 1.25;  // Adjust this value to make the arc radius smaller
          const sweepFlag = 1;
          return `M${sourceNode.x},${sourceNode.y} A${radius},${radius} 0 0,${sweepFlag} ${targetNode.x},${targetNode.y}`;
        } else {
          return `M${sourceNode.x},${sourceNode.y} H${midX} V${targetNode.y} H${targetNode.x}`;
        }
      }

      function dragstarted(event, d) {
        d3.select(this).raise();
      }

      function dragged(event, d) {
        d.x = event.x;
        d.y = event.y;
        d3.select(this).attr("transform", `translate(${d.x},${d.y})`);

        // Update arcs on node drag
        svg.selectAll("path").attr("d", calculateArcPath);
      }

      function dragended(event, d) {
        // No additional actions on drag end
      }
    };

    const fetchAndVisualizePnml = async () => {
      try {
        // Fetch the PNML string from Eel
        const pnmlString = await eel.get_pnml_data()();  // Assuming eel.get_pnml_data() fetches the PNML string
        const container = svgRef.current;

        if (pnmlString) {
          createVisualization(container, pnmlString);
        }
      } catch (error) {
        console.error("Failed to fetch and visualize PNML data:", error);
      }
    };

    fetchAndVisualizePnml();
  }, [height]);  // Re-render the visualization if the height changes

  return <div ref={svgRef} style={{ width: '100%', height: `${height}px` }}></div>;
};

export default LinearizedPnmlVisualization;
