import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { eel } from './App';

const CommonVariants = ({ height = 500, globalFilterTrigger, refreshTrigger }) => {
  const containerRef = useRef();
  const [selectedVariants, setSelectedVariants] = useState([]);

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
          .attr('class', 'variant')
          .attr('style', 'padding: 5px; margin: 5px; border-bottom: 1px solid #ccc; cursor: pointer; color: white')
          .text(d => `${d.count} (${d.percentage}) - ${d.sequence}`)
          .on('click', function(event, d) {
            // Toggle selection
            let updatedSelection;
            if (selectedVariants.includes(d.sequence)) {
              // If the clicked variant is already selected, unselect it
              updatedSelection = selectedVariants.filter(variant => variant !== d.sequence);
              d3.select(this).style('background-color', null); // Remove highlight
            } else {
              // Add the selected variant to the list
              updatedSelection = [...selectedVariants, d.sequence];
            }
            setSelectedVariants(updatedSelection);
            saveSelectedVariantsToBackend(updatedSelection);
          });

        // Highlight the selected variants if they are already selected
        container.selectAll('div.variant')
          .filter(d => selectedVariants.includes(d.sequence))
          .style('background-color', '#f0f0f0');
      });
    };

    createVisualization();
  }, [refreshTrigger, selectedVariants]); // The visualization will be recreated when the refreshTrigger or selectedVariants changes

  const saveSelectedVariantsToBackend = async (variants) => {
    try {
      // Call the exposed set_filter_value function to save the selected variants
      await eel.set_filter_value("filters.common_variants", variants)();
      globalFilterTrigger();
      console.log("Selected variants saved to backend:", variants);
    } catch (error) {
      console.error("Failed to save selected variants to backend:", error);
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: height, overflowY: 'auto' }} />
  );
};

export default CommonVariants;
