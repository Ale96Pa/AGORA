import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { eel } from './App';
import './TechnicalAnalysis.css';

const TechnicalAnalysis = ({ width = 1000, height = 500, globalFilterTrigger, refreshTrigger }) => {
  const svgRef = useRef();
  const [enabledScales, setEnabledScales] = useState({
    symptom: true,
    impact: true,
    urgency: true,
    priority: true,
    location: true,
    category: true, // Always true and cannot be disabled
  });

  // State to track selected values on each axis
  const [selectedValues, setSelectedValues] = useState({
    symptom: [],
    impact: [],
    urgency: [],
    priority: [],
    location: [],
    category: [],
  });

  const [traces, setTraces] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [symptomDistribution, setSymptomDistribution] = useState([]);
  const [locationDistribution, setLocationDistribution] = useState([]);

  // Fetch incident technical attributes from the backend using eel
  useEffect(() => {
    const fetchTechnicalAttributes = async () => {
      try {
        // Call the eel function to get the technical attributes for selected incidents
        const incidentData = await eel.get_incident_technical_attributes()(); // Directly use the returned JavaScript object

        console.log(incidentData);
        // Set the traces with the actual data
        setTraces(incidentData);

        // Build the category distribution based on the fetched data
        const categoryCountMap = {};
        incidentData.forEach(trace => {
          const category = trace.category == null ? '?' : trace.category; // Replace 'null' with '?'
          if (categoryCountMap[category]) {
            categoryCountMap[category] += 1;
          } else {
            categoryCountMap[category] = 1;
          }
        });

        const categoryDistributionData = Object.keys(categoryCountMap).map(category => ({
          category: category, // Keep category as is
          count: categoryCountMap[category],
        }));

        // Sort categoryDistribution by count in descending order
        const sortedCategoryDistribution = categoryDistributionData.sort((a, b) => b.count - a.count);
        setCategoryDistribution(sortedCategoryDistribution);

        console.log('Category Distribution:', sortedCategoryDistribution);

        // Build Symptom distribution
        const symptomCountMap = {};
        incidentData.forEach(trace => {
          const symptom = trace.symptom == null ? '?' : trace.symptom; // Replace 'null' with '?'
          if (symptomCountMap[symptom]) {
            symptomCountMap[symptom] += 1;
          } else {
            symptomCountMap[symptom] = 1;
          }
        });

        const symptomDistributionData = Object.keys(symptomCountMap).map(symptom => ({
          symptom: symptom,
          count: symptomCountMap[symptom],
        }));

        // Sort symptomDistribution by count in descending order
        const sortedSymptomDistribution = symptomDistributionData.sort((a, b) => b.count - a.count);
        setSymptomDistribution(sortedSymptomDistribution);

        console.log('Symptom Distribution:', sortedSymptomDistribution);

        // Build Location distribution
        const locationCountMap = {};
        incidentData.forEach(trace => {
          const location = trace.location == null ? '?' : trace.location; // Replace 'null' with '?'
          if (locationCountMap[location]) {
            locationCountMap[location] += 1;
          } else {
            locationCountMap[location] = 1;
          }
        });

        const locationDistributionData = Object.keys(locationCountMap).map(location => ({
          location: location,
          count: locationCountMap[location],
        }));

        // Sort locationDistribution by count in descending order
        const sortedLocationDistribution = locationDistributionData.sort((a, b) => b.count - a.count);
        setLocationDistribution(sortedLocationDistribution);

        console.log('Location Distribution:', sortedLocationDistribution);

      } catch (error) {
        console.error('Failed to fetch technical attributes:', error);
      }
    };

    fetchTechnicalAttributes();
  }, [refreshTrigger]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const containerWidth = svgRef.current.getBoundingClientRect().width;

    // Clear previous SVG content
    svg.selectAll('*').remove();

    const margin = { top: 30, right: 10, bottom: 20, left: 10 };
    const innerWidth = containerWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Generate scales
    const scales = {
      symptom: symptomDistribution.map(d => d.symptom),
      impact: ['1', '2', '3', '4'], 
      urgency: ['1', '2', '3', '4'],
      priority: ['1', '2', '3', '4'],
      location: locationDistribution.map(d => d.location),
      category: categoryDistribution.map(d => d.category),
    };

    const enabledKeys = Object.keys(enabledScales).filter(key => enabledScales[key]);
    const scaleWidth = innerWidth / (enabledKeys.length + 1); // +1 for the histogram

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const yScales = {};

    // Draw scales
    enabledKeys.forEach((scale, index) => {
      const xPosition = index * scaleWidth + scaleWidth / 2; // Center the axis and title
      const scaleGroup = g.append('g')
        .attr('transform', `translate(${xPosition}, 0)`);

      // Use scaleBand for all scales to handle categorical data
      const yScale = d3.scaleBand()
        .domain(scales[scale])
        .range([0, innerHeight]);

      const yAxis = d3.axisLeft(yScale);

      yScales[scale] = yScale;

      const axisGroup = scaleGroup.append('g')
        .call(yAxis)
        .attr('class', `${scale}-axis axis`); // Assign 'axis' class

      axisGroup.selectAll('text')
        .attr('fill', d => (selectedValues[scale].includes(d) ? 'red' : 'white')) // Highlight selected value in red
        .style('cursor', 'pointer')
        .style('font-size', '8px')
        .on('click', async function (event, d) {
          // Update selected values in the state
          setSelectedValues(prev => {
            const newSelectedValues = { ...prev };
            const selectedForScale = newSelectedValues[scale];

            if (selectedForScale.includes(d)) {
              // If the value is already selected, remove it
              newSelectedValues[scale] = selectedForScale.filter(value => value !== d);
            } else {
              // Otherwise, add it to the selected values
              newSelectedValues[scale] = [...selectedForScale, d];
            }
            // Update the backend with the new selected values
            updateBackendFilter(scale, newSelectedValues[scale]);
            return newSelectedValues;
          });
        });

      // Add scale title, highlight in red if any value on this axis is selected
      scaleGroup.append('text')
        .attr('class', 'axis-title') // Assign 'axis-title' class
        .attr('x', 0)
        .attr('y', -20)
        .attr('text-anchor', 'middle')
        .attr('fill', selectedValues[scale].length > 0 ? 'red' : 'white')
        .style('font-size', '12px')
        .text(scale.charAt(0).toUpperCase() + scale.slice(1));
    });

    // Create a map to count the number of occurrences of each link
    const linkCountMap = {};

    traces.forEach((trace) => {
      enabledKeys.forEach((key, index) => {
        if (index < enabledKeys.length - 1) {
          const nextKey = enabledKeys[index + 1];
          const value1 = trace[key] == null ? '?' : trace[key].toString();
          const value2 = trace[nextKey] == null ? '?' : trace[nextKey].toString();
          const linkKey = `${key}-${value1}-${nextKey}-${value2}`;

          if (linkCountMap[linkKey]) {
            linkCountMap[linkKey] += 1;
          } else {
            linkCountMap[linkKey] = 1;
          }
        }
      });
    });

    // Function to determine the color of the trace based on selected values
    const getTraceColor = (trace) => {
      // Check if there are any selected values
      const hasSelectedValues = Object.values(selectedValues).some(values => values.length > 0);

      // If there are selected values, return red if the trace matches all selected values, else white
      if (hasSelectedValues) {
        return enabledKeys.every(key => {
          const value = trace[key] == null ? '?' : trace[key].toString();
          return selectedValues[key].length === 0 || selectedValues[key].includes(value);
        }) ? 'red' : 'white';
      }

      // If no values are selected, return white
      return 'white';
    };

    // Draw white traces first
    traces.forEach((sampleData, traceIndex) => {
      const trace = enabledKeys.map((key, index) => {
        const x = index * scaleWidth + scaleWidth / 2;
        const value = sampleData[key] == null ? '?' : sampleData[key].toString();
        const y = yScales[key](value) + yScales[key].bandwidth() / 2;
        return { x, y };
      });

      const traceColor = getTraceColor(sampleData); // Get the color based on selected values

      // Only draw white traces in this loop
      if (traceColor === 'white') {
        trace.forEach((point, index) => {
          if (index < trace.length - 1) {
            const nextPoint = trace[index + 1];
            const key = enabledKeys[index];
            const nextKey = enabledKeys[index + 1];
            const value1 = sampleData[key] == null ? '?' : sampleData[key].toString();
            const value2 = sampleData[nextKey] == null ? '?' : sampleData[nextKey].toString();
            const linkKey = `${key}-${value1}-${nextKey}-${value2}`;
            const strokeWidth = Math.log10(1 + linkCountMap[linkKey]);

            g.append('line')
              .attr('x1', point.x)
              .attr('y1', point.y)
              .attr('x2', nextPoint.x)
              .attr('y2', nextPoint.y)
              .attr('stroke', traceColor) // Use the determined trace color
              .attr('stroke-width', strokeWidth)
              .attr('opacity', 0.5);
          }
        });

        // Draw trace points for better visibility for each trace
        g.selectAll(`.trace-point-white-${traceIndex}`)
          .data(trace)
          .enter()
          .append('circle')
          .attr('class', `trace-point-white-${traceIndex}`)
          .attr('cx', d => d.x)
          .attr('cy', d => d.y)
          .attr('r', 4)
          .attr('fill', traceColor) // Use the determined trace color
          .attr('opacity', 0.5);
      }
    });

    // Draw red traces on top of white traces
    traces.forEach((sampleData, traceIndex) => {
      const trace = enabledKeys.map((key, index) => {
        const x = index * scaleWidth + scaleWidth / 2;
        const value = sampleData[key] == null ? '?' : sampleData[key].toString();
        const y = yScales[key](value) + yScales[key].bandwidth() / 2;
        return { x, y };
      });

      const traceColor = getTraceColor(sampleData); // Get the color based on selected values

      // Only draw red traces in this loop
      if (traceColor === 'red') {
        trace.forEach((point, index) => {
          if (index < trace.length - 1) {
            const nextPoint = trace[index + 1];
            const key = enabledKeys[index];
            const nextKey = enabledKeys[index + 1];
            const value1 = sampleData[key] == null ? '?' : sampleData[key].toString();
            const value2 = sampleData[nextKey] == null ? '?' : sampleData[nextKey].toString();
            const linkKey = `${key}-${value1}-${nextKey}-${value2}`;
            const strokeWidth = Math.log10(1 + linkCountMap[linkKey]);

            g.append('line')
              .attr('x1', point.x)
              .attr('y1', point.y)
              .attr('x2', nextPoint.x)
              .attr('y2', nextPoint.y)
              .attr('stroke', traceColor) // Use the determined trace color
              .attr('stroke-width', strokeWidth)
              .attr('opacity', 0.5);
          }
        });

        // Draw trace points for better visibility for each trace
        g.selectAll(`.trace-point-red-${traceIndex}`)
          .data(trace)
          .enter()
          .append('circle')
          .attr('class', `trace-point-red-${traceIndex}`)
          .attr('cx', d => d.x)
          .attr('cy', d => d.y)
          .attr('r', 4)
          .attr('fill', traceColor) // Use the determined trace color
          .attr('opacity', 0.5);
      }
    });

    // Draw the histogram for the Category distribution as a horizontal bar chart
    const histogramXPosition = enabledKeys.length * scaleWidth + scaleWidth / 2; // Position the histogram to the right

    const xHistogramScale = d3.scaleLinear()
      .domain([0, d3.max(categoryDistribution, d => d.count)])
      .range([0, scaleWidth]);

    const yHistogramScale = d3.scaleBand()
      .domain(categoryDistribution.map(d => d.category))
      .range([0, innerHeight]) // Match the category axis, starting from the top
      .padding(0.1);

    const histogramGroup = g.append('g')
      .attr('transform', `translate(${histogramXPosition - scaleWidth / 2}, 0)`); // Align histogram with category axis

    histogramGroup.selectAll('.bar')
      .data(categoryDistribution.filter(d => d.count > 0))
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', d => yHistogramScale(d.category))
      .attr('width', d => xHistogramScale(d.count))
      .attr('height', yHistogramScale.bandwidth())
      .attr('fill', 'steelblue');

    // Align the histogram's y-axis with the Category axis
    g.select(`.${enabledKeys[enabledKeys.length - 1]}-axis`).call(d3.axisLeft(yHistogramScale))
      .selectAll('text')
      .attr('fill', d => (selectedValues.category.includes(d) ? 'red' : 'white')) // Highlight selected value in red
      .style('cursor', 'pointer')
      .style('font-size', '8px')
      .on('click', async function (event, d) {
        // Update selected values in the state
        setSelectedValues(prev => {
          const newSelectedValues = { ...prev };
          const selectedForScale = newSelectedValues.category;

          if (selectedForScale.includes(d)) {
            // If the value is already selected, remove it
            newSelectedValues.category = selectedForScale.filter(value => value !== d);
          } else {
            // Otherwise, add it to the selected values
            newSelectedValues.category = [...selectedForScale, d];
          }
          // Update the backend with the new selected values
          updateBackendFilter('category', newSelectedValues.category);
          return newSelectedValues;
        });
      });

    // Add the histogram's x-axis for the counts
    histogramGroup.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xHistogramScale).ticks(5))
      .selectAll('text')
      .attr('fill', 'white'); // Make the axis text white

    // Calculate total count for the category
    const totalCount = categoryDistribution.reduce((acc, cur) => acc + cur.count, 0);

    // Add total count text between category axis and the bar chart
    histogramGroup.selectAll('.total-count')
      .data(categoryDistribution.filter(d => d.count > 0))
      .enter()
      .append('text')
      .attr('x', d => -scaleWidth / 4)
      .attr('y', d => yHistogramScale(d.category) + yHistogramScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', 'white')
      .attr('text-anchor', 'middle')
      .style('font-size', '8px')
      .text(d => `${d.count}`);

    // Bring axes and titles to the front
    g.selectAll('.axis').raise();
    g.selectAll('.axis-title').raise();

  }, [enabledScales, selectedValues, width, height, categoryDistribution, symptomDistribution, locationDistribution, traces, refreshTrigger]);

  // Function to update the backend filters
  const updateBackendFilter = async (attribute, values) => {
    const filterPath = `filters.technical_analysis.${attribute}`;
    try {
      if (values.length === 0) {
        await eel.set_filter_value(filterPath, [])(); // Set to empty if no value is selected
      } else {
        await eel.set_filter_value(filterPath, values)(); // Update the backend with the selected values
      }
      globalFilterTrigger();
      console.log(`Updated filter ${filterPath} to ${values.length === 0 ? 'None' : values}`);
    } catch (error) {
      console.error(`Failed to update filter for ${filterPath}:`, error);
    }
  };

  const toggleScale = scale => {
    // Prevent disabling the Category scale and remove it from the checkbox list
    if (scale !== 'category') {
      setEnabledScales({
        ...enabledScales,
        [scale]: !enabledScales[scale],
      });
    }
  };

  return (
    <div>
      <div className="controls" style={{ marginBottom: '5px' }}>
        {Object.keys(enabledScales).filter(scale => scale !== 'category').map(scale => (
          <label key={scale} style={{ color: 'white', marginRight: '10px' }}>
            <input
              type="checkbox"
              checked={enabledScales[scale]}
              onChange={() => toggleScale(scale)}
            />
            {scale.charAt(0).toUpperCase() + scale.slice(1)}
          </label>
        ))}
      </div>
      <svg ref={svgRef} style={{ width: '100%', height: height }} />
    </div>
  );
};

export default TechnicalAnalysis;
