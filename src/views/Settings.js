// ===========================================
// Settings View — Categories, trackers, export/import, theme
// ===========================================

const SettingsView = {
    render(container) {
        DOM.clear(container);

        const categories = Store.getCategories();
        const trackers = Store.getTrackers();

        container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Theme -->
        <div class="settings-section">
          <div class="settings-section-title">Appearance</div>
          <div class="settings-row">
            <div>
              <div class="settings-label">Dark mode</div>
              <div class="settings-desc">Easier on the eyes at night</div>
            </div>
            <label class="toggle-wrap">
              <input type="checkbox" class="toggle-input" id="settings-theme-toggle"
                ${document.documentElement.getAttribute('data-theme') === 'dark' ? 'checked' : ''} />
              <span class="toggle-track"></span>
            </label>
          </div>
        </div>

        <!-- Categories -->
        <div class="settings-section">
          <div class="settings-section-title">Categories</div>
          <div id="settings-cat-list"></div>
          <button class="btn btn-secondary btn-sm" id="settings-add-cat" style="margin-top: var(--sp-2);">+ Add Category</button>
        </div>

        <!-- Trackers -->
        <div class="settings-section">
          <div class="settings-section-title">Custom Trackers</div>
          <div class="settings-desc" style="margin-bottom: var(--sp-3);">Trackers appear in the sidebar as separate views.</div>
          <div id="settings-tracker-list"></div>
          <button class="btn btn-secondary btn-sm" id="settings-add-tracker" style="margin-top: var(--sp-2);">+ Add Tracker</button>
        </div>

        <!-- Data -->
        <div class="settings-section">
          <div class="settings-section-title">Your Data</div>

          <div class="settings-row">
            <div>
              <div class="settings-label">Export as JSON</div>
              <div class="settings-desc">Full backup of everything</div>
            </div>
            <button class="btn btn-secondary btn-sm" id="settings-export-json">Export</button>
          </div>

          <div class="settings-row">
            <div>
              <div class="settings-label">Export as CSV</div>
              <div class="settings-desc">Spreadsheet-friendly format</div>
            </div>
            <button class="btn btn-secondary btn-sm" id="settings-export-csv">Export</button>
          </div>

          <div class="settings-row">
            <div>
              <div class="settings-label">Import from JSON</div>
              <div class="settings-desc">Restore from a backup file</div>
            </div>
            <div>
              <input type="file" id="settings-import-file" accept=".json" style="display:none;" />
              <button class="btn btn-secondary btn-sm" id="settings-import-btn">Import</button>
            </div>
          </div>

          <div class="settings-row" style="margin-top: var(--sp-4);">
            <div>
              <div class="settings-label" style="color: var(--danger);">Clear all entries</div>
              <div class="settings-desc">This removes all entries but keeps your categories and trackers.</div>
            </div>
            <button class="btn btn-danger btn-sm" id="settings-clear-all">Clear</button>
          </div>
        </div>

        <!-- About -->
        <div class="settings-section">
          <div class="settings-section-title">About</div>
          <p style="font-size: var(--font-sm); color: var(--text-tertiary); line-height: 1.6;">
            Life Tracker — a tool made by a thoughtful human for real people managing real life.<br>
            Your data is stored locally in your browser. Nothing is sent to any server.
          </p>
        </div>
      </div>
    `;

        this._renderCategoryList(container);
        this._renderTrackerList(container);
        this._bindEvents(container);
    },

    _renderCategoryList(container) {
        const listEl = container.querySelector('#settings-cat-list');
        if (!listEl) return;
        DOM.clear(listEl);

        const categories = Store.getCategories();
        categories.forEach(cat => {
            const item = DOM.el('div', { className: 'category-list-item' });

            const colorInput = DOM.el('input', {
                type: 'color',
                value: cat.color,
                style: 'width:32px; height:32px; border:none; padding:0; cursor:pointer; border-radius:var(--radius-sm);',
                onChange: (e) => {
                    Store.updateCategory(cat.id, { color: e.target.value });
                }
            });

            const nameInput = DOM.el('input', {
                className: 'form-input',
                type: 'text',
                value: cat.name,
                onChange: (e) => {
                    Store.updateCategory(cat.id, { name: e.target.value.trim() || cat.name });
                }
            });

            const deleteBtn = DOM.el('button', {
                className: 'btn-icon btn-sm',
                title: 'Remove category',
                onClick: () => {
                    Store.deleteCategory(cat.id);
                    this._renderCategoryList(container);
                    Toast.show('Category removed.', 'info');
                }
            }, '✕');

            item.appendChild(colorInput);
            item.appendChild(nameInput);
            item.appendChild(deleteBtn);
            listEl.appendChild(item);
        });
    },

    _renderTrackerList(container) {
        const listEl = container.querySelector('#settings-tracker-list');
        if (!listEl) return;
        DOM.clear(listEl);

        const trackers = Store.getTrackers();
        trackers.forEach(tracker => {
            const item = DOM.el('div', { className: 'category-list-item' });

            const iconInput = DOM.el('input', {
                className: 'form-input',
                type: 'text',
                value: tracker.icon,
                style: 'width:48px; text-align:center; flex:none;',
                onChange: (e) => {
                    Store.updateTracker(tracker.id, { icon: e.target.value || '◉' });
                    Sidebar.renderTrackerNav();
                }
            });

            const nameInput = DOM.el('input', {
                className: 'form-input',
                type: 'text',
                value: tracker.name,
                onChange: (e) => {
                    Store.updateTracker(tracker.id, { name: e.target.value.trim() || tracker.name });
                    Sidebar.renderTrackerNav();
                }
            });

            const deleteBtn = DOM.el('button', {
                className: 'btn-icon btn-sm',
                title: 'Remove tracker',
                onClick: () => {
                    Store.deleteTracker(tracker.id);
                    this._renderTrackerList(container);
                    Sidebar.renderTrackerNav();
                    Toast.show('Tracker removed.', 'info');
                }
            }, '✕');

            item.appendChild(iconInput);
            item.appendChild(nameInput);
            item.appendChild(deleteBtn);
            listEl.appendChild(item);
        });
    },

    _bindEvents(container) {
        // Theme toggle
        container.querySelector('#settings-theme-toggle').addEventListener('change', (e) => {
            ThemeToggle.toggle();
        });

        // Add category
        container.querySelector('#settings-add-cat').addEventListener('click', () => {
            Store.addCategory({ name: 'New Category', color: '#8a8480' });
            this._renderCategoryList(container);
        });

        // Add tracker
        container.querySelector('#settings-add-tracker').addEventListener('click', () => {
            Store.addTracker({ name: 'New Tracker', icon: '◉' });
            this._renderTrackerList(container);
            Sidebar.renderTrackerNav();
        });

        // Export JSON
        container.querySelector('#settings-export-json').addEventListener('click', () => {
            DataExport.exportJSON();
        });

        // Export CSV
        container.querySelector('#settings-export-csv').addEventListener('click', () => {
            DataExport.exportCSV();
        });

        // Import
        const importFile = container.querySelector('#settings-import-file');
        container.querySelector('#settings-import-btn').addEventListener('click', () => {
            importFile.click();
        });

        importFile.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const result = await DataExport.importJSON(file);
                Toast.show(`Imported ${result.entries} entries, ${result.categories} categories, ${result.trackers} trackers.`, 'success');
                this.render(container);
                Sidebar.renderTrackerNav();
            } catch (err) {
                Toast.show(err.message, 'error');
            }
            importFile.value = '';
        });

        // Clear all
        container.querySelector('#settings-clear-all').addEventListener('click', () => {
            if (confirm('This will remove all your entries. Your categories and trackers will stay. Continue?')) {
                Store.clearAll();
                Toast.showUndo('All entries cleared.', () => {
                    Store.undo();
                    this.render(container);
                });
            }
        });
    }
};
