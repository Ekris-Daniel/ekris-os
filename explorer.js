/**
 * Stealth-Explorer v5.1 (Fixed & Namespaced)
 */
const ExplorerApp = {
    title: "File-Explorer",
    id: "explorer",
    init: (container, kernel) => {
        // 1. UNIQUE CSS - Ensuring this doesn't touch the Terminal or Editor
        const styleId = "stealth-explorer-css";
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .exp-wrapper { display: flex; flex-direction: column; height: 100%; background: #010409; color: #c9d1d9; font-family: 'Segoe UI', Tahoma, sans-serif; }
                .exp-nav { padding: 10px 15px; background: #161b22; border-bottom: 1px solid #30363d; display: flex; align-items: center; gap: 12px; }
                .exp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 15px; padding: 20px; overflow-y: auto; flex: 1; }
                
                .back-btn { cursor: pointer; background: #21262d; border: 1px solid #30363d; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; color: #58a6ff; }
                .back-btn:hover { background: #30363d; }
                .path-display { font-family: 'Fira Code', monospace; font-size: 11px; color: #8b949e; opacity: 0.8; }

                .file-icon { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px; border-radius: 8px; cursor: pointer; border: 1px solid transparent; transition: 0.15s; }
                .file-icon:hover { background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.2); }
                .icon-visual { font-size: 36px; margin-bottom: 8px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); }
                .icon-name { font-size: 11px; text-align: center; word-break: break-all; width: 100%; line-height: 1.2; }
            `;
            document.head.appendChild(style);
        }

        const render = () => {
            const currentPath = window.UserM.cwd;
            const dirData = window.UserM.resolvePath(currentPath);
            
            // Clean slate for the container
            container.innerHTML = `
                <div class="exp-wrapper">
                    <div class="exp-nav">
                        <div class="back-btn" id="exp-back">BACK</div>
                        <span class="path-display">${currentPath}</span>
                    </div>
                    <div class="exp-grid" id="exp-grid"></div>
                </div>
            `;

            const grid = container.querySelector('#exp-grid');
            const backBtn = container.querySelector('#exp-back');

            // Logic: Go Up
            backBtn.onclick = () => {
                if (currentPath === "/") return;
                let parts = currentPath.split("/").filter(p => p);
                parts.pop();
                window.UserM.cwd = "/" + parts.join("/");
                render();
                if (window.refreshTerminal) window.refreshTerminal(); 
            };

            if (!dirData || !dirData.children) {
                grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding-top: 50px; color: #484f58;">[ Directory Empty or Corrupt ]</div>`;
                return;
            }

            Object.keys(dirData.children).forEach(name => {
                const item = dirData.children[name];
                const isDir = item.type === 'dir';
                const div = document.createElement('div');
                div.className = 'file-icon';
                
                let icon = isDir ? '📁' : '📄';
                if (name.endsWith('.js')) icon = '📜';
                if (name.endsWith('.py')) icon = '🐍';
                if (name.endsWith('.txt')) icon = '📝';
                if (name.endsWith('.sh')) icon = '⚡';

                div.innerHTML = `
                    <div class="icon-visual">${icon}</div>
                    <div class="icon-name">${name}</div>
                `;
                
                div.ondblclick = () => {
                    if (isDir) {
                        const slash = currentPath === "/" ? "" : "/";
                        window.UserM.cwd = currentPath + slash + name;
                        render();
                        if (window.refreshTerminal) window.refreshTerminal();
                    } else {
                        // Logic: Run or Edit
                        if (name.endsWith('.js')) {
                            const run = confirm(`Execute ${name}?`);
                            run ? kernel.execute(currentPath + (currentPath==="/"?"":"/") + name) : window.bootApp('editor');
                        } else {
                            window.bootApp('editor');
                        }
                    }
                };
                grid.appendChild(div);
            });
        };

        render();
        window.refreshExplorer = render; 
    }
};

window.ExplorerApp = ExplorerApp;