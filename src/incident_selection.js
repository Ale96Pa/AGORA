import { eel } from './App';
import React, { useState, useEffect, useCallback } from 'react';
import './incident_selection.css';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import ProgressBar from 'react-bootstrap/ProgressBar';

const IncidentSelection = ({ onSelectionChange }) => {
    const [minDate, setMinDate] = useState('09/01/2017'); // Set initial minDate
    const [maxDate, setMaxDate] = useState('18/02/2017'); // Set initial maxDate
    const [startDate, setStartDate] = useState('09/01/2017'); // Set initial startDate
    const [endDate, setEndDate] = useState('18/02/2017'); // Set initial endDate
    const [incidentCount, setIncidentCount] = useState(null);
    const [totalIncidents, setTotalIncidents] = useState(null);

    const [editingStartDate, setEditingStartDate] = useState(false);
    const [editingEndDate, setEditingEndDate] = useState(false);

    const formatToDDMMYYYY = (dateStr) => {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    useEffect(() => {
        const fetchMinMaxDatesAndTotalIncidents = async () => {
            try {
                const [minDateFromBackend, maxDateFromBackend] = await eel.get_min_max_closed_date()();
                const formattedMinDate = formatToDDMMYYYY(minDateFromBackend);
                const formattedMaxDate = formatToDDMMYYYY(maxDateFromBackend);

                setMinDate(formattedMinDate); // Set fetched minDate from backend
                setMaxDate(formattedMaxDate); // Set fetched maxDate from backend

                const totalIncidentsFromBackend = await eel.count_unique_incidents()();
                setTotalIncidents(totalIncidentsFromBackend);

                // Fetch initial incident count for the specified date range
                const count = await eel.number_of_closed_incidents_in_time_period('09/01/2017', '18/02/2017')();
                setIncidentCount(count);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchMinMaxDatesAndTotalIncidents();
    }, []);

    // Debounced function to fetch incident count
    const debouncedFetchIncidentCount = useCallback(
        debounce(async (startDate, endDate) => {
            try {
                const count = await eel.number_of_closed_incidents_in_time_period(startDate, endDate)();
                setIncidentCount(count);
                onSelectionChange();  // Notify parent about the change
            } catch (error) {
                console.error('Error querying incidents:', error);
                setIncidentCount(null);
            }
        }, 500),
        []
    );

    useEffect(() => {
        if (startDate && endDate) {
            debouncedFetchIncidentCount(startDate, endDate);
        }
    }, [startDate, endDate, debouncedFetchIncidentCount]);

    const handleSliderChange = (value) => {
        const [newStartDate, newEndDate] = value.map(val => formatDateToString(new Date(val)));
        setStartDate(newStartDate);
        setEndDate(newEndDate);
    };

    const handleDateInputChange = (setDate, setEditing, value) => {
        setDate(value);
        setEditing(false);
        onSelectionChange(); // Notify parent about the change
    };

    const formatDateToTimestamp = (dateStr) => {
        const [day, month, year] = dateStr.split('/');
        return new Date(`${year}-${month}-${day}`).getTime();
    };

    const formatDateToString = (date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const progressBarValue = incidentCount && totalIncidents ? (incidentCount / totalIncidents) * 100 : 0;

    return (
        <div className="incident-query-container">
            <div className="date-range-container">
                <div className="name">TIME PERIOD</div>
                <Slider
                    range
                    min={formatDateToTimestamp(minDate)}
                    max={formatDateToTimestamp(maxDate)}
                    value={[formatDateToTimestamp(startDate), formatDateToTimestamp(endDate)]}
                    onChange={handleSliderChange}
                    className="date-range-slider"
                />
                <div className="date-range-labels">
                    {editingStartDate ? (
                        <input
                            type="text"
                            value={startDate}
                            onChange={e => handleDateInputChange(setStartDate, setEditingStartDate, e.target.value)}
                            onBlur={() => setEditingStartDate(false)}
                            onKeyDown={e => e.key === 'Enter' && handleDateInputChange(setStartDate, setEditingStartDate, startDate)}
                            className="date-input"
                        />
                    ) : (
                        <span onClick={() => setEditingStartDate(true)} className="date-label">{startDate}</span>
                    )}
                    {editingEndDate ? (
                        <input
                            type="text"
                            value={endDate}
                            onChange={e => handleDateInputChange(setEndDate, setEditingEndDate, e.target.value)}
                            onBlur={() => setEditingEndDate(false)}
                            onKeyDown={e => e.key === 'Enter' && handleDateInputChange(setEndDate, setEditingEndDate, endDate)}
                            className="date-input"
                        />
                    ) : (
                        <span onClick={() => setEditingEndDate(true)} className="date-label">{endDate}</span>
                    )}
                </div>
            </div>
            <div className="result-section">
                <div className="name">PERC SELECTED INCIDENTS</div>
                {incidentCount !== null && totalIncidents !== null && (
                    <ProgressBar  
                        className="progress-bar-full"
                        label={`${incidentCount} / ${totalIncidents} (${Math.round(progressBarValue)}%)`}
                        striped variant="info"
                        now={progressBarValue} // Still needed to render the progress visually
                    />
                )}
            </div>
        </div>
    );
};

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

export default IncidentSelection;
