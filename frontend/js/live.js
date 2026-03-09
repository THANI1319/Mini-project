console.log("live.js loaded");

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM ready");

    const editor = document.getElementById('editor');
    const runBtn = document.getElementById('run-code');
    const clearBtn = document.getElementById('clear-output');
    const outputDiv = document.getElementById('output');
    const startupCard = document.getElementById('live-startup');
    const cpuCard = document.getElementById('live-cpu');
    const memoryCard = document.getElementById('live-memory');

    if (!editor) console.error("Editor not found");
    if (!runBtn) console.error("Run button not found");
    if (!clearBtn) console.error("Clear button not found");
    if (!outputDiv) console.error("Output div not found");

    // Chart instances
    let startupChart, cpuChart, memoryChart;

    function createChart(canvasId, label, vmValue, containerValue, unit) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        if (canvasId === 'liveStartupChart' && startupChart) startupChart.destroy();
        if (canvasId === 'liveCpuChart' && cpuChart) cpuChart.destroy();
        if (canvasId === 'liveMemoryChart' && memoryChart) memoryChart.destroy();

        const newChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['VM', 'Container'],
                datasets: [{
                    label: `${label} (${unit})`,
                    data: [vmValue, containerValue],
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

        if (canvasId === 'liveStartupChart') startupChart = newChart;
        if (canvasId === 'liveCpuChart') cpuChart = newChart;
        if (canvasId === 'liveMemoryChart') memoryChart = newChart;
    }

    function updateDiffCards(comparison) {
        if (!comparison) return;

        // Check for failed executions (null values)
        const startupVM = comparison.startup_time?.vm;
        const startupContainer = comparison.startup_time?.container;
        const cpuVM = comparison.cpu_usage?.vm;
        const cpuContainer = comparison.cpu_usage?.container;
        const memVM = comparison.memory_usage?.vm;
        const memContainer = comparison.memory_usage?.container;

        // Helper to check if any value is null or undefined
        const isNull = (v) => v === null || v === undefined;

        if (isNull(startupVM) || isNull(startupContainer)) {
            startupCard.innerHTML = '⚠️ Startup time measurement failed';
        } else {
            const startupDiff = ((startupVM - startupContainer) / startupVM * 100).toFixed(1);
            startupCard.innerHTML = `Container is <span class="highlight">${startupDiff}% faster</span> (VM: ${startupVM}s, Container: ${startupContainer}s)`;
        }

        if (isNull(cpuVM) || isNull(cpuContainer)) {
            cpuCard.innerHTML = '⚠️ CPU usage measurement failed';
        } else {
            const cpuDiff = ((cpuVM - cpuContainer) / cpuVM * 100).toFixed(1);
            cpuCard.innerHTML = `Container uses <span class="highlight">${cpuDiff}% less CPU</span> (VM: ${cpuVM}%, Container: ${cpuContainer}%)`;
        }

        if (isNull(memVM) || isNull(memContainer)) {
            memoryCard.innerHTML = '⚠️ Memory usage measurement failed';
        } else {
            const memDiff = ((memVM - memContainer) / memVM * 100).toFixed(1);
            memoryCard.innerHTML = `Container uses <span class="highlight">${memDiff}% less memory</span> (VM: ${memVM}MB, Container: ${memContainer}MB)`;
        }
    }

    function updateCharts(comparison) {
        if (!comparison) return;
        // Only create charts if both values are valid numbers
        const startupVM = comparison.startup_time?.vm;
        const startupContainer = comparison.startup_time?.container;
        const cpuVM = comparison.cpu_usage?.vm;
        const cpuContainer = comparison.cpu_usage?.container;
        const memVM = comparison.memory_usage?.vm;
        const memContainer = comparison.memory_usage?.container;

        if (typeof startupVM === 'number' && typeof startupContainer === 'number') {
            createChart('liveStartupChart', 'Startup Time', startupVM, startupContainer, comparison.startup_time.unit);
        }
        if (typeof cpuVM === 'number' && typeof cpuContainer === 'number') {
            createChart('liveCpuChart', 'CPU Usage', cpuVM, cpuContainer, comparison.cpu_usage.unit);
        }
        if (typeof memVM === 'number' && typeof memContainer === 'number') {
            createChart('liveMemoryChart', 'Memory Usage', memVM, memContainer, comparison.memory_usage.unit);
        }
    }

    if (runBtn) {
        runBtn.addEventListener('click', async function() {
            console.log("Run button clicked");
            const code = editor ? editor.value : '';
            if (!code.trim()) {
                outputDiv.innerHTML = '⚠️ Please enter some Python code.';
                return;
            }
            outputDiv.innerHTML = '⏳ Running... (may take up to 60 seconds)';

            try {
                const response = await fetch('/api/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Server error ${response.status}: ${errorText}`);
                }

                const data = await response.json();
                console.log("Response data:", data);

                if (data.error) {
                    outputDiv.innerHTML = `❌ Error: ${data.error}`;
                    return;
                }

                outputDiv.innerHTML = `
                    <h3 style="color:#ff69b4;">📦 Container Output:</h3>
                    <pre>${data.docker ? data.docker.output : 'No output'}</pre>
                    <h3 style="color:#8a2be2;">🖥️ VM Simulation Output:</h3>
                    <pre>${data.vm ? data.vm.output : 'No output'}</pre>
                `;

                if (data.comparison) {
                    updateDiffCards(data.comparison);
                    updateCharts(data.comparison);
                }
            } catch (error) {
                console.error("Fetch error:", error);
                outputDiv.innerHTML = `❌ Network error: ${error.message}`;
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            outputDiv.innerHTML = 'Ready. Click "Run & Benchmark".';
            // Optionally clear charts (optional)
            if (startupChart) startupChart.destroy();
            if (cpuChart) cpuChart.destroy();
            if (memoryChart) memoryChart.destroy();
            startupChart = cpuChart = memoryChart = null;
        });
    }
});