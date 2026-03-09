// Store original data from database (will be populated on load)
let originalData = {
    startup_time: [],
    cpu_usage: [],
    memory_usage: []
};

// Chart instances
let startupChart, cpuChart, memoryChart;

// Fetch initial data from backend
fetch('/api/data')
    .then(response => response.json())
    .then(data => {
        // Store original data
        originalData = data;
        // Set input fields to original values
        setInputsFromData(data);
        // Create charts with original data
        createCharts(data);
        // Update difference text
        updateDifferenceText(data);
    })
    .catch(err => console.error('Error fetching data:', err));

// Helper to set input fields
function setInputsFromData(data) {
    if (data.startup_time) {
        document.getElementById('startup-vm').value = data.startup_time.find(d => d.technique === 'VM')?.value || 45.2;
        document.getElementById('startup-container').value = data.startup_time.find(d => d.technique === 'Container')?.value || 2.1;
    }
    if (data.cpu_usage) {
        document.getElementById('cpu-vm').value = data.cpu_usage.find(d => d.technique === 'VM')?.value || 12.5;
        document.getElementById('cpu-container').value = data.cpu_usage.find(d => d.technique === 'Container')?.value || 5.3;
    }
    if (data.memory_usage) {
        document.getElementById('memory-vm').value = data.memory_usage.find(d => d.technique === 'VM')?.value || 1024;
        document.getElementById('memory-container').value = data.memory_usage.find(d => d.technique === 'Container')?.value || 256;
    }
}

