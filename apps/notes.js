window.NotesApp = {
    title: "Notes",
    id: "notes",
    init: (container, kernel) => {
        const style = document.createElement('style');
        style.textContent = `
            .notes-wrapper {
                display: flex;
                height: 100%;
                background: #0d1117;
                font-family: 'Fira Code', monospace;
            }
            .notes-sidebar {
                width: 200px;
                background: #161b22;
                border-right: 1px solid #30363d;
                display: flex;
                flex-direction: column;
                flex-shrink: 0;
            }
            .notes-sidebar-header {
                padding: 12px;
                border-bottom: 1px solid #30363d;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .notes-sidebar-header span {
                color: #8b949e;
                font-size: 0.75rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .notes-new-btn {
                background: #58a6ff;
                border: none;
                color: #0d1117;
                width: 24px;
                height: 24px;
                border-radius: 6px;
                font-size: 1rem;
                cursor: pointer;
                font-weight: 700;
                transition: background 0.15s;
            }
            .notes-new-btn:hover { background: #79c0ff; }
            .notes-list {
                flex: 1;
                overflow-y: auto;
                padding: 6px;
            }
            .note-item {
                padding: 10px;
                border-radius: 6px;
                cursor: pointer;
                margin-bottom: 4px;
                transition: background 0.15s;
            }
            .note-item:hover { background: rgba(255,255,255,0.05); }
            .note-item.active { background: rgba(88,166,255,0.1); border-left: 2px solid #58a6ff; }
            .note-item-title {
                color: #f0f6fc;
                font-size: 0.8rem;
                font-weight: 600;
                margin-bottom: 3px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .note-item-preview {
                color: #484f58;
                font-size: 0.7rem;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .note-item-date {
                color: #30363d;
                font-size: 0.65rem;
                margin-top: 3px;
            }
            .notes-editor {
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            .notes-editor-header {
                padding: 10px 15px;
                border-bottom: 1px solid #30363d;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .notes-title-input {
                flex: 1;
                background: none;
                border: none;
                color: #f0f6fc;
                font-family: inherit;
                font-size: 0.95rem;
                font-weight: 600;
                outline: none;
            }
            .notes-title-input::placeholder { color: #30363d; }
            .notes-delete-btn {
                background: none;
                border: none;
                color: #484f58;
                cursor: pointer;
                font-size: 1rem;
                padding: 4px 8px;
                border-radius: 4px;
                transition: all 0.15s;
            }
            .notes-delete-btn:hover { color: #f85149; background: rgba(248,81,73,0.1); }
            .notes-textarea {
                flex: 1;
                background: none;
                border: none;
                color: #c9d1d9;
                font-family: 'Fira Code', monospace;
                font-size: 0.8rem;
                padding: 15px;
                resize: none;
                outline: none;
                line-height: 1.6;
            }
            .notes-textarea::placeholder { color: #30363d; }
            .notes-empty {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #30363d;
                font-size: 0.85rem;
            }
            .notes-status {
                padding: 6px 15px;
                border-top: 1px solid #30363d;
                color: #3fb950;
                font-size: 0.65rem;
                display: flex;
                justify-content: space-between;
            }
        `;
        container.appendChild(style);

        const STORAGE_KEY = 'stealth_notes';

        function loadNotes() {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        }

        function saveNotes(notes) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
        }

        let notes = loadNotes();
        let activeId = notes.length > 0 ? notes[0].id : null;

        container.innerHTML += `
            <div class="notes-wrapper">
                <div class="notes-sidebar">
                    <div class="notes-sidebar-header">
                        <span>Notes</span>
                        <button class="notes-new-btn" id="new-note-btn" title="New Note">+</button>
                    </div>
                    <div class="notes-list" id="notes-list"></div>
                </div>
                <div class="notes-editor" id="notes-editor"></div>
            </div>
        `;

        const listEl = container.querySelector('#notes-list');
        const editorEl = container.querySelector('#notes-editor');

        function createNote() {
            const note = {
                id: 'note_' + Date.now(),
                title: 'Untitled Note',
                content: '',
                created: Date.now(),
                modified: Date.now()
            };
            notes.unshift(note);
            activeId = note.id;
            saveNotes(notes);
            render();
        }

        function deleteNote(id) {
            notes = notes.filter(n => n.id !== id);
            if (activeId === id) activeId = notes.length > 0 ? notes[0].id : null;
            saveNotes(notes);
            render();
        }

        function formatDate(ts) {
            const d = new Date(ts);
            const now = new Date();
            if (d.toDateString() === now.toDateString()) {
                return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            }
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        function renderList() {
            listEl.innerHTML = notes.map(n => `
                <div class="note-item ${n.id === activeId ? 'active' : ''}" data-id="${n.id}">
                    <div class="note-item-title">${n.title || 'Untitled'}</div>
                    <div class="note-item-preview">${(n.content || 'Empty note').substring(0, 40)}</div>
                    <div class="note-item-date">${formatDate(n.modified)}</div>
                </div>
            `).join('');

            listEl.querySelectorAll('.note-item').forEach(item => {
                item.addEventListener('click', () => {
                    activeId = item.dataset.id;
                    render();
                });
            });
        }

        function renderEditor() {
            const note = notes.find(n => n.id === activeId);
            if (!note) {
                editorEl.innerHTML = '<div class="notes-empty">Select or create a note</div>';
                return;
            }

            editorEl.innerHTML = `
                <div class="notes-editor-header">
                    <input class="notes-title-input" value="${note.title}" placeholder="Note title..." />
                    <button class="notes-delete-btn" title="Delete note">x</button>
                </div>
                <textarea class="notes-textarea" placeholder="Start typing...">${note.content}</textarea>
                <div class="notes-status">
                    <span id="note-chars">${note.content.length} chars</span>
                    <span>Modified: ${new Date(note.modified).toLocaleString()}</span>
                </div>
            `;

            let saveTimer;
            const titleInput = editorEl.querySelector('.notes-title-input');
            const textarea = editorEl.querySelector('.notes-textarea');

            function autoSave() {
                clearTimeout(saveTimer);
                saveTimer = setTimeout(() => {
                    note.title = titleInput.value || 'Untitled Note';
                    note.content = textarea.value;
                    note.modified = Date.now();
                    saveNotes(notes);
                    renderList();
                    const chars = editorEl.querySelector('#note-chars');
                    if (chars) chars.textContent = textarea.value.length + ' chars';
                }, 300);
            }

            titleInput.addEventListener('input', autoSave);
            textarea.addEventListener('input', autoSave);

            editorEl.querySelector('.notes-delete-btn').addEventListener('click', () => {
                if (confirm('Delete this note?')) deleteNote(note.id);
            });

            textarea.focus();
        }

        function render() {
            renderList();
            renderEditor();
        }

        container.querySelector('#new-note-btn').addEventListener('click', createNote);

        render();

        if (kernel) kernel.registerSymbol(['notes', 'note', 'memo']);
    }
};
