// ===========================================
// Entries List View — Full list with filters, search, bulk operations
// ===========================================

const EntriesListView = {
    _filters: {
        query: '',
        status: 'all',
        category: '',
        priority: '',
        sort: 'newest'
    },
    _selectedIds: new Set(),
    _bulkMode: false,

    render(container, trackerFilter = null) {
        DOM.clear(container);
        this._selectedIds.clear();
        this._bulkMode = false;

        // If rendering for a specific tracker
        const filters = { ...this._filters };
        if (trackerFilter) {
            filters.trackerId = trackerFilter;
        }

        const entries = Store.getEntries(filters);

        container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Filter bar -->
        <div class="filter-bar">
          <div class="search-input-wrap">
            <input class="form-input search-input" type="text" id="entries-search" placeholder="Search entries..." value="${this._esc(this._filters.query)}" />
          </div>
          <select class="form-select" id="entries-filter-status" style="width:auto; min-width:120px;">
            <option value="all" ${this._filters.status === 'all' ? 'selected' : ''}>All statuses</option>
            <option value="pending" ${this._filters.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="completed" ${this._filters.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="skipped" ${this._filters.status === 'skipped' ? 'selected' : ''}>Skipped</option>
            <option value="archived" ${this._filters.status === 'archived' ? 'selected' : ''}>Archived</option>
          </select>
          <select class="form-select" id="entries-filter-priority" style="width:auto; min-width:120px;">
            <option value="" ${!this._filters.priority ? 'selected' : ''}>All priorities</option>
            <option value="high" ${this._filters.priority === 'high' ? 'selected' : ''}>High</option>
            <option value="medium" ${this._filters.priority === 'medium' ? 'selected' : ''}>Medium</option>
            <option value="low" ${this._filters.priority === 'low' ? 'selected' : ''}>Low</option>
          </select>
          <select class="form-select" id="entries-filter-category" style="width:auto; min-width:120px;">
            <option value="">All categories</option>
            ${Store.getCategories().map(c =>
            `<option value="${c.id}" ${this._filters.category === c.id ? 'selected' : ''}>${c.name}</option>`
        ).join('')}
          </select>
          <select class="form-select" id="entries-sort" style="width:auto; min-width:120px;">
            <option value="newest" ${this._filters.sort === 'newest' ? 'selected' : ''}>Newest first</option>
            <option value="oldest" ${this._filters.sort === 'oldest' ? 'selected' : ''}>Oldest first</option>
            <option value="priority" ${this._filters.sort === 'priority' ? 'selected' : ''}>Priority</option>
            <option value="dueDate" ${this._filters.sort === 'dueDate' ? 'selected' : ''}>Due date</option>
            <option value="status" ${this._filters.sort === 'status' ? 'selected' : ''}>Status</option>
          </select>
        </div>

        <!-- Bulk action bar -->
        <div id="entries-bulk-bar" style="display:none;"></div>

        <!-- Results count -->
        <div style="font-size: var(--font-xs); color: var(--text-tertiary); margin-bottom: var(--sp-3);">
          ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}
        </div>

        <!-- Entry list -->
        <div class="entries-list" id="entries-list-items">
          ${entries.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">📋</div>
              <div class="empty-state-title">No entries match your filters</div>
              <div class="empty-state-text">Try adjusting your search or filters, or add a new entry.</div>
              <button class="btn btn-primary" id="entries-empty-add">+ Add Entry</button>
            </div>
          ` : ''}
        </div>
      </div>
    `;

        // Render entries
        const listEl = container.querySelector('#entries-list-items');
        entries.forEach((entry, i) => {
            const item = this._createEntryItem(entry);
            item.style.animationDelay = `${i * 30}ms`;
            listEl.appendChild(item);
        });

        // Bind filter events
        this._bindFilterEvents(container, trackerFilter);

        // Empty state add button
        const emptyAdd = container.querySelector('#entries-empty-add');
        if (emptyAdd) {
            emptyAdd.addEventListener('click', () => {
                const defaults = trackerFilter ? { trackerId: trackerFilter } : {};
                EntryForm.open(null, defaults);
            });
        }
    },

    _bindFilterEvents(container, trackerFilter) {
        let debounceTimer;

        // Search
        const searchInput = container.querySelector('#entries-search');
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this._filters.query = searchInput.value;
                this.render(container, trackerFilter);
            }, 250);
        });

        // Status filter
        container.querySelector('#entries-filter-status').addEventListener('change', (e) => {
            this._filters.status = e.target.value;
            this.render(container, trackerFilter);
        });

        // Priority filter
        container.querySelector('#entries-filter-priority').addEventListener('change', (e) => {
            this._filters.priority = e.target.value;
            this.render(container, trackerFilter);
        });

        // Category filter
        container.querySelector('#entries-filter-category').addEventListener('change', (e) => {
            this._filters.category = e.target.value;
            this.render(container, trackerFilter);
        });

        // Sort
        container.querySelector('#entries-sort').addEventListener('change', (e) => {
            this._filters.sort = e.target.value;
            this.render(container, trackerFilter);
        });
    },

    _createEntryItem(entry) {
        const cat = Store.getCategoryById(entry.category);
        const isCompleted = entry.status === 'completed';

        const item = DOM.el('div', {
            className: `entry-item ${isCompleted ? 'completed' : ''}`,
            dataset: { id: entry.id }
        });

        // Checkbox
        const checkbox = DOM.el('div', {
            className: `entry-checkbox ${isCompleted ? 'checked' : ''}`,
            onClick: (e) => {
                e.stopPropagation();
                Store.toggleComplete(entry.id);
                if (!isCompleted) Toast.show('Done! ✓', 'success');
            }
        }, isCompleted ? '✓' : '');

        // Body
        const body = DOM.el('div', { className: 'entry-body' });
        body.appendChild(DOM.el('div', { className: 'entry-title' }, entry.title));

        const meta = DOM.el('div', { className: 'entry-meta' });

        if (entry.priority) {
            meta.appendChild(DOM.el('span', { className: `priority-dot ${entry.priority}` }));
        }

        if (cat) {
            const catBadge = DOM.el('span', { className: 'badge badge-neutral' });
            const dot = DOM.el('span', { className: 'color-dot', style: `background:${cat.color}; width:8px; height:8px; margin-right:4px;` });
            catBadge.appendChild(dot);
            catBadge.appendChild(document.createTextNode(cat.name));
            meta.appendChild(catBadge);
        }

        if (entry.dueDate) {
            const dateText = DateUtils.isToday(entry.dueDate) ? 'Today' :
                DateUtils.isOverdue(entry.dueDate) ? DateUtils.formatShort(entry.dueDate) + ' (overdue)' :
                    DateUtils.formatShort(entry.dueDate);
            const isOverdue = DateUtils.isOverdue(entry.dueDate) && !isCompleted;
            meta.appendChild(DOM.el('span', { style: isOverdue ? 'color:var(--danger)' : '' }, dateText));
        }

        if (entry.status === 'skipped') {
            meta.appendChild(DOM.el('span', { className: 'badge badge-warning' }, 'Skipped'));
        }

        if (entry.repeat && entry.repeat !== 'none') {
            meta.appendChild(DOM.el('span', {}, '↻ ' + Models.repeatLabels[entry.repeat]));
        }

        if (entry.tags && entry.tags.length) {
            entry.tags.slice(0, 3).forEach(t => {
                meta.appendChild(DOM.el('span', { className: 'tag' }, '#' + t));
            });
        }

        body.appendChild(meta);

        // Progress bar (if progress is set)
        if (entry.progress > 0) {
            const progressWrap = DOM.el('div', {
                style: 'display:flex; align-items:center; gap:var(--sp-2); margin-top:var(--sp-2);'
            });
            const bar = DOM.el('div', { className: 'progress-bar', style: 'flex:1;' });
            const fillClass = entry.progress >= 100 ? 'success' : entry.progress >= 50 ? '' : 'warning';
            bar.appendChild(DOM.el('div', {
                className: `progress-fill ${fillClass}`,
                style: `width:${Math.min(entry.progress, 100)}%`
            }));
            progressWrap.appendChild(bar);
            progressWrap.appendChild(DOM.el('span', {
                style: 'font-size:var(--font-xs); color:var(--text-tertiary); white-space:nowrap;'
            }, entry.progress + '%'));
            body.appendChild(progressWrap);
        }

        // Actions
        const actions = DOM.el('div', { className: 'entry-actions' });
        actions.appendChild(DOM.el('button', {
            className: 'btn-icon btn-sm', title: 'Edit',
            onClick: (e) => { e.stopPropagation(); EntryForm.open(entry.id); }
        }, '✎'));
        actions.appendChild(DOM.el('button', {
            className: 'btn-icon btn-sm', title: 'Duplicate',
            onClick: (e) => { e.stopPropagation(); Store.duplicateEntry(entry.id); Toast.show('Duplicated!', 'info'); }
        }, '⧉'));
        actions.appendChild(DOM.el('button', {
            className: 'btn-icon btn-sm', title: 'Delete',
            onClick: (e) => {
                e.stopPropagation();
                Store.deleteEntry(entry.id);
                Toast.showUndo('Entry removed.', () => Store.undo());
            }
        }, '🗑'));

        item.appendChild(checkbox);
        item.appendChild(body);
        item.appendChild(actions);

        item.addEventListener('click', () => EntryForm.open(entry.id));

        return item;
    },

    _esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
};
