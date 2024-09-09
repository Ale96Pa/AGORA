import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './IndividualAnalysis.css';

const IndividualAnalysis = ({ height }) => {
    // Example data for averages
    const averages = {
        timeToClose: '5 days',
        fitness: '0.85',
        ncc: '0.92',
    };

    // Color mapping for stages
    const stageColorMap = {
        DET: 'steelblue',  // Detection
        ACT: 'orange',     // Activation
        AW: 'green',       // Awaiting
        RES: 'red',        // Resolution
        CL: 'purple',      // Closure
    };

    // Example data for incidents with time spent in each stage (in hours)
    const incidents = [
        { id: 5, stages: ['DET', 'ACT', 'RES', 'CL'], durations: [5, 10, 20, 10] },
        { id: 9, stages: ['DET', 'ACT', 'RES', 'CL'], durations: [5, 8, 12, 15] },
        { id: 20, stages: ['DET', 'ACT'], durations: [6, 14] },
        { id: 28, stages: ['DET', 'ACT'], durations: [5, 9] },
    ];

    // Calculate the total duration for the X axis
    const totalDuration = Math.max(...incidents.map(incident => incident.durations.reduce((a, b) => a + b, 0)));

    const svgRef = useRef();

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();  // Clear previous content

        const width = 800;  // Total width for the graph
        const height = incidents.length * 40; // Height based on number of incidents
        const margin = { top: 30, right: 30, bottom: 30, left: 40 };

        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Create a linear scale based on total duration (time in hours)
        const xScale = d3.scaleLinear()
            .domain([0, totalDuration])
            .range([0, innerWidth]);

        // Y-axis based on incident ids
        const yScale = d3.scaleBand()
            .domain(incidents.map(incident => incident.id))
            .range([0, innerHeight])
            .padding(0.2);

        // Create an x-axis generator for time
        const xAxis = d3.axisTop(xScale).ticks(10).tickFormat(d => `${d}h`);

        // Create a y-axis generator for incident IDs
        const yAxis = d3.axisLeft(yScale);

        // Append the x-axis to the svg
        svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(${margin.left},${margin.top})`)
            .call(xAxis)
            .selectAll('text')
            .style('fill', 'white');  // White text for visibility on dark backgrounds

        // Append the y-axis to the svg
        svg.append('g')
            .attr('class', 'y-axis')
            .attr('transform', `translate(${margin.left},${margin.top})`)
            .call(yAxis)
            .selectAll('text')
            .style('fill', 'white');  // White text for visibility on dark backgrounds

        // Draw the stages as horizontal bars
        incidents.forEach((incident, index) => {
            let cumulativeDuration = 0;
            incident.stages.forEach((stage, stageIndex) => {
                const stageDuration = incident.durations[stageIndex];
                svg.append('rect')
                    .attr('x', margin.left + xScale(cumulativeDuration))  // Start of the bar based on cumulative duration
                    .attr('y', margin.top + yScale(incident.id))  // Position based on incident id
                    .attr('width', xScale(stageDuration))  // Width of the bar proportional to the duration
                    .attr('height', yScale.bandwidth())  // Bar height based on yScale bandwidth
                    .attr('fill', stageColorMap[stage]);  // Color based on the stage
                cumulativeDuration += stageDuration;  // Update cumulative duration for next stage
            });
        });
    }, [totalDuration, incidents]);

    return (
        <div className="individual-analysis" style={{ height }}>
            <div className="averages-section">
                <div className="average-item">
                    <span>Time to Close: </span>{averages.timeToClose}
                </div>
                <div className="average-item">
                    <span>Fitness: </span>{averages.fitness}
                </div>
                <div className="average-item">
                    <span>NCC: </span>{averages.ncc}
                </div>
            </div>

            <div className="details-section">
                <svg ref={svgRef} className="incident-sequence-svg" width="100%" height={incidents.length * 50 + 50} />
            </div>
        </div>
    );
};

export default IndividualAnalysis;
