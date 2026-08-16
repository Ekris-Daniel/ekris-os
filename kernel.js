/**
 * NexusOS Kernel v2.0.0 (Hierarchical VFS & Persistence Edition)
 * Responsibilities: Process Lifecycle, Windowing, Unified Path Resolution
 */

class NexusKernel {
    constructor() {





        this.processes = new Map();
        this.zIndexStack = 100;
        this.desktop = document.getElementById('desktop');

        // Autocomplete Registry
        this.registry = new Set(['help', 'clear', 'ps', 'kill', 'sys', 'whoami', 'neofetch', 'ls', 'cd', 'mkdir', 'rm']);

        // System Bus for Events
        this.bus = new EventTarget();

        // Daemon for Symbol Extraction
        this.daemon = {
            watch: (data) => {
                const words = data.match(/\b[a-zA-Z_][a-zA-Z0-9_]{3,}\b/g);
                if (words) words.forEach(word => this.registerSymbol(word));
            }
        };
    }
    scrapeGlobalSymbols() {
        console.log("Kernel: Deep Scrape Initiated...");

        // 1. Scrape Window/JS Globals
        Object.keys(window).forEach(key => {
            if (!key.startsWith('webkit') && key.length > 2) this.registry.add(key);
        });

        // 2. Scrape Running Process PIDs and Titles
        this.processes.forEach((proc, pid) => {
            this.registry.add(pid.toString()); // Allow "kill 101" tab-completion
            this.registry.add(proc.title);
        });

        // 3. Recursive VFS Scrape (Everything in LocalStorage)
        const deepScrapeVFS = (dir) => {
            if (!dir || !dir.children) return;
            Object.keys(dir.children).forEach(name => {
                this.registry.add(name); // Add file/folder name
                if (dir.children[name].type === 'dir') {
                    deepScrapeVFS(dir.children[name]); // Recurse into subfolders
                }
            });
        };
        deepScrapeVFS(window.UserM.fs["/"]);

        // 4. App Manifests
        if (window.TerminalApp?.manifest) {
            window.TerminalApp.manifest.forEach(s => this.registry.add(s));
        }

        console.log(`Kernel: Discovery complete. ${this.registry.size} symbols indexed.`);
    }

    registerSymbol(symbols) {
        if (!symbols) return;
        const items = Array.isArray(symbols) ? symbols : [symbols];
        items.forEach(s => {
            if (s) this.registry.add(s.toString());
        });
    }

    // --- VFS CORE (Hierarchical Logic) ---

    saveFile(fullPath, content) {
        // 1. Resolve path segments
        const parts = fullPath.split('/').filter(p => p);
        const fileName = parts.pop();

        // 2. Navigate/Create Tree Structure
        let current = window.UserM.fs["/"];
        for (const part of parts) {
            if (!current.children[part] || current.children[part].type !== 'dir') {
                current.children[part] = { type: "dir", children: {} };
            }
            current = current.children[part];
        }

        // 3. Save File Object
        current.children[fileName] = {
            type: "file",
            content: content,
            timestamp: Date.now()
        };

        // 4. Persistence Commit
        this._syncToDisk();
        this.registerSymbol(fileName);
        console.log(`[VFS] Committed: ${fullPath}`);
    }

    readFile(fullPath) {
        const parts = fullPath.split('/').filter(p => p);
        let current = window.UserM.fs["/"];

        for (const part of parts) {
            if (current.children[part]) {
                current = current.children[part];
            } else {
                return null;
            }
        }
        return current.type === 'file' ? current.content : null;
    }

    listDir(path = window.UserM.cwd) {
        const target = window.UserM.resolvePath(path);
        return target && target.type === 'dir' ? Object.keys(target.children) : [];
    }

    _syncToDisk() {
        localStorage.setItem('stealth_fs', JSON.stringify(window.UserM.fs));
    }

    // --- PROCESS MANAGEMENT ---

