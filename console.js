/**
 * Stealth-Net Console v2.1 (The Nexus Suite - Discord & Stress-Test Optimized)
 * Targeted by bootApp('console') -> window.ConsoleApp
 */
window.ConsoleApp = {
    title: "Net-Console Pro",
    id: "console",
    init: (container, kernel) => {
        const styleId = "console-v2-css";
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .net-pro-wrapper { display: flex; flex-direction: column; height: 100%; background: #0d1117; color: #c9d1d9; font-family: 'Fira Code', monospace; font-size: 12px; }
                .net-config-pane { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 10px; background: #161b22; border-bottom: 1px solid #30363d; }
                .net-field-group { display: flex; flex-direction: column; gap: 5px; }
                .net-label { font-size: 10px; color: #8b949e; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; }
                .net-area { background: #010409; border: 1px solid #30363d; color: #3fb950; padding: 8px; border-radius: 4px; outline: none; font-family: inherit; resize: none; font-size: 11px; }
                .net-area:focus { border-color: #58a6ff; }
                
                .net-control-bar { padding: 10px; display: flex; gap: 10px; align-items: center; background: #0d1117; border-bottom: 1px solid #30363d; flex-wrap: wrap; }
                .net-input { background: #010409; border: 1px solid #30363d; color: #fff; padding: 6px 10px; border-radius: 4px; font-size: 12px; }
                .net-btn-run { background: #238636; color: #fff; border: none; padding: 8px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; }
                .net-btn-run:hover { background: #2ea043; }
                .net-btn-stop { background: #da3633; color: #fff; border: none; padding: 8px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; }
                
                .net-monitor { flex: 1; overflow-y: auto; padding: 15px; background: #010409; color: #d1d5db; line-height: 1.5; border-top: 1px solid #30363d; }
                .log-entry { margin-bottom: 8px; padding: 8px; border-left: 3px solid #30363d; background: rgba(255,255,255,0.02); border-radius: 0 4px 4px 0; }
                .log-entry.success { border-color: #3fb950; }
                .log-entry.error { border-color: #f85149; }
                .log-entry.info { border-color: #58a6ff; }
                pre { margin-top: 5px; color: #a5d6ff; font-size: 11px; overflow-x: auto; }
            `;
            document.head.appendChild(style);
        }

        container.innerHTML = `
            <div class="net-pro-wrapper">
                <div class="net-config-pane">
                    <div class="net-field-group">
                        <label class="net-label">Headers (JSON)</label>
                        <textarea id="net-headers" class="net-area" style="height: 70px;">{
  "Content-Type": "application/json"
}</textarea>
                    </div>
                    <div class="net-field-group">
                        <label class="net-label">Payload (Body)</label>
                        <textarea id="net-body" class="net-area" style="height: 70px;">{
  "content": "Test"
}</textarea>
                    </div>
                </div>

                <div class="net-control-bar">
                    <select id="net-method" class="net-input">
                        <option>POST</option><option>GET</option><option>PUT</option><option>DELETE</option>
                    </select>
                    <input type="text" id="net-url" class="net-input" style="flex:1" placeholder="Target URL" value="https://example.com">
                    
                    <div style="display:flex; align-items:center; gap:5px;">
                        <label class="net-label">Iterations:</label>
                        <input type="number" id="net-count" class="net-input" style="width: 50px;" value="1" min="1">
                    </div>
                    
                    <div style="display:flex; align-items:center; gap:5px;">
                        <label class="net-label">Wait (ms):</label>
                        <input type="number" id="net-delay" class="net-input" style="width: 70px;" value="1000" min="0">
                    </div>
                    
                    <button id="net-run" class="net-btn-run">FIRE</button>
                    <button id="net-stop" class="net-btn-stop" style="display:none;">ABORT</button>
                </div>

                <div id="net-monitor" class="net-monitor">
                    <div style="color:#8b949e">// Stealth-Net Console Loaded. Target verified.</div>
                </div>
            </div>
        `;

        let isRunning = false;
        const monitor = container.querySelector('#net-monitor');
        const stopBtn = container.querySelector('#net-stop');
        const runBtn = container.querySelector('#net-run');

        const log = (msg, type = '') => {
            const div = document.createElement('div');
            div.className = `log-entry ${type}`;
            div.innerHTML = `<span style="color:#8b949e">[${new Date().toLocaleTimeString()}]</span> ${msg}`;
            monitor.appendChild(div);
            monitor.scrollTop = monitor.scrollHeight;
        };

        const execute = async () => {
            if (isRunning) return;
            isRunning = true;
            runBtn.style.display = 'none';
            stopBtn.style.display = 'block';
            
            const url = container.querySelector('#net-url').value;
            const method = container.querySelector('#net-method').value;
            const headersStr = container.querySelector('#net-headers').value;
            const bodyStr = container.querySelector('#net-body').value;
            const count = parseInt(container.querySelector('#net-count').value) || 1;
            const delay = parseInt(container.querySelector('#net-delay').value) || 0;

            log(`LAUNCHING SEQUENCE: ${count} cycle(s) -> ${url}`, 'info');

            for (let i = 0; i < count; i++) {
                if (!isRunning) break;

                try {
                    const headers = JSON.parse(headersStr);
                    const options = { method, headers };
                    if (method !== 'GET') options.body = bodyStr;

                    const t0 = performance.now();
                    const res = await fetch(url, options);
                    const t1 = performance.now();
                    
                    let displayData = "";
                    
                    // SMART PARSE: Check status and content-type
                    if (res.status === 204) {
                        displayData = "Success (No Content Returned)";
                    } else {
                        const contentType = res.headers.get("content-type");
                        if (contentType && contentType.includes("application/json")) {
                            const data = await res.json();
                            displayData = JSON.stringify(data, null, 2);
                        } else {
                            displayData = await res.text();
                        }
                    }

                    log(`BURST ${i+1}/${count}: <span style="color:#3fb950">STATUS ${res.status}</span> (${Math.round(t1-t0)}ms)<br><pre>${displayData.substring(0, 500)}</pre>`, 'success');
                } catch (e) {
                    log(`BURST ${i+1}/${count}: <span style="color:#f85149">FAILURE</span> - ${e.message}`, 'error');
                }

                if (i < count - 1 && isRunning) {
                    await new Promise(r => setTimeout(r, delay));
                }
            }

            isRunning = false;
            runBtn.style.display = 'block';
            stopBtn.style.display = 'none';
            log("SEQUENCE TERMINATED.", 'info');
        };

        runBtn.onclick = execute;
        stopBtn.onclick = () => { isRunning = false; };
    }
};