// Create charts (or update if they exist)
function createCharts(data) {
    const startupCtx = document.getElementById('startupChart').getContext('2d');
    const cpuCtx = document.getElementById('cpuChart').getContext('2d');
    const memCtx = document.getElementById('memoryChart').getContext('2d');

    // Destroy existing charts if they exist (to avoid overlap)
    if (startupChart) startupChart.destroy();
    if (cpuChart) cpuChart.destroy();
    if (memoryChart) memoryChart.destroy();

    // Startup Time Chart
    startupChart = new Chart(startupCtx, {
        type: 'bar',
        data: {
            labels: data.startup_time.map(item => item.technique),
            datasets: [{
                label: `Startup Time (${data.startup_time[0].unit})`,
                data: data.startup_time.map(item => item.value),
                backgroundColor: ['#8a2be2', '#ff69b4'],
                borderColor: '#ffffff',
                borderWidth: 1,
                borderRadius: 10,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#ffb6c1' } }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#8a2be240' }, ticks: { color: '#e0e0e0' } },
                x: { ticks: { color: '#e0e0e0' } }
            }
        }
    });

    // CPU Usage Chart
    cpuChart = new Chart(cpuCtx, {
        type: 'bar',
        data: {
            labels: data.cpu_usage.map(item => item.technique),
            datasets: [{
                label: `CPU Usage (${data.cpu_usage[0].unit})`,
                data: data.cpu_usage.map(item => item.value),
                backgroundColor: ['#8a2be2', '#ff69b4'],
                borderColor: '#ffffff',
                borderWidth: 1,
                borderRadius: 10,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#ffb6c1' } }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#8a2be240' }, ticks: { color: '#e0e0e0' } },
                x: { ticks: { color: '#e0e0e0' } }
            }
        }
    });

    // Memory Usage Chart
    memoryChart = new Chart(memCtx, {
        type: 'bar',
        data: {
            labels: data.memory_usage.map(item => item.technique),
            datasets: [{
                label: `Memory Usage (${data.memory_usage[0].unit})`,
                data: data.memory_usage.map(item => item.value),
                backgroundColor: ['#8a2be2', '#ff69b4'],
                borderColor: '#ffffff',
                borderWidth: 1,
                borderRadius: 10,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#ffb6c1' } }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#8a2be240' }, ticks: { color: '#e0e0e0' } },
                x: { ticks: { color: '#e0e0e0' } }
            }
        }
    });
}

// Update difference text
function updateDifferenceText(data) {
    // Startup time difference
    const startupVM = data.startup_time.find(d => d.technique === 'VM').value;
    const startupContainer = data.startup_time.find(d => d.technique === 'Container').value;
    const startupDiff = ((startupVM - startupContainer) / startupVM * 100).toFixed(1);
    document.getElementById('diff-startup').innerHTML = `
        <strong>Startup Time:</strong> Container is <span class="highlight">${startupDiff}% faster</span> than VM
    `;

    // CPU usage difference
    const cpuVM = data.cpu_usage.find(d => d.technique === 'VM').value;
    const cpuContainer = data.cpu_usage.find(d => d.technique === 'Container').value;
    const cpuDiff = ((cpuVM - cpuContainer) / cpuVM * 100).toFixed(1);
    document.getElementById('diff-cpu').innerHTML = `
        <strong>CPU Usage:</strong> Container uses <span class="highlight">${cpuDiff}% less CPU</span> than VM
    `;

    // Memory usage difference
    const memVM = data.memory_usage.find(d => d.technique === 'VM').value;
    const memContainer = data.memory_usage.find(d => d.technique === 'Container').value;
    const memDiff = ((memVM - memContainer) / memVM * 100).toFixed(1);
    document.getElementById('diff-memory').innerHTML = `
        <strong>Memory Usage:</strong> Container uses <span class="highlight">${memDiff}% less memory</span> than VM
    `;
}

// Handle update button click
document.getElementById('update-charts').addEventListener('click', () => {
    // Get values from inputs
    const startupVM = parseFloat(document.getElementById('startup-vm').value);
    const startupContainer = parseFloat(document.getElementById('startup-container').value);
    const cpuVM = parseFloat(document.getElementById('cpu-vm').value);
    const cpuContainer = parseFloat(document.getElementById('cpu-container').value);
    const memVM = parseFloat(document.getElementById('memory-vm').value);
    const memContainer = parseFloat(document.getElementById('memory-container').value);

    // Create new data object
    const newData = {
        startup_time: [
            { technique: 'VM', value: startupVM, unit: 'seconds' },
            { technique: 'Container', value: startupContainer, unit: 'seconds' }
        ],
        cpu_usage: [
            { technique: 'VM', value: cpuVM, unit: '%' },
            { technique: 'Container', value: cpuContainer, unit: '%' }
        ],
        memory_usage: [
            { technique: 'VM', value: memVM, unit: 'MB' },
            { technique: 'Container', value: memContainer, unit: 'MB' }
        ]
    };

    // Update charts
    createCharts(newData);
    // Update difference text
    updateDifferenceText(newData);
});

// Handle reset button click
document.getElementById('reset-charts').addEventListener('click', () => {
    // Reset inputs to original data
    setInputsFromData(originalData);
    // Update charts with original data
    createCharts(originalData);
    // Update difference text
    updateDifferenceText(originalData);
});

// Export functions
document.getElementById('export-png').addEventListener('click', async () => {
    const charts = ['startupChart', 'cpuChart', 'memoryChart'];
    const filenames = ['startup.png', 'cpu.png', 'memory.png'];
    
    const zip = new JSZip();
    let missing = false;
    
    for (let i = 0; i < charts.length; i++) {
        const canvas = document.getElementById(charts[i]);
        if (!canvas) {
            console.error(`Canvas #${charts[i]} not found`);
            missing = true;
            continue;
        }
        // Convert canvas to PNG data URL, then extract base64
        const dataURL = canvas.toDataURL('image/png');
        const base64Data = dataURL.split(',')[1]; // remove data:image/png;base64,
        zip.file(filenames[i], base64Data, { base64: true });
    }
    
    if (missing) {
        alert('Some charts could not be found. Please refresh and try again.');
        return;
    }
    
    // Generate the zip file and trigger download
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'cloudperf-charts.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
});
document.getElementById('export-pdf').addEventListener('click', async () => {
    try {
        // Check if jsPDF is loaded
        if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
            alert('PDF library not loaded yet. Please try again in a moment.');
            return;
        }

        // Get the jsPDF constructor - handle both UMD and global
        let jsPDFConstructor;
        if (window.jspdf && window.jspdf.jsPDF) {
            jsPDFConstructor = window.jspdf.jsPDF; // UMD
        } else if (window.jsPDF) {
            jsPDFConstructor = window.jsPDF; // global
        } else {
            throw new Error('jsPDF not available');
        }

        const pdf = new jsPDFConstructor();
        let yOffset = 10;

        const charts = ['startupChart', 'cpuChart', 'memoryChart'];
        const titles = ['Startup Time', 'CPU Usage', 'Memory Usage'];

        // Convert canvases to data URLs (synchronous)
        const images = charts.map(id => {
            const canvas = document.getElementById(id);
            if (!canvas) throw new Error(`Canvas ${id} not found`);
            return canvas.toDataURL('image/png');
        });

        // Add to PDF
        images.forEach((imgData, index) => {
            if (index > 0) pdf.addPage();
            pdf.setFontSize(16);
            pdf.setTextColor(255, 182, 193); // light pink to match theme
            pdf.text(titles[index], 10, yOffset);
            pdf.addImage(imgData, 'PNG', 10, yOffset + 10, 180, 100);
        });

        pdf.save('performance-charts.pdf');
    } catch (error) {
        console.error('PDF generation failed:', error);
        alert('Failed to generate PDF. Check console for details.');
    }
});

// Save comparison (if logged in)
const saveBtn = document.getElementById('save-results');
if (saveBtn) {
    saveBtn.addEventListener('click', () => {
        const name = prompt('Enter a name for this comparison:', 'My Comparison');
        if (!name) return;

        const vals = {
            startup_vm: parseFloat(document.getElementById('startup-vm').value),
            startup_container: parseFloat(document.getElementById('startup-container').value),
            cpu_vm: parseFloat(document.getElementById('cpu-vm').value),
            cpu_container: parseFloat(document.getElementById('cpu-container').value),
            memory_vm: parseFloat(document.getElementById('memory-vm').value),
            memory_container: parseFloat(document.getElementById('memory-container').value)
        };

        fetch('/api/save_comparison', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, ...vals })
        })
        .then(res => res.json())
        .then(data => alert('Comparison saved!'))
        .catch(err => alert('Error saving.'));
    });
}