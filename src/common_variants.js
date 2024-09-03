import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { eel } from './App';

const CommonVariants = ({ height = 500, refreshTrigger }) => {
  const containerRef = useRef();

  useEffect(() => {
    // Create the visualization when the component mounts or when refreshTrigger changes
    const createVisualization = () => {
      const container = d3.select(containerRef.current);

      // Clear the container first to ensure that old content is removed
      container.selectAll('*').remove();

      // Fetch the sorted variants from the backend
      eel.get_sorted_variants_from_db()().then(variants => {
        // Map the tuple structure to an object for easier manipulation
        const variantObjects = variants.map(variant => ({
          sequence: variant[0],
          count: variant[1],
          percentage: (variant[1] / variants.reduce((sum, v) => sum + v[1], 0) * 100).toFixed(1) + '%'
        }));

        // Bind the data to the elements and create the variant visualization
        container.selectAll('div.variant')
          .data(variantObjects)
          .enter()
          .append('div')
          .attr('style', 'padding: 5px; margin: 5px; border-bottom: 1px solid #ccc; cursor: pointer;')
          .text(d => `${d.count} (${d.percentage}) - ${d.sequence}`)
          .on('click', function(event, d) {
            container.selectAll('div.variant').style('background-color', null); // Remove background from all
            d3.select(this).style('background-color', '#f0f0f0'); // Highlight the clicked element
          });
      });
    };

    createVisualization();
  }, [refreshTrigger]); // The visualization will be recreated when the refreshTrigger changes

  return (
    <div ref={containerRef} style={{ width: '100%', height: height, overflowY: 'auto' }} />
  );
};

export default CommonVariants;
