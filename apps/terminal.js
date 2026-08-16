/**
 * Stealth-OS Terminal v5.1
 * Refactored for Hierarchical VFS, Persistence, and Python Integration
 */

const TerminalApp = {
    title: "Stealth-Terminal",
    id: "terminal",

    manifest: [
        'help', 'clear', 'ps', 'kill', 'ls', 'cd', 'mkdir', 'rm', 'pwd', 'cat',
        'whoami', 'set-user', 'set-pass', 'set-role', 'logout', 'run',
        'backup', 'restore', 'python', 'pip', 'sync'
    ],

    init: (container, kernel) => {
        kernel.registerSymbol(TerminalApp.manifest);

        const style = document.createElement('style');
        style.textContent = `
            .term-wrapper { display: flex; flex-direction: column-reverse; height: 100%; background: rgba(2, 6, 23, 0.98); font-family: 'Fira Code', monospace; color: #38bdf8; overflow: hidden; }
            .input-line { display: flex; align-items: center; padding: 12px 15px; background: rgba(255, 255, 255, 0.03); border-top: 1px solid rgba(56, 189, 248, 0.2); position: relative; }
            .output-area { flex: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; gap: 5px; }
            .term-field { background: transparent; border: none; color: #fff; outline: none; width: 100%; font-family: inherit; font-size: 0.9rem; z-index: 5; }
            .ghost-hint { position: absolute; color: rgba(255, 255, 255, 0.1); pointer-events: none; white-space: pre; z-index: 1; }
            .prompt-label { color: #00d4ff; font-weight: bold; margin-right: 10px; white-space: nowrap; }
            .line-cmd { color: #64748b; font-size: 0.8rem; margin-top: 8px; }
            .line-res { color: #e2e8f0; margin-bottom: 12px; white-space: pre-wrap; font-size: 0.85rem; border-left: 2px solid rgba(56, 189, 248, 0.2); padding-left: 10px; }
        `;
        document.head.appendChild(style);

        const user = window.UserM.profile.username;
        const role = window.UserM.profile.role;

        container.innerHTML = `
            <div class="term-wrapper">
                <div class="input-line">
                    <span class="prompt-label" id="prompt-text">${user}@stealth:${window.UserM.cwd}$</span>
                    <span class="ghost-hint" id="ghost-display"></span>
                    <input type="text" class="term-field" id="cli-input" spellcheck="false" autocomplete="off" autofocus>
                </div>
                <div class="output-area" id="cli-output">
                    <div style="color: #fbbf24; font-size: 0.75rem;">Nexus Kernel v2.0 Online. Session: ${user}</div>
                    <div style="color: #38bdf8; font-size: 0.75rem;">Type 'help' for available modules.</div>
                    <hr style="border:0; border-top:1px solid rgba(56,189,248,0.1); margin: 8px 0;">
                </div>
            </div>
        `;

        const input = container.querySelector('#cli-input');
        const output = container.querySelector('#cli-output');
        const ghost = container.querySelector('#ghost-display');
        const promptLabel = container.querySelector('#prompt-text');

        // Suggestion Engine
        // 4. Input & Suggestion Engine (Fixed Alignment)
        // Inside the 'input' event listener
        input.addEventListener('input', () => {
            const val = input.value;
            if (!val) { ghost.innerText = ""; return; }

            // Calculate offset: label width + cursor position
            const labelWidth = promptLabel.innerText.length;

            // Ghost needs to start exactly where the prompt ends
            ghost.style.left = `calc(15px + ${labelWidth}ch)`;

            const words = val.split(' ');
            const lastWord = words[words.length - 1];

            if (lastWord.length > 0) {
                const matches = kernel.getSuggestions(lastWord);
                if (matches.length > 0) {
                    // " ".repeat(val.length) works ONLY if fonts are perfectly monospace
                    ghost.innerText = " ".repeat(val.length) + matches[0].slice(lastWord.length);
                } else {
                    ghost.innerText = "";
                }
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const val = input.value;
                const words = val.split(' ');
                const lastWord = words[words.length - 1];
                const matches = kernel.getSuggestions(lastWord);

                if (matches.length > 0) {
                    // Replace ONLY the last word with the full match
                    words[words.length - 1] = matches[0];
                    input.value = words.join(' ');
                    ghost.innerText = "";

                    // Trigger input event to update ghost for the next potential word
                    input.dispatchEvent(new Event('input'));
                }
            }


            if (e.key === 'Enter') {
                const raw = input.value.trim();
                if (!raw) return;

                const logEntry = document.createElement('div');
                logEntry.innerHTML = `<div class="line-cmd">> ${raw}</div>`;

                const response = processCommand(raw, kernel, output, promptLabel);
                if (response) logEntry.innerHTML += `<div class="line-res">${response}</div>`;

                output.appendChild(logEntry);
                input.value = ""; ghost.innerText = "";
                output.scrollTop = output.scrollHeight;

                // Update prompt in case CWD changed
                promptLabel.innerText = `${window.UserM.profile.username}@stealth:${window.UserM.cwd}$`;
            }
        });

        container.addEventListener('click', () => input.focus());
    }
};