    async execute(filename) {
        const code = this.readFile(filename);
        if (!code) {
            console.error(`Kernel: ${filename} not found.`);
            return false;
        }

        try {
            const blob = new Blob([code], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            const script = document.createElement('script');
            const pid = `script-${Date.now()}`;

            script.src = url;
            script.id = pid;
            this.processes.set(pid, { title: `Run: ${filename}`, type: 'script', instance: script });

            document.head.appendChild(script);
            script.onload = () => URL.revokeObjectURL(url);
            return true;
        } catch (err) {
            console.error(`Runtime Error:`, err);
            return err.message;
        }
    }

    async launch(appConfig) {
        const pid = `proc_${Math.random().toString(36).substr(2, 9)}`;
        const winFrame = this._createWindowUI(pid, appConfig);

        const processEntry = {
            pid: pid,
            title: appConfig.title,
            instance: winFrame,
            state: 'running'
        };

        this.processes.set(pid, processEntry);
        this._updateTaskbar();

        const contentArea = winFrame.querySelector('.window-content');
        if (appConfig.init) {
            try {
                appConfig.init(contentArea, this);
            } catch (err) {
                contentArea.innerHTML = `<div style="color:#ff5f56; padding:20px;">App Error: ${err.message}</div>`;
            }
        }
        return pid;
    }

    kill(pid) {
        const proc = this.processes.get(pid);
        if (proc) {
            proc.instance.remove();
            this.processes.delete(pid);
            this._updateTaskbar();
            console.log(`Kernel: Process ${pid} killed.`);
        }
    }

    // --- SYSTEM SNAPSHOTS ---

    exportSystem() {
        const systemSnapshot = {
            os: "Stealth-OS",
            version: "2.0.0-GOLD",
            timestamp: new Date().toISOString(),
            payload: {
                vfs: window.UserM.fs, // Get fresh RAM copy
                profile: window.UserM.profile
            }
        };

        const blob = new Blob([JSON.stringify(systemSnapshot, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `STEALTH_GHOST_${Date.now()}.json`;
        a.click();
    }

    importSystem(jsonString) {
        try {
            const snapshot = JSON.parse(jsonString);
            if (snapshot.os !== "Stealth-OS") throw new Error("Invalid Format");

            localStorage.setItem('stealth_fs', JSON.stringify(snapshot.payload.vfs));
            localStorage.setItem('stealth_profile', JSON.stringify(snapshot.payload.profile));
            location.reload();
        } catch (e) {
            alert("Import Failure: " + e.message);
        }
    }

    // --- WINDOW UI LOGIC ---

    _createWindowUI(pid, config) {
        const win = document.createElement('div');
        win.className = 'window';
        win.id = pid;
        win.style.zIndex = ++this.zIndexStack;

        win.innerHTML = `
            <div class="window-header">
                <span class="window-title">${config.title}</span>
                <div class="window-controls">
                    <button class="win-btn min-btn" onclick="Kernel.minimize('${pid}')">−</button>
                    <button class="win-btn max-btn" onclick="Kernel.maximize('${pid}')">□</button>
                    <button class="win-btn close-btn" onclick="Kernel.kill('${pid}')">×</button>
                </div>
            </div>
            <div class="window-content" id="content-${pid}"></div>
            <div class="resizer"></div>
        `;

        this.desktop.appendChild(win);
        this._setupDraggable(win);
        this._setupResizable(win);
        return win;
    }

    minimize(pid) {
        const proc = this.processes.get(pid);
        if (!proc) return;
        const win = proc.instance;
        win.style.display = 'none';
        proc.state = 'minimized';
        this._updateTaskbar();
    }

    maximize(pid) {
        const proc = this.processes.get(pid);
        if (!proc) return;
        const win = proc.instance;

        if (proc.state === 'maximized') {
            // Restore
            win.style.left = proc._restoreRect.left;
            win.style.top = proc._restoreRect.top;
            win.style.width = proc._restoreRect.width;
            win.style.height = proc._restoreRect.height;
            proc.state = 'running';
        } else {
            // Save current position & maximize
            proc._restoreRect = {
                left: win.style.left,
                top: win.style.top,
                width: win.style.width,
                height: win.style.height
            };
            win.style.left = '0';
            win.style.top = '0';
            win.style.width = '100%';
            win.style.height = '100%';
            proc.state = 'maximized';
        }
    }

    restore(pid) {
        const proc = this.processes.get(pid);
        if (!proc) return;
        const win = proc.instance;

        if (proc.state === 'minimized') {
            win.style.display = 'flex';
            proc.state = 'running';
            win.style.zIndex = ++this.zIndexStack;
            this._updateTaskbar();
        }
    }

    _updateTaskbar() {
        const bar = document.getElementById('running-apps');
        if (!bar) return;
        bar.innerHTML = '';
        this.processes.forEach((proc, pid) => {
            const btn = document.createElement('div');
            btn.className = 'taskbar-app-btn' + (proc.state === 'minimized' ? ' minimized' : '');
            btn.textContent = proc.title;
            btn.onclick = () => {
                if (proc.state === 'minimized') {
                    this.restore(pid);
                } else {
                    proc.instance.style.zIndex = ++this.zIndexStack;
                }
            };
            bar.appendChild(btn);
        });
    }

    _setupDraggable(el) {
        const header = el.querySelector('.window-header');
        header.onmousedown = (e) => {
            if (e.target.classList.contains('win-btn')) return;
            let px = e.clientX, py = e.clientY;
            document.onmousemove = (e) => {
                el.style.left = (el.offsetLeft + (e.clientX - px)) + "px";
                el.style.top = (el.offsetTop + (e.clientY - py)) + "px";
                px = e.clientX; py = e.clientY;
            };
            document.onmouseup = () => document.onmousemove = null;
        };
    }

    _setupResizable(el) {
        const resizer = el.querySelector('.resizer');
        resizer.onmousedown = (e) => {
            e.preventDefault();
            window.onmousemove = (e) => {
                const w = e.clientX - el.offsetLeft;
                const h = e.clientY - el.offsetTop;
                if (w > 200) el.style.width = w + 'px';
                if (h > 150) el.style.height = h + 'px';
            };
            window.onmouseup = () => window.onmousemove = null;
        };
    }

    // --- AUTOCOMPLETE ENGINE ---

    registerSymbol(word) {
        if (Array.isArray(word)) word.forEach(w => this.registry.add(w.toLowerCase()));
        else this.registry.add(word.toLowerCase());
    }

    getSuggestions(query) {
        if (!query) return [];
        const q = query.toLowerCase();
        return Array.from(this.registry)
            .filter(item => item.startsWith(q))
            .sort((a, b) => a.length - b.length);
    }
}

window.Kernel = new NexusKernel();