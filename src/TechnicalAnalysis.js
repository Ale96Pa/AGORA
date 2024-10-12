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
        const result = await eel.get_incident_technical_attributes()();
        const incidentData = JSON.parse(result);
        setTraces(incidentData);

        // Build the category, symptom, and location distributions
        const categoryCountMap = {};
        const symptomCountMap = {};
        const locationCountMap = {};

        incidentData.forEach(trace => {
          // Category Distribution
          const category = trace.category;
          if (categoryCountMap[category]) {
            categoryCountMap[category] += 1;
          } else {
            categoryCountMap[category] = 1;
          }

          // Symptom Distribution
          const symptom = trace.symptom;
          if (symptom !== null) {
            if (symptomCountMap[symptom]) {
              symptomCountMap[symptom] += 1;
            } else {
              symptomCountMap[symptom] = 1;
            }
          }

          // Location Distribution
          const location = trace.location;
          if (location !== null) {
            if (locationCountMap[location]) {
              locationCountMap[location] += 1;
            } else {
              locationCountMap[location] = 1;
            }
          }
        });

        const categoryDistributionData = Object.keys(categoryCountMap).map(category => ({
          category: parseInt(category, 10),
          count: categoryCountMap[category],
        }));

        const symptomDistributionData = Object.keys(symptomCountMap).map(symptom => ({
          symptom: parseInt(symptom, 10),
          count: symptomCountMap[symptom],
        }));

        const locationDistributionData = Object.keys(locationCountMap).map(location => ({
          location: parseInt(location, 10),
          count: locationCountMap[location],
        }));

        // Sort distributions by count in descending order
        setCategoryDistribution(categoryDistributionData.sort((a, b) => b.count - a.count));
        setSymptomDistribution(symptomDistributionData.sort((a, b) => b.count - a.count));
        setLocationDistribution(locationDistributionData.sort((a, b) => b.count - a.count));
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

    const margin = { top: 40, right: 20, bottom: 20, left: 40 };
    const innerWidth = containerWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const scales = {
      symptom: symptomDistribution.map(d => d.symptom),
      impact: d3.range(1, 5),
      urgency: d3.range(1, 5),
      priority: d3.range(1, 5),
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
      const xPosition = index * scaleWidth + scaleWidth / 2;
      const scaleGroup = g.append('g')
        .attr('transform', `translate(${xPosition}, 0)`);

      const yScale = d3.scaleLinear()
        .domain([1, d3.max(scales[scale])])
        .range([innerHeight, 0]);

      yScales[scale] = yScale;

      const yAxis = d3.axisLeft(yScale)
        .ticks(scales[scale].length)
        .tickFormat(d3.format('d'));

      const axisGroup = scaleGroup.append('g')
        .call(yAxis)
        .attr('class', `${scale}-axis`);

      axisGroup.selectAll('text')
        .attr('fill', d => (selectedValues[scale].includes(d) ? 'red' : 'white')) // Highlight selected value in red
        .style('cursor', 'pointer')
        .on('click', async function (event, d) {
          // Update selected values in the state
          setSelectedValues(prev => {
            const newSelectedValues = { ...prev };
            const selectedForScale = newSelectedValues[scale];
            
            if (selectedForScale.includes(d)) {
              newSelectedValues[scale] = selectedForScale.filter(value => value !== d);
            } else {
              newSelectedValues[scale] = [...selectedForScale, d];
            }
            // Update the backend with the new selected values
            updateBackendFilter(scale, newSelectedValues[scale]);
            return newSelectedValues;
          });
        });

      scaleGroup.append('text')
        .attr('x', 0)
        .attr('y', -20)
        .attr('text-anchor', 'middle')
        .attr('fill', selectedValues[scale].length > 0 ? 'red' : 'white')
        .style('font-size', '12px')
        .text(scale.charAt(0).toUpperCase() + scale.slice(1));
    });

    // Function to determine the color of the trace based on selected values
    const getTraceColor = (trace) => {
      const hasSelectedValues = Object.values(selectedValues).some(values => values.length > 0);
      if (hasSelectedValues) {
        return enabledKeys.every(key =>
          selectedValues[key].length === 0 || selectedValues[key].includes(trace[key])
        ) ? 'red' : 'white';
      }
      return 'white';
    };

    // Draw traces (white first, then red on top)
    traces.forEach((sampleData, traceIndex) => {
      const trace = enabledKeys.map((key, index) => ({
        x: index * scaleWidth + scaleWidth / 2,
        y: key === 'category' ? yScales[key](sampleData[key]) : yScales[key](sampleData[key]),
      }));

      const traceColor = getTraceColor(sampleData);

      if (traceColor === 'white') {
        trace.forEach((point, index) => {
          if (index < trace.length - 1) {
            const nextPoint = trace[index + 1];
            g.append('line')
              .attr('x1', point.x)
              .attr('y1', point.y)
              .attr('x2', nextPoint.x)
              .attr('y2', nextPoint.y)
              .attr('stroke', traceColor)
              .attr('stroke-width', 1)
              .attr('opacity', 0.5);
          }
        });
      }
    });

    traces.forEach((sampleData, traceIndex) => {
      const trace = enabledKeys.map((key, index) => ({
        x: index * scaleWidth + scaleWidth / 2,
        y: key === 'category' ? yScales[key](sampleData[key]) : yScales[key](sampleData[key]),
      }));

      const traceColor = getTraceColor(sampleData);

      if (traceColor === 'red') {
        trace.forEach((point, index) => {
          if (index < trace.length - 1) {
            const nextPoint = trace[index + 1];
            g.append('line')
              .attr('x1', point.x)
              .attr('y1', point.y)
              .attr('x2', nextPoint.x)
              .attr('y2', nextPoint.y)
              .attr('stroke', traceColor)
              .attr('stroke-width', 1)
              .attr('opacity', 0.5);
          }
        });
      }
    });

    // Draw histogram for the Category distribution
    const histogramXPosition = enabledKeys.length * scaleWidth + scaleWidth / 2;
    const xHistogramScale = d3.scaleLinear()
      .domain([0, d3.max(categoryDistribution, d => d.count)])
      .range([0, scaleWidth]);

    const yHistogramScale = d3.scaleBand()
      .domain(categoryDistribution.map(d => d.category))
      .range([0, innerHeight])
      .padding(0.1);

    const histogramGroup = g.append('g')
      .attr('transform', `translate(${histogramXPosition - scaleWidth / 2}, 0)`);

    histogramGroup.selectAll('.bar')
      .data(categoryDistribution.filter(d => d.count > 0))
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', d => yHistogramScale(d.category))
      .attr('width', d => xHistogramScale(d.count))
      .attr('height', yHistogramScale.bandwidth())
      .attr('fill', 'steelblue');

    g.select(`.${enabledKeys[enabledKeys.length - 1]}-axis`).call(d3.axisLeft(yHistogramScale))
      .selectAll('text')
      .attr('fill', 'white');

    histogramGroup.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xHistogramScale).ticks(5))
      .selectAll('text')
      .attr('fill', 'white');
  }, [enabledScales, selectedValues, width, height, categoryDistribution, symptomDistribution, locationDistribution, traces, refreshTrigger]);

  // Function to update the backend filters
  const updateBackendFilter = async (attribute, values) => {
    const filterPath = `filters.technical_analysis.${attribute}`;
    try {
      if (values.length === 0) {
        await eel.set_filter_value(filterPath, [])();
      } else {
        await eel.set_filter_value(filterPath, values)();
      }
      globalFilterTrigger();
    } catch (error) {
      console.error(`Failed to update filter for ${filterPath}:`, error);
    }
  };

  const toggleScale = scale => {
    if (scale !== 'category') {
      setEnabledScales({
        ...enabledScales,
        [scale]: !enabledScales[scale],
      });
    }
  };

  return (
    <div>
      <div className="controls" style={{ marginBottom: '20px' }}>
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