function processCommand(raw, kernel, output, promptLabel) {
    const args = raw.split(' ');
    const cmd = args.shift().toLowerCase();
    kernel.registerSymbol(cmd);

    switch (cmd) {
        case 'help': return `AVAILABLE: ${TerminalApp.manifest.join(', ')}`;


        case 'pwd': return window.UserM.cwd;

        case 'ls':
            const dir = window.UserM.resolvePath(window.UserM.cwd);
            return Object.keys(dir.children).map(name => {
                return dir.children[name].type === "dir" ? `[DIR] ${name}/` : name;
            }).join("\n") || "(Directory empty)";

        case 'cd':
            if (!args[0]) return "Usage: cd [path]";
            if (args[0] === "..") {
                let parts = window.UserM.cwd.split("/").filter(p => p);
                parts.pop();
                window.UserM.cwd = "/" + parts.join("/");
                return null;
            }
            let pathPrefix = window.UserM.cwd === "/" ? "/" : window.UserM.cwd + "/";
            let target = window.UserM.resolvePath(pathPrefix + args[0]);
            if (target && target.type === "dir") {
                window.UserM.cwd = pathPrefix + args[0];
                return null;
            }
            return "Error: Path not found.";

        case 'mkdir':
            if (!args[0]) return "Usage: mkdir [name]";
            let currentDir = window.UserM.resolvePath(window.UserM.cwd);
            currentDir.children[args[0]] = { type: "dir", children: {} };
            localStorage.setItem('stealth_fs', JSON.stringify(window.UserM.fs));
            return `Created directory: ${args[0]}`;

        case 'rm':
            if (!args[0]) return "Usage: rm [name]";
            let targetDir = window.UserM.resolvePath(window.UserM.cwd);
            if (targetDir.children[args[0]] && confirm(`Delete ${args[0]}?`)) {
                delete targetDir.children[args[0]];
                localStorage.setItem('stealth_fs', JSON.stringify(window.UserM.fs));
                return `Removed ${args[0]}`;
            }
            return "Error: File/Folder not found.";

        case 'cat':
            if (!args[0]) return "Usage: cat [file]";
            let filePath = window.UserM.cwd === "/" ? "/" + args[0] : window.UserM.cwd + "/" + args[0];
            return kernel.readFile(filePath) || "File not found.";

        case 'python':
            if (!args[0]) return "Usage: python [file.py]";
            if (!window.UserM.pythonReady) return "Python Engine Offline.";
            let pyPath = window.UserM.cwd === "/" ? "/" + args[0] : window.UserM.cwd + "/" + args[0];
            const pyCode = kernel.readFile(pyPath);
            if (!pyCode) return "Script not found.";
            try {
                let out = "";
                window.pyodide.setStdout({ batched: (t) => out += t + "\n" });
                window.pyodide.runPython(pyCode);
                return out || "Execution finished.";
            } catch (e) { return `[PY ERROR] ${e}`; }

        case 'pip':
            if (args[0] !== 'install' || !args[1]) return "Usage: pip install [pkg]";
            output.appendChild(document.createTextNode(`\nStarting install: ${args[1]}...`));
            window.pyodide.runPythonAsync(`import micropip\nawait micropip.install('${args[1]}')`)
                .then(() => {
                    const res = document.createElement('div');
                    res.innerHTML = `<span style="color:#3fb950">Module ${args[1]} ready in RAM.</span>`;
                    output.appendChild(res);
                });
            return null;

        case 'run':
            if (!args[0]) return "Usage: run [file.js]";
            let jsPath = window.UserM.cwd === "/" ? "/" + args[0] : window.UserM.cwd + "/" + args[0];
            kernel.execute(jsPath).then(res => {
                const entry = document.createElement('div');
                entry.innerHTML = res === true ? `<span style="color:#3fb950">Started ${args[0]}</span>` : `<span style="color:#f85149">Error: ${res}</span>`;
                output.appendChild(entry);
            });
            return null;

        case 'ps':
            let pList = "PID\t\tTITLE\n";
            kernel.processes.forEach((p, id) => pList += `${id}\t${p.title}\n`);
            return pList;

        case 'kill':
            if (!args[0]) return "Usage: kill [pid]";
            kernel.kill(args[0]);
            return `Terminated ${args[0]}`;

        case 'clear': output.innerHTML = ""; return null;

        case 'sync': kernel.scrapeGlobalSymbols(); return "Symbols synced.";


        case 'export':
            kernel.exportSystem();
            return "Generating system snapshot... check downloads.";

        case 'restore':
            // 1. Create a hidden file input
            const picker = document.createElement('input');
            picker.type = 'file';
            picker.accept = '.json';

            picker.onchange = e => {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (event) => {
                    kernel.importSystem(event.target.result);
                };
                reader.readAsText(file);
            };

            picker.click(); // Trigger the browser's file browse window
            return "Waiting for system manifest upload...";

        case 'set-user':
            if (args.length === 0) return "Error: Argument required. Usage: set-user [name]";
            const newName = args[0]; // Take the first word after the command
            window.UserM.profile.username = newName;
            window.UserM.save();

            // Update the live UI immediately
            if (promptLabel) promptLabel.innerText = `${newName}@stealth:${window.UserM.cwd}$`;
            return `Identity set to ${newName}. (Disk Synced)`;


        case 'whoami':
            // Use backticks for multi-line display so you can actually see the status
            const profile = window.UserM.profile;
            return `USER: ${profile.username}\nPASS: ${profile.password ? "****" : "NONE"}\nROLE: ${profile.role}`;




        case 'set-pass':
            const newPass = prompt("Enter new system access key:");
            if (newPass) {
                window.UserM.profile.password = newPass;
                window.UserM.save();
                return "Encryption key set. System will require auth on next boot.";
            }
            return "Action aborted.";

        case 'clear-pass':
            if (confirm("Disable system security?")) {
                window.UserM.profile.password = null;
                window.UserM.save();
                return "Security protocols deactivated.";
            }
            return "Password remains active.";
        default:
            if (window[cmd]) return JSON.stringify(window[cmd], null, 2);
            return `Unknown command: ${cmd}`;
    }
}

window.TerminalApp = TerminalApp;