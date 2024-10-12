import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { eel } from './App';  // Import eel to fetch data from the backend
import './IndividualAnalysis.css';

const IndividualAnalysis = ({ height, selectionTrigger, updateAssessmentsResultsTrigger }) => {
    const [complianceMetric, setComplianceMetric] = useState('');  // Store compliance metric from the backend
    const [individualMetricAverages, setIndividualMetricAverages] = useState({
        average_ttr: '',
        sla_percentage: '',
        average_compliance_metric: '',
    }); // Store fetched averages from the backend
    const [incidentData, setIncidentData] = useState([]);  // Store incident data

    const [name, setName] = useState('');  // For storing input name
    const [type, setType] = useState('finding');  // For storing selected type
    const svgRef = useRef();

    // Fetch compliance metric from backend once on mount
    useEffect(() => {
        const fetchComplianceMetric = async () => {
            try {
                const metric = await eel.get_incident_compliance_metric()();  // Get compliance metric from backend
                setComplianceMetric(metric);
            } catch (error) {
                console.error('Failed to fetch compliance metric:', error);
            }
        };

        fetchComplianceMetric();  // Only run on mount
    }, []);  // Empty dependency array to only fetch once on mount

    // Fetch selected incidents whenever `selectionTrigger` changes
    useEffect(() => {
        const fetchSelectedIncidents = async () => {
            try {
                const result = await eel.calculate_individual_averages()();  // Fetch selected incidents from backend
                setIndividualMetricAverages(result);

                const incidentDetails = await eel.get_incident_event_intervals()();  // Fetch event intervals
                const parsedData = incidentDetails.map(item => ({
                    ...item,
                    event_intervals: JSON.parse(item.event_interval_minutes),  // Parse event intervals JSON
                }));
                setIncidentData(parsedData);
            } catch (error) {
                console.error('Failed to fetch selected incidents:', error);
            }
        };

        fetchSelectedIncidents();  // Run when `selectionTrigger` changes
    }, [selectionTrigger]);  // Only run when `selectionTrigger` changes

    // Handle form submission
    const handleSubmit = async () => {
        const incidentIdsList = incidentData.map(incident => incident.incident_id).join(',');
        try {
            // Call the Python function to insert the result
            await eel.insert_assessment_result(name, type, incidentIdsList)();
            updateAssessmentsResultsTrigger();
            alert('Assessment result successfully inserted!');
        } catch (error) {
            console.error('Failed to insert assessment result:', error);
            alert('Failed to insert assessment result');
        }
    };

    // Create the D3 chart
    useEffect(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();  // Clear previous content

        const width = 800;  // Total width for the graph
        const rowHeight = 40;  // Fixed height for each incident row
        const numRows = Math.max(incidentData.length, 5);  // Ensure at least 5 rows are displayed even if fewer incidents
        const graphHeight = numRows * rowHeight; // Height based on number of incidents or fixed number of rows
        const margin = { top: 30, right: 30, bottom: 10, left: 60 };

        const innerWidth = width - margin.left - margin.right;
        const innerHeight = graphHeight - margin.top - margin.bottom;

        // Calculate total duration for each incident (sum of event intervals)
        const calculateTotalDuration = (eventIntervals) =>
            Object.values(eventIntervals).reduce((total, duration) => total + duration, 0);

        const maxDuration = Math.max(
            ...incidentData.map(incident => calculateTotalDuration(incident.event_intervals))
        );

        // Create a linear scale based on total duration (time in minutes)
        const xScale = d3.scaleLinear()
            .domain([0, maxDuration])
            .range([0, innerWidth]);

        // Y-axis based on incident ids
        const yScale = d3.scaleBand()
            .domain(incidentData.map(incident => incident.incident_id))
            .range([0, innerHeight])
            .padding(0.2);

        // Create an x-axis generator for time
        const xAxis = d3.axisTop(xScale).ticks(10).tickFormat(d => `${d} min`);

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
            
        // Draw the event intervals as horizontal bars
        incidentData.forEach((incident) => {
            let cumulativeDuration = 0;
            Object.entries(incident.event_intervals).forEach(([eventCode, duration]) => {
                svg.append('rect')
                    .attr('x', margin.left + xScale(cumulativeDuration))  // Start of the bar based on cumulative duration
                    .attr('y', margin.top + yScale(incident.incident_id))  // Position based on incident id
                    .attr('width', xScale(duration))  // Width of the bar proportional to the duration
                    .attr('height', yScale.bandwidth())  // Bar height based on yScale bandwidth
                    .attr('fill', getColorForEvent(eventCode));  // Color based on the event code
                cumulativeDuration += duration;  // Update cumulative duration for next event
            });
        });
    }, [incidentData]);  // Re-run effect when incidentData changes

    // Helper function to get color for each event code, including W
    const getColorForEvent = (eventCode) => {
        const eventColorMap = {
            N: 'steelblue',  // Event N
            A: 'orange',     // Event A
            R: 'red',        // Event R
            C: 'purple',     // Event C
            W: 'green'       // Event W
        };
        return eventColorMap[eventCode] || 'gray';  // Fallback to gray if event code is not found
    };

    return (
         <div className="individual-analysis" style={{ height }}>
            {/* Form Section for name and type */}
            <div className="form-section-row">
                <input
                    type="text"
                    placeholder="Enter name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                />
            </div>
            <div className="form-section-row">
                <select value={type} onChange={(e) => setType(e.target.value)} className="form-select">
                    <option value="finding">Finding</option>
                    <option value="area of concern">Area of Concern</option>
                    <option value="non-conformaty">Non-Conformaty</option>
                </select>
                <button onClick={handleSubmit} className="form-button">Submit</button>
            </div>

            {/* Averages Section */}
            <div className="averages-section">
                <div className="average-item">
                    <div className="average-item-label">AVG TTR</div>
                    <div className="average-item-value">{individualMetricAverages.average_ttr}</div>
                </div>
                <div className="average-item">
                    <div className="average-item-label">AVG {complianceMetric.toUpperCase()}</div>
                    <div className="average-item-value">
                        {individualMetricAverages.average_compliance_metric ? individualMetricAverages.average_compliance_metric.toFixed(2) : ''}
                    </div>
                </div>
                <div className="average-item">
                    <div className="average-item-label">PERC SLA MET</div>
                    <div className="average-item-value">
                        {individualMetricAverages.sla_percentage ? individualMetricAverages.sla_percentage : ''} %
                    </div>
                </div>
            </div>

            {/* Scrollable Incident Details Section */}
            <div className="details-section-scrollable" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '400px' }}>
                <svg ref={svgRef} className="incident-sequence-svg" width="100%" height={incidentData.length * 50 + 50} />
            </div>
        </div>
    );
};

export default IndividualAnalysis;
