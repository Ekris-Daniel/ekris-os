/**
 * Nexus-Scan v1.0
 * Algorithmic Port Scanner & Recon Tool
 */
window.ScannerApp = {
    title: "Nexus-Scanner",
    id: "scanner",
    init: async (container, kernel) => {
        // Import a specialized library for Data Visualization (D3.js) via CDN
        // This helps a polymath visualize network clusters
        if (!window.d3) {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/d3@7";
            document.head.appendChild(script);
        }

        const styleId = "scan-css";
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .scan-wrapper { display: flex; flex-direction: column; height: 100%; background: #010409; color: #58a6ff; font-family: 'Fira Code', monospace; }
                .scan-header { padding: 15px; background: #0d1117; border-bottom: 1px solid #30363d; display: flex; gap: 10px; }
                .scan-input { background: #010409; border: 1px solid #30363d; color: #3fb950; padding: 8px; border-radius: 4px; flex: 1; }
                .scan-btn { background: #238636; border: none; color: white; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: bold; }
                .scan-results { flex: 1; overflow-y: auto; padding: 20px; font-size: 12px; line-height: 1.6; }
                .port-row { display: flex; justify-content: space-between; border-bottom: 1px solid rgba(48, 54, 61, 0.5); padding: 4px 0; }
                .open { color: #3fb950; font-weight: bold; }
                .closed { color: #f85149; opacity: 0.6; }
                .algo-box { font-size: 10px; color: #8b949e; margin-bottom: 10px; padding: 5px; border: 1px dashed #30363d; }
            `;
            document.head.appendChild(style);
        }

        container.innerHTML = `
            <div class="scan-wrapper">
                <div class="scan-header">
                    <input type="text" id="target-ip" class="scan-input" placeholder="Target Host (e.g., scanme.nmap.org)">
                    <button id="start-scan" class="scan-btn">SCAN</button>
                </div>
                <div class="scan-results" id="scan-out">
                    <div class="algo-box">// Algorithm: TCP/HTTP Probing via Fetch-CORS Bypass</div>
                    <div id="status-text">Ready for Recon.</div>
                    <div id="port-list"></div>
                </div>
            </div>
        `;

        const btn = container.querySelector('#start-scan');
        const targetInput = container.querySelector('#target-ip');
        const list = container.querySelector('#port-list');
        const status = container.querySelector('#status-text');

        const commonPorts = [
            { p: 21, s: "FTP" }, { p: 22, s: "SSH" }, { p: 23, s: "Telnet" },
            { p: 80, s: "HTTP" }, { p: 443, s: "HTTPS" }, { p: 3306, s: "MySQL" },
            { p: 8080, s: "HTTP-Proxy" }, { p: 27017, s: "MongoDB" }
        ];

        btn.onclick = async () => {
            const host = targetInput.value.trim();
            if (!host) return;

            list.innerHTML = "";
            status.innerText = `Scanning ${host}... (Passive Recon Mode)`;
            
            for (const port of commonPorts) {
                const start = performance.now();
                try {
                    // Algorithmic Check: We use fetch to check if a port is "talking"
                    // Browsers block raw TCP, so we probe via cross-origin timing analysis
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 2000);

                    // We try to fetch the port; if it's open, it will usually trigger a 
                    // CORS error or a Type error immediately. If it's filtered, it times out.
                    await fetch(`https://${host}:${port.p}`, { mode: 'no-cors', signal: controller.signal });
                    
                    const row = document.createElement('div');
                    row.className = 'port-row';
                    row.innerHTML = `<span>Port ${port.p} (${port.s})</span> <span class="open">OPEN/FILTERED</span>`;
                    list.appendChild(row);
                } catch (e) {
                    const duration = performance.now() - start;
                    const row = document.createElement('div');
                    row.className = 'port-row';
                    
                    if (e.name === 'AbortError' || duration > 1500) {
                        row.innerHTML = `<span>Port ${port.p} (${port.s})</span> <span class="closed">TIMEOUT</span>`;
                    } else {
                        // If it's a "Failed to fetch" but fast, the port is likely open but rejected our protocol
                        row.innerHTML = `<span>Port ${port.p} (${port.s})</span> <span class="open">REJECTED (ACTIVE)</span>`;
                    }
                    list.appendChild(row);
                }
            }
            status.innerText = "Scan Complete.";
        };
    }
};