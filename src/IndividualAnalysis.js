import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import Collapsible from 'react-collapsible';
import { eel } from './App';  // Import eel to fetch data from the backend
import './IndividualAnalysis.css';

const IndividualAnalysis = ({ height, selectionTrigger, updateAssessmentsResultsTrigger, updateProgress }) => {
    const [complianceMetric, setComplianceMetric] = useState('');  // Store compliance metric from the backend
    const [individualMetricAverages, setIndividualMetricAverages] = useState({
        average_ttr: '',
        sla_percentage: '',
        average_compliance_metric: '',
    }); // Store fetched averages from the backend
    const [incidentData, setIncidentData] = useState([]);  // Store incident data
    const [graphHeight, setGraphHeight] = useState(0);  // State to store graphHeight

    const [name, setName] = useState('');  // For storing input name
    const [type, setType] = useState('finding');  // For storing selected type
    const [securityControls, setSecurityControls] = useState([]);  // Store fetched security controls
    const [selectedControl, setSelectedControl] = useState('');  // For storing selected control
    const [status, setStatus] = useState('');  // For storing selected status
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

    // Fetch security controls on component mount
    useEffect(() => {
        const fetchControls = async () => {
            try {
                const result = await eel.fetch_all_security_controls()();  // Fetch security controls
                setSecurityControls(JSON.parse(result));  // Parse the result and set the state
            } catch (error) {
                console.error('Failed to fetch security controls:', error);
            }
        };

        fetchControls();  // Only run once when component mounts
    }, []);

    // Fetch selected incidents whenever `selectionTrigger` changes
    useEffect(() => {
        const fetchSelectedIncidents = async () => {
            try {
                const result = await eel.calculate_individual_averages()();  // Fetch selected incidents from backend
                setIndividualMetricAverages(result);
    
                const incidentDetails = await eel.get_incident_event_intervals()();  // Fetch event intervals
                console.log('incidentDetails:', incidentDetails);  // Add this log for debugging
    
                // Check if incidentDetails is an array before calling .map()
                if (Array.isArray(incidentDetails)) {
                    const parsedData = incidentDetails.map(item => ({
                        ...item,
                        event_intervals: JSON.parse(item.event_interval_minutes),  // Parse event intervals JSON
                    }));
                    setIncidentData(parsedData);
                } else {
                    console.log('incidentDetails is not an array:', incidentDetails);
                }
            } catch (error) {
                console.error('Failed to fetch selected incidents:', error);
            }
        };
    
        fetchSelectedIncidents();
    }, [selectionTrigger]);
    

    // Handle form submission
    const handleSubmit = async () => {
        if (!name || !selectedControl || !status) {
            alert('Please provide a name, select a security control, and choose a status.');
            return;
        }

        const incidentIdsList = incidentData.map(incident => incident.incident_id).join(',');
        try {
            // Call the Python function to insert the result
            await eel.insert_assessment_result(name, type, incidentIdsList, selectedControl, status)();  // Pass control ID and status
            updateAssessmentsResultsTrigger();
            updateProgress();
            alert('Assessment result successfully inserted and status updated!');
        } catch (error) {
            console.error('Failed to insert assessment result:', error);
            alert('Failed to insert assessment result');
        }
    };

    // Create the D3 chart
    useEffect(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();  // Clear previous content

        const margin = { top: 30, right: 30, bottom: 10, left: 65 };
        const fixedBarHeight = 30;  // Fixed height for each incident row
        const width = 800;  // Total width for the graph
        const innerWidth = width - margin.left - margin.right;

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
            .range([0, incidentData.length * fixedBarHeight])
            .paddingInner(0.1)
            .paddingOuter(0);

        // Calculate the graph height and set it in state
        const calculatedGraphHeight = yScale.range()[1] + margin.top + margin.bottom;
        setGraphHeight(calculatedGraphHeight);

        // Create an x-axis generator for time in days
        const xAxis = d3.axisTop(xScale).ticks(10).tickFormat(d => {
            const days = d / (60 * 24);  // Convert minutes to days
            return `${days.toFixed(1)} d`;
        });

        // Create a y-axis generator for incident IDs
        const yAxis = d3.axisLeft(yScale);

        // Append the x-axis to the svg
        svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(${margin.left},${margin.top})`)
            .call(xAxis)
            .selectAll('text')
            .style('fill', 'white');  // White text for visibility on dark backgrounds

        // Apply stroke styling directly to x-axis path
        svg.select('.x-axis').select('path')
            .attr('stroke', 'white');

        // Append the y-axis to the svg
        svg.append('g')
            .attr('class', 'y-axis')
            .attr('transform', `translate(${margin.left},${margin.top})`)
            .call(yAxis)
            .selectAll('text')
            .style('fill', 'white');  // White text for visibility on dark backgrounds

        // Apply stroke styling directly to y-axis path
        svg.select('.y-axis').select('path')
            .attr('stroke', 'white');

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
                        {individualMetricAverages.sla_percentage ? individualMetricAverages.sla_percentage : ''}
                    </div>
                </div>
            </div>

            {/* Scrollable Incident Details Section */}
            <div className="details-section-scrollable">
                {graphHeight > 0 && (
                    <svg ref={svgRef} className="incident-sequence-svg" width="800%" height={graphHeight} />
                )}
            </div>

            <Collapsible
                trigger={[
                    <div className="name" key="name">Collect Tag</div>,
                    <img
                        key="img"
                        loading="lazy"
                        src="https://cdn.builder.io/api/v1/image/assets/TEMP/c9992667147f295b32eec0696cb0fef65388fa9af146ce7034e2a192b713c079?"
                        className="img-30"
                        alt="Toggle"
                    />
                ]}>
                {/* Form Section for name, type, security control, and status */}
                <div className="form-section-row">
                    <input
                        type="text"
                        placeholder="Enter tag name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="form-input"
                    />
                </div>
                <div className="form-section-row">
                    <select value={selectedControl} onChange={(e) => setSelectedControl(e.target.value)} className="form-select">
                        <option value="" disabled>Select a Security Control</option>
                        {securityControls.map((control) => (
                            <option key={control.id} value={control.id}>
                                {control.title}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Type Dropdown */}
                <div className="form-section-row">
                    <select value={type} onChange={(e) => setType(e.target.value)} className="form-select">
                        <option value="finding">Finding</option>
                        <option value="area of concern">Area of Concern</option>
                        <option value="non-conformity">Non-Conformity</option>
                    </select>
                </div>

                {/* Status Dropdown */}
                <div className="form-section-row">
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-select">
                        <option value="" disabled>Select Status</option>
                        <option value="covered">Covered</option>
                        <option value="partially covered">Partially Covered</option>
                        <option value="not covered">Not Covered</option>
                    </select>
                    <button onClick={handleSubmit} className="form-button">Submit</button>
                </div>
            </Collapsible>
        </div>
    );
};

export default IndividualAnalysis;
