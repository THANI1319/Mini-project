// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const scanBtn = document.getElementById('scan-btn');
    const infoDiv = document.getElementById('system-info');

    if (!scanBtn) {
        console.error("Scan button not found!");
        return;
    }
    if (!infoDiv) {
        console.error("System info div not found!");
        return;
    }

    scanBtn.addEventListener('click', function() {
        // Show the info card
        infoDiv.style.display = 'block';

        // CPU cores
        const cpuCores = navigator.hardwareConcurrency || 'Not available';
        document.getElementById('cpu-cores').textContent = cpuCores;

        // RAM (device memory) – only in Chrome/Edge/Opera
        let ram = 'Not available';
        if (navigator.deviceMemory) {
            ram = navigator.deviceMemory + ' GB';
        }
        document.getElementById('ram').textContent = ram;

        // Platform / OS
        let platform = navigator.platform || 'Unknown';
        if (navigator.userAgentData && navigator.userAgentData.platform) {
            platform = navigator.userAgentData.platform;
        }
        document.getElementById('platform').textContent = platform;

        // Browser name
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
        else if (ua.indexOf('Edg/') > -1 || ua.indexOf('Edge/') > -1) browser = 'Edge';
        else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) browser = 'Chrome';
        else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) browser = 'Safari';
        document.getElementById('browser').textContent = browser;

        // Screen resolution
        const screenRes = `${screen.width} x ${screen.height}`;
        document.getElementById('screen').textContent = screenRes;

        // Full user agent
        document.getElementById('user-agent').textContent = ua;

        // Optional extra fields (if they exist in HTML)
        const connectionElem = document.getElementById('connection');
        if (connectionElem) {
            let connection = 'Not available';
            if (navigator.connection) {
                const conn = navigator.connection;
                connection = `${conn.effectiveType || '?'} (${conn.downlink || '?'} Mbps)`;
            }
            connectionElem.textContent = connection;
        }

        const langElem = document.getElementById('language');
        if (langElem) {
            langElem.textContent = navigator.language || navigator.userLanguage || 'Unknown';
        }

        const tzElem = document.getElementById('timezone');
        if (tzElem) {
            tzElem.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
        }
    });
});