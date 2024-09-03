import './progress_bar.css';
import * as d3 from 'd3';
import { eel } from './App';
import tabular from './tabular.js';  // Import tabular function

async function createProgressBar(containerId, metricName, limits = [0, 1], severityLevels = [0, 0.25, 0.5, 0.75, 1], height = 30) {
    
    const progress = await eel.calculate_column_average(metricName)();
    const [min, max] = limits;
    const scaledProgress = ((progress - min) / (max - min)) * 100;
    const roundedProgress = progress.toFixed(3);

    const container = d3.select(`#${containerId}`);
    const width = container.node().getBoundingClientRect().width;
    container.selectAll('*').remove();

    // Add metric name above the progress bar
    container.append('div')
        .attr('class', 'metric-name')
        .text(metricName)
        .style('text-align', 'center')
        .style('color', 'white')
        .style('margin-bottom', '5px');

    const svg = container.append('svg')
        .attr('width', '100%')
        .attr('height', height);

    const severityColors = ['#D5E8D4', '#FFF2CC', '#F8CECC', '#E1D5E7'];

    // Create background rectangles for severity levels and add click event
    severityLevels.forEach((level, index) => {
        if (index < severityLevels.length - 1) {
            const rect = svg.append('rect')
                .attr('x', (width * (severityLevels[index] - min)) / (max - min))
                .attr('y', 0)
                .attr('width', (width * (severityLevels[index + 1] - severityLevels[index])) / (max - min))
                .attr('height', height)
                .attr('fill', severityColors[index])
                .attr('stroke', 'none')
                .on('click', async function () {
                    const isSelected = d3.select(this).attr('stroke') === '#007FFF';
                    d3.select(this).attr('stroke', isSelected ? 'none' : '#007FFF').attr('stroke-width', isSelected ? '0' : '3');
                    
                    const rangeStart = severityLevels[index];
                    const rangeEnd = severityLevels[index + 1];
                    const range = `${rangeStart} to ${rangeEnd}`;

                    await eel.set_filter_compliance_metric_thresholds(metricName, rangeStart, rangeEnd)();
                    
                    tabular('table-container');
                });
        }
    });

    // Add dotted line for average value
    svg.append('line')
        .attr('x1', (width * scaledProgress) / 100)
        .attr('y1', 0)
        .attr('x2', (width * scaledProgress) / 100)
        .attr('y2', height)
        .attr('stroke', '#000')
        .attr('stroke-dasharray', '2,2')  // More dashes
        .attr('stroke-width', '2');

    // Add text label for average value below the line
    svg.append('text')
        .attr('x', (width * scaledProgress) / 100 + 20)
        .attr('y', height / 2)  // Position below the progress bar
        .attr('dy', '.35em')
        .attr('text-anchor', 'middle')
        .attr('fill', '#000')
        .text(`${roundedProgress}`)
        .style('font-size', '14px');
}

export default createProgressBar;
