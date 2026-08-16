window.SettingsApp = {
    title: "Settings",
    id: "settings",
    init: (container, kernel) => {
        const style = document.createElement('style');
        style.textContent = `
            .settings-wrapper {
                display: flex;
                height: 100%;
                background: #0d1117;
                font-family: 'Fira Code', monospace;
            }
            .settings-sidebar {
                width: 160px;
                background: #161b22;
                border-right: 1px solid #30363d;
                padding: 10px 0;
                flex-shrink: 0;
            }
            .settings-nav-item {
                display: block;
                width: 100%;
                padding: 10px 15px;
                background: none;
                border: none;
                color: #8b949e;
                font-family: inherit;
                font-size: 0.8rem;
                text-align: left;
                cursor: pointer;
                transition: all 0.15s;
            }
            .settings-nav-item:hover { color: #f0f6fc; background: rgba(255,255,255,0.05); }
            .settings-nav-item.active {
                color: #58a6ff;
                background: rgba(88,166,255,0.1);
                border-left: 2px solid #58a6ff;
            }
            .settings-panel {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
            }
            .settings-panel h3 {
                color: #f0f6fc;
                font-size: 1rem;
                margin: 0 0 20px 0;
                padding-bottom: 10px;
                border-bottom: 1px solid #30363d;
            }
            .setting-group {
                margin-bottom: 20px;
            }
            .setting-group label {
                display: block;
                color: #8b949e;
                font-size: 0.75rem;
                margin-bottom: 6px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .setting-group input[type="text"],
            .setting-group select {
                width: 100%;
                padding: 8px 12px;
                background: #161b22;
                border: 1px solid #30363d;
                border-radius: 6px;
                color: #f0f6fc;
                font-family: inherit;
                font-size: 0.85rem;
                box-sizing: border-box;
            }
            .setting-group input:focus, .setting-group select:focus {
                outline: none;
                border-color: #58a6ff;
            }
            .color-picker-row {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }
            .color-swatch {
                width: 36px;
                height: 36px;
                border-radius: 8px;
                border: 2px solid transparent;
                cursor: pointer;
                transition: all 0.15s;
            }
            .color-swatch:hover { transform: scale(1.1); }
            .color-swatch.active { border-color: #f0f6fc; box-shadow: 0 0 10px rgba(255,255,255,0.3); }
            .settings-btn {
                padding: 8px 18px;
                background: #58a6ff;
                border: none;
                border-radius: 6px;
                color: #0d1117;
                font-family: inherit;
                font-size: 0.8rem;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.15s;
                margin-right: 8px;
            }
            .settings-btn:hover { background: #79c0ff; }
            .settings-btn.danger { background: #f85149; }
            .settings-btn.danger:hover { background: #ff7b72; }
            .settings-status {
                color: #3fb950;
                font-size: 0.75rem;
                margin-top: 10px;
                opacity: 0;
                transition: opacity 0.3s;
            }
            .settings-status.show { opacity: 1; }
            .wallpaper-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
            }
            .wallpaper-option {
                height: 60px;
                border-radius: 8px;
                border: 2px solid #30363d;
                cursor: pointer;
                transition: all 0.15s;
            }
            .wallpaper-option:hover { border-color: #58a6ff; }
            .wallpaper-option.active { border-color: #58a6ff; box-shadow: 0 0 10px rgba(88,166,255,0.3); }
        `;
        container.appendChild(style);

        const accentColors = [
            { name: 'Sky Blue', value: '#38bdf8' },
            { name: 'Emerald', value: '#34d399' },
            { name: 'Violet', value: '#a78bfa' },
            { name: 'Rose', value: '#fb7185' },
            { name: 'Amber', value: '#fbbf24' },
            { name: 'Cyan', value: '#22d3ee' },
            { name: 'Orange', value: '#fb923c' },
            { name: 'Lime', value: '#a3e635' },
        ];

        const wallpapers = [
            { name: 'Default Dark', bg: '#020617', glow: 'rgba(56, 189, 248, 0.1)' },
            { name: 'Deep Ocean', bg: '#001220', glow: 'rgba(6, 182, 212, 0.12)' },
            { name: 'Midnight Purple', bg: '#0f0720', glow: 'rgba(139, 92, 246, 0.12)' },
            { name: 'Dark Forest', bg: '#051007', glow: 'rgba(52, 211, 153, 0.1)' },
            { name: 'Crimson Night', bg: '#120508', glow: 'rgba(248, 113, 113, 0.1)' },
            { name: 'Warm Dark', bg: '#1a1207', glow: 'rgba(251, 191, 36, 0.08)' },
        ];

        const savedSettings = JSON.parse(localStorage.getItem('stealth_settings') || '{}');
        let currentAccent = savedSettings.accent || '#38bdf8';
        let currentWallpaper = savedSettings.wallpaper || 0;
        let currentSection = 'appearance';

        container.innerHTML += `
            <div class="settings-wrapper">
                <div class="settings-sidebar">
                    <button class="settings-nav-item active" data-section="appearance">Appearance</button>
                    <button class="settings-nav-item" data-section="profile">Profile</button>
                    <button class="settings-nav-item" data-section="system">System</button>
                    <button class="settings-nav-item" data-section="about">About</button>
                </div>
                <div class="settings-panel" id="settings-content"></div>
            </div>
        `;

        const contentEl = container.querySelector('#settings-content');

        function renderSection(section) {
            currentSection = section;
            container.querySelectorAll('.settings-nav-item').forEach(n => n.classList.remove('active'));
            container.querySelector(`[data-section="${section}"]`).classList.add('active');

            switch (section) {
                case 'appearance': renderAppearance(); break;
                case 'profile': renderProfile(); break;
                case 'system': renderSystem(); break;
                case 'about': renderAbout(); break;
            }
        }

        function renderAppearance() {
            contentEl.innerHTML = `
                <h3>Appearance</h3>
                <div class="setting-group">
                    <label>Accent Color</label>
                    <div class="color-picker-row">
                        ${accentColors.map(c =>
                            `<div class="color-swatch ${c.value === currentAccent ? 'active' : ''}"
                                  style="background:${c.value}" data-color="${c.value}" title="${c.name}"></div>`
                        ).join('')}
                    </div>
                </div>
                <div class="setting-group">
                    <label>Wallpaper</label>
                    <div class="wallpaper-grid">
                        ${wallpapers.map((w, i) =>
                            `<div class="wallpaper-option ${i === currentWallpaper ? 'active' : ''}"
                                  style="background:${w.bg}; box-shadow: inset 0 0 30px ${w.glow};"
                                  data-wp="${i}" title="${w.name}"></div>`
                        ).join('')}
                    </div>
                </div>
                <div class="settings-status" id="settings-status">Settings applied!</div>
            `;

            contentEl.querySelectorAll('.color-swatch').forEach(sw => {
                sw.addEventListener('click', () => {
                    currentAccent = sw.dataset.color;
                    applyAccent(currentAccent);
                    saveSettings();
                    renderAppearance();
                    showStatus();
                });
            });

            contentEl.querySelectorAll('.wallpaper-option').forEach(wp => {
                wp.addEventListener('click', () => {
                    currentWallpaper = parseInt(wp.dataset.wp);
                    applyWallpaper(currentWallpaper);
                    saveSettings();
                    renderAppearance();
                    showStatus();
                });
            });
        }

        function renderProfile() {
            const profile = window.UserM.profile;
            contentEl.innerHTML = `
                <h3>Profile</h3>
                <div class="setting-group">
                    <label>Username</label>
                    <input type="text" id="set-username" value="${profile.username}" />
                </div>
                <div class="setting-group">
                    <label>Role</label>
                    <select id="set-role">
                        <option value="Admin" ${profile.role === 'Admin' ? 'selected' : ''}>Admin</option>
                        <option value="User" ${profile.role === 'User' ? 'selected' : ''}>User</option>
                        <option value="Guest" ${profile.role === 'Guest' ? 'selected' : ''}>Guest</option>
                    </select>
                </div>
                <div class="setting-group">
                    <label>Password (leave blank to remove)</label>
                    <input type="text" id="set-password" value="" placeholder="Enter new password..." />
                </div>
                <button class="settings-btn" id="save-profile">Save Profile</button>
                <div class="settings-status" id="settings-status">Profile saved!</div>
            `;

            contentEl.querySelector('#save-profile').addEventListener('click', () => {
                window.UserM.profile.username = contentEl.querySelector('#set-username').value || 'Stealth-user';
                window.UserM.profile.role = contentEl.querySelector('#set-role').value;
                const pw = contentEl.querySelector('#set-password').value;
                window.UserM.profile.password = pw || null;
                window.UserM.save();
                showStatus();
            });
        }

        function renderSystem() {
            const fsSize = new Blob([JSON.stringify(window.UserM.fs)]).size;
            const profileSize = new Blob([JSON.stringify(window.UserM.profile)]).size;
            contentEl.innerHTML = `
                <h3>System</h3>
                <div class="setting-group">
                    <label>Storage Usage</label>
                    <div style="color:#f0f6fc; font-size:0.85rem;">
                        VFS: ${(fsSize / 1024).toFixed(2)} KB<br>
                        Profile: ${(profileSize / 1024).toFixed(2)} KB<br>
                        Settings: ${(new Blob([localStorage.getItem('stealth_settings') || '']).size / 1024).toFixed(2)} KB
                    </div>
                </div>
                <div class="setting-group">
                    <label>Danger Zone</label>
                    <button class="settings-btn danger" id="reset-settings">Reset Settings</button>
                    <button class="settings-btn danger" id="clear-vfs">Clear VFS</button>
                </div>
                <div class="settings-status" id="settings-status">Done!</div>
            `;

            contentEl.querySelector('#reset-settings').addEventListener('click', () => {
                if (confirm('Reset all appearance settings to defaults?')) {
                    localStorage.removeItem('stealth_settings');
                    currentAccent = '#38bdf8';
                    currentWallpaper = 0;
                    applyAccent(currentAccent);
                    applyWallpaper(0);
                    showStatus();
                }
            });

            contentEl.querySelector('#clear-vfs').addEventListener('click', () => {
                if (confirm('This will erase ALL files in the virtual filesystem. Continue?')) {
                    window.UserM.fs = { "/": { type: "dir", children: {} } };
                    localStorage.setItem('stealth_fs', JSON.stringify(window.UserM.fs));
                    showStatus();
                }
            });
        }

        function renderAbout() {
            contentEl.innerHTML = `
                <h3>About Stealth-OS</h3>
                <div style="color:#8b949e; font-size:0.85rem; line-height:1.8;">
                    <div style="color:#f0f6fc; font-size:1.1rem; margin-bottom:10px;">Stealth-OS v2.0.0</div>
                    <div>Kernel: NexusKernel v2.0.0</div>
                    <div>Platform: Web Browser</div>
                    <div>Runtime: ${navigator.userAgent.split(' ').pop()}</div>
                    <div>Python: ${window.UserM.pythonReady ? 'Pyodide v0.25.0' : 'Loading...'}</div>
                    <div>Processes: ${kernel.processes.size} running</div>
                    <div>Symbols: ${kernel.registry.size} indexed</div>
                    <div style="margin-top:15px; color:#58a6ff;">Built with Nexus Systems</div>
                </div>
            `;
        }

        function applyAccent(color) {
            document.documentElement.style.setProperty('--accent', color);
            document.documentElement.style.setProperty('--glass-border', color.replace(')', ', 0.2)').replace('rgb', 'rgba').replace('#', ''));
            // Simpler approach: set border color directly
            const hsl = hexToHSL(color);
            document.documentElement.style.setProperty('--glass-border', `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 0.2)`);

            const launcher = document.querySelector('.launcher-btn');
            if (launcher) {
                launcher.style.background = color;
                launcher.style.boxShadow = `0 0 15px ${color}66`;
            }
        }

        function hexToHSL(hex) {
            let r = parseInt(hex.slice(1, 3), 16) / 255;
            let g = parseInt(hex.slice(3, 5), 16) / 255;
            let b = parseInt(hex.slice(5, 7), 16) / 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;
            if (max === min) { h = s = 0; }
            else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                    case g: h = ((b - r) / d + 2) / 6; break;
                    case b: h = ((r - g) / d + 4) / 6; break;
                }
            }
            return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
        }

        function applyWallpaper(index) {
            const wp = wallpapers[index];
            document.documentElement.style.setProperty('--bg', wp.bg);
            document.body.style.backgroundColor = wp.bg;
            const glow = document.querySelector('.glow-sphere');
            if (glow) glow.style.background = `radial-gradient(circle, ${wp.glow} 0%, transparent 70%)`;
        }

        function saveSettings() {
            localStorage.setItem('stealth_settings', JSON.stringify({
                accent: currentAccent,
                wallpaper: currentWallpaper
            }));
        }

        function showStatus() {
            const el = contentEl.querySelector('#settings-status');
            if (el) {
                el.classList.add('show');
                setTimeout(() => el.classList.remove('show'), 2000);
            }
        }

        // Apply saved settings on load
        if (savedSettings.accent) applyAccent(savedSettings.accent);
        if (savedSettings.wallpaper !== undefined) applyWallpaper(savedSettings.wallpaper);

        container.querySelectorAll('.settings-nav-item').forEach(nav => {
            nav.addEventListener('click', () => renderSection(nav.dataset.section));
        });

        renderSection('appearance');

        if (kernel) kernel.registerSymbol(['settings', 'config', 'appearance', 'theme']);
    }
};
