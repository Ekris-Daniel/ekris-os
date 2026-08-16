/**
 * Stealth-OS System Monitor v1.1
 * Fixed: Event scoping, memory leaks, and global registry tracking.
 */
const MonitorApp = {
    title: "System-Monitor",
    id: "monitor",

    init: (container, kernel) => {
        const style = document.createElement('style');
        style.textContent = `
            .mon-wrapper { display: flex; flex-direction: column; height: 100%; background: #0d1117; color: #58a6ff; font-family: 'Fira Code', monospace; }
            .mon-header { padding: 10px 15px; background: #161b22; border-bottom: 1px solid #30363d; display: flex; justify-content: space-between; align-items: center; }
            .mon-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 10px; flex: 1; min-height: 0; }
            .mon-section { background: #010409; border: 1px solid #30363d; border-radius: 6px; display: flex; flex-direction: column; overflow: hidden; }
            .mon-title { background: #30363d; color: #fff; padding: 6px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
            .mon-list { flex: 1; overflow-y: auto; padding: 8px; font-size: 12px; line-height: 1.6; }
            .proc-item { display: flex; justify-content: space-between; padding: 6px 8px; border-bottom: 1px solid #21262d; align-items: center; }
            .proc-item:hover { background: rgba(255,255,255,0.03); }
            .proc-kill { color: #f85149; cursor: pointer; font-size: 10px; border: 1px solid #f8514933; padding: 2px 6px; border-radius: 4px; }
            .proc-kill:hover { background: #f85149; color: white; }
            .mon-footer { padding: 10px 15px; display: flex; gap: 25px; background: #161b22; border-top: 1px solid #30363d; font-size: 11px; }
            .symbol-tag { display: inline-block; color: #8b949e; margin-right: 8px; }
        `;
        document.head.appendChild(style);

        container.innerHTML = `
            <div class="mon-wrapper">
                <div class="mon-header">
                    <span style="font-weight:bold; color:#fff;">NEXUS_CORE_DAEMON</span>
                    <span id="mon-uptime" style="opacity:0.7">UPTIME: 0s</span>
                </div>
                <div class="mon-grid">
                    <div class="mon-section">
                        <div class="mon-title">Active Processes</div>
                        <div class="mon-list" id="proc-list"></div>
                    </div>
                    <div class="mon-section">
                        <div class="mon-title">Universal Registry</div>
                        <div class="mon-list" id="reg-list"></div>
                    </div>
                </div>
                <div class="mon-footer">
                    <div>Symbols: <span id="sym-count" style="color:#3fb950">0</span></div>
                    <div>VFS Status: <span style="color:#3fb950">OPTIMIZED</span></div>
                    <div>Core: <span style="color:#ffa657">P-THREAD-0</span></div>
                </div>
            </div>
        `;

        const procList = container.querySelector('#proc-list');
        const regList = container.querySelector('#reg-list');
        const uptimeLabel = container.querySelector('#mon-uptime');
        const symCountLabel = container.querySelector('#sym-count');

        let startTime = Date.now();

        const refresh = () => {
            // 1. Update Uptime
            uptimeLabel.innerText = `UPTIME: ${Math.floor((Date.now() - startTime)/1000)}s`;

            // 2. Update Processes with proper listeners
            procList.innerHTML = '';
            kernel.processes.forEach((proc, pid) => {
                const item = document.createElement('div');
                item.className = 'proc-item';
                item.innerHTML = `
                    <span><span style="color:#8b949e">PID:</span> ${pid} | ${proc.title}</span>
                    <span class="proc-kill" data-pid="${pid}">TERMINATE</span>
                `;
                // Secure Event Handling
                item.querySelector('.proc-kill').onclick = () => {
                    kernel.killProcess(pid);
                    refresh();
                };
                procList.appendChild(item);
            });

            // 3. Update Registry Symbols
            const symbols = Array.from(kernel.registry);
            symCountLabel.innerText = symbols.length;
            regList.innerHTML = symbols.map(s => `<span class="symbol-tag">> ${s}</span><br>`).join('');
        };

        const interval = setInterval(refresh, 1000);
        refresh();

        // Register a global refresh so terminal actions update this immediately
        window.refreshMonitor = refresh;

        // Cleanup: Important to stop the interval when the app window is closed
        // Assumes your OS 'killApp' removes the container or triggers a custom event
        const observer = new MutationObserver(() => {
            if (!document.body.contains(container)) {
                clearInterval(interval);
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
};

window.MonitorApp = MonitorApp;