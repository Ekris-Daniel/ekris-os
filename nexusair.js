/**
 * NexusAir v3.0 - GitHub Infrastructure Manager
 * Focus: Repo Registry & Asset Management (No-Auth)
 */
window.NexusairApp = {
    title: "NexusAir-C2",
    id: "nexusair",
    init: (container, kernel) => {
        const style = document.createElement('style');
        style.textContent = `
            .nx-air-wrapper { display: flex; flex-direction: column; height: 100%; background: #0d1117; color: #c9d1d9; font-family: 'Segoe UI', system-ui; }
            .nx-header { padding: 15px; background: #161b22; border-bottom: 1px solid #30363d; display: flex; gap: 10px; }
            .nx-input { background: #010409; border: 1px solid #30363d; color: #58a6ff; padding: 8px; border-radius: 6px; flex: 1; outline: none; }
            .nx-btn { background: #238636; border: 1px solid rgba(240,246,252,0.1); color: #fff; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 12px; }
            .nx-grid { flex: 1; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; padding: 15px; }
            .nx-card { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 15px; transition: 0.2s; position: relative; }
            .nx-card:hover { border-color: #8b949e; }
            .nx-badge { font-size: 10px; padding: 2px 6px; border-radius: 10px; background: #21262d; border: 1px solid #30363d; color: #8b949e; }
            .nx-download-btn { margin-top: 10px; width: 100%; background: #21262d; border: 1px solid #30363d; color: #c9d1d9; padding: 5px; border-radius: 4px; cursor: pointer; font-size: 11px; }
            .nx-download-btn:hover { background: #30363d; }
        `;
        document.head.appendChild(style);

        container.innerHTML = `
            <div class="nx-air-wrapper">
                <div class="nx-header">
                    <input type="text" id="gh-user" class="nx-input" placeholder="Enter GitHub Username...">
                    <button id="gh-fetch" class="nx-btn">SYNC REGISTRY</button>
                </div>
                <div class="nx-grid" id="repo-grid">
                    <div style="grid-column: 1/-1; text-align: center; color: #8b949e; padding-top: 50px;">
                        Enter a username to populate the NexusAir Registry.
                    </div>
                </div>
            </div>
        `;

        const grid = container.querySelector('#repo-grid');
        const userInp = container.querySelector('#gh-user');

        container.querySelector('#gh-fetch').onclick = async () => {
            const user = userInp.value.trim();
            if (!user) return;
            
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center;">Mapping Nodes...</div>`;

            try {
                const response = await fetch(`https://api.github.com/users/${user}/repos?sort=updated`);
                const repos = await response.json();

                if (!Array.isArray(repos)) throw new Error("User not found");

                grid.innerHTML = repos.map(repo => `
                    <div class="nx-card">
                        <div style="color: #58a6ff; font-weight: bold; margin-bottom: 5px;">${repo.name}</div>
                        <div style="font-size: 11px; color: #8b949e; height: 35px; overflow: hidden; margin-bottom: 8px;">
                            ${repo.description || "No description provided."}
                        </div>
                        <div style="display: flex; gap: 5px;">
                            <span class="nx-badge">${repo.language || 'Plaintext'}</span>
                            <span class="nx-badge">★ ${repo.stargazers_count}</span>
                        </div>
                        <button class="nx-download-btn" onclick="window.NexusairApp.downloadRepo('${repo.full_name}', '${repo.default_branch}')">
                            DOWNLOAD TO VFS
                        </button>
                    </div>
                `).join('');
            } catch (e) {
                grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #f85149;">Error: ${e.message}</div>`;
            }
        };
    },

    /**
     * Algorithmic Download: Triggers a ZIP export from GitHub
     */
    downloadRepo: (fullName, branch) => {
        const url = `https://github.com/${fullName}/archive/refs/heads/${branch}.zip`;
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fullName.split('/')[1]}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        console.log(`[VFS] Requesting archive for ${fullName}...`);
    }
};