/**
 * Stealth-Editor v4.1 (Hierarchical VFS Edition)
 * Fixed: Persistence, Path Resolution, and UI Sync
 */
const EditorApp = {
    title: "Stealth-Code",
    id: "editor",

    init: (container, kernel) => {
        const session = {
            currentFile: null, // Just the name (e.g., 'test.js')
            isDirty: false
        };

        const style = document.createElement('style');
        style.textContent = `
            .ide-wrapper { display: flex; flex-direction: column; height: 100%; background: #010409; color: #c9d1d9; font-family: 'Fira Code', monospace; }
            .ide-toolbar { display: flex; align-items: center; gap: 12px; padding: 10px 15px; background: #161b22; border-bottom: 1px solid #30363d; }
            .ide-main { display: flex; flex: 1; overflow: hidden; position: relative; }
            .gutter { width: 45px; background: #010409; color: #484f58; padding: 20px 0; text-align: right; padding-right: 10px; font-size: 12px; border-right: 1px solid #30363d; user-select: none; overflow: hidden; }
            .editor-input { flex: 1; background: transparent; border: none; color: #e6edf3; padding: 20px; font-size: 14px; outline: none; resize: none; line-height: 1.5; white-space: pre; overflow: auto; }
            .status-bar { background: #007acc; color: #fff; padding: 3px 12px; font-size: 11px; display: flex; justify-content: space-between; }
            .btn { cursor: pointer; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; transition: 0.2s; user-select: none; }
            .btn-save { background: #238636; color: white; }
            .btn-open { background: #30363d; color: #c9d1d9; border: 1px solid #f0f6fc1a; }
            .btn-new { background: #6e7681; color: white; }
            .file-label { font-size: 12px; color: #58a6ff; font-style: italic; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
        `;
        document.head.appendChild(style);

        container.innerHTML = `
            <div class="ide-wrapper">
                <div class="ide-toolbar">
                    <div class="btn btn-new" id="new-cmd">NEW</div>
                    <div class="btn btn-save" id="save-cmd">SAVE</div>
                    <div class="btn btn-open" id="open-cmd">OPEN</div>
                    <span class="file-label" id="active-file">/unsaved_draft.js</span>
                    <span id="sync-indicator" style="margin-left:auto; font-size:10px; color:#484f58;">● Idle</span>
                </div>
                <div class="ide-main">
                    <div class="gutter" id="gutter">1</div>
                    <textarea class="editor-input" id="code-in" spellcheck="false" wrap="off"></textarea>
                </div>
                <div class="status-bar">
                    <span id="stat-left">PATH: <span id="cwd-display">/</span></span>
                    <span id="stat-right">Ln 1, Col 1</span>
                </div>
            </div>
        `;

        const codeIn = container.querySelector('#code-in');
        const gutter = container.querySelector('#gutter');
        const activeFileLabel = container.querySelector('#active-file');
        const syncInd = container.querySelector('#sync-indicator');
        const cwdDisplay = container.querySelector('#cwd-display');

        const updateUI = () => {
            const lines = codeIn.value.split('\n').length;
            gutter.innerHTML = Array.from({length: lines}, (_, i) => i + 1).join('<br>');
            cwdDisplay.innerText = window.UserM.cwd;
        };

const saveProcess = () => {
            let filename = session.currentFile;
            
            // 1. If no filename, ask for one
            if (!filename) {
                filename = prompt("Save as (filename only):", "invention.js");
            }
            
            if (filename) {
                // 2. Get the current directory object from UserM
                const currentDirPath = window.UserM.cwd;
                const parentDir = window.UserM.resolvePath(currentDirPath);
                
                if (!parentDir || parentDir.type !== 'dir') {
                    alert("FileSystem Error: Current directory is invalid.");
                    return;
                }

                // 3. Inject the file into the current directory's children
                parentDir.children[filename] = {
                    type: "file",
                    content: codeIn.value,
                    modified: Date.now()
                };

                // 4. CRITICAL: Sync the entire File System object back to LocalStorage
                // This is what ensures it survives a page refresh
                try {
                    localStorage.setItem('stealth_fs', JSON.stringify(window.UserM.fs));
                    
                    session.currentFile = filename;
                    session.isDirty = false;
                    
                    // Update UI Labels
                    const displayPath = (currentDirPath === "/" ? "" : currentDirPath) + "/" + filename;
                    activeFileLabel.innerText = displayPath;
                    syncInd.innerText = "● DISK SYNCED";
                    syncInd.style.color = "#3fb950";
                    
                    console.log(`System: Saved ${filename} to ${currentDirPath}`);
                } catch (e) {
                    alert("DISK FULL OR WRITE ERROR: " + e.message);
                }
            }
        };

        const openProcess = () => {
            const currentDir = window.UserM.resolvePath(window.UserM.cwd);
            const files = Object.keys(currentDir.children).filter(name => currentDir.children[name].type === "file");
            
            if (files.length === 0) return alert(`No files found in ${window.UserM.cwd}`);
            
            const name = prompt(`Files in ${window.UserM.cwd}:\n${files.join('\n')}\n\nEnter name to load:`);
            if (name && currentDir.children[name]) {
                codeIn.value = currentDir.children[name].content;
                session.currentFile = name;
                activeFileLabel.innerText = (window.UserM.cwd === "/" ? "" : window.UserM.cwd) + "/" + name;
                session.isDirty = false;
                syncInd.innerText = "● File Loaded";
                syncInd.style.color = "#38bdf8";
                updateUI();
            }
        };

        const newProcess = () => {
            if (session.isDirty && !confirm("Discard unsaved changes?")) return;
            codeIn.value = "";
            session.currentFile = null;
            session.isDirty = false;
            activeFileLabel.innerText = "/new_file.js";
            syncInd.innerText = "● Buffer Cleared";
            updateUI();
        };

        container.querySelector('#save-cmd').onclick = saveProcess;
        container.querySelector('#open-cmd').onclick = openProcess;
        container.querySelector('#new-cmd').onclick = newProcess;

        codeIn.oninput = () => {
            session.isDirty = true;
            syncInd.innerText = "● Modifying";
            syncInd.style.color = "#ffa657";
            updateUI();
        };

        codeIn.onscroll = () => { gutter.scrollTop = codeIn.scrollTop; };
        
        // Tab key support
        codeIn.onkeydown = (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = codeIn.selectionStart;
                codeIn.value = codeIn.value.substring(0, start) + "    " + codeIn.value.substring(codeIn.selectionEnd);
                codeIn.selectionStart = codeIn.selectionEnd = start + 4;
            }
        };
        
        updateUI();
    }
};

window.EditorApp = EditorApp;