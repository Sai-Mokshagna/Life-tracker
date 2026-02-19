// ===========================================
// Store — Central data management with LocalStorage persistence
// ===========================================

const Store = {
    _data: {
        entries: [],
        categories: [],
        trackers: [],
        settings: {
            theme: 'light'
        }
    },
    _undoStack: [],
    _listeners: {},
    _storageKey: 'lifeTracker_data',
    _maxUndo: 20,

    // Initialize: load from LocalStorage or set defaults
    init() {
        const saved = localStorage.getItem(this._storageKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this._data = {
                    entries: parsed.entries || [],
                    categories: parsed.categories || Models.defaultCategories(),
                    trackers: parsed.trackers || Models.defaultTrackers(),
                    settings: parsed.settings || { theme: 'light' }
                };
            } catch (e) {
                console.warn('Could not parse saved data, starting fresh:', e);
                this._loadDefaults();
            }
        } else {
            this._loadDefaults();
        }
    },

    _loadDefaults() {
        this._data.categories = Models.defaultCategories();
        this._data.trackers = Models.defaultTrackers();
        this._data.entries = [];
        this._data.settings = { theme: 'light' };
        this._save();
    },

    // Persist to LocalStorage
    _save() {
        try {
            localStorage.setItem(this._storageKey, JSON.stringify(this._data));
        } catch (e) {
            console.error('Failed to save data:', e);
        }
    },

    // Push to undo stack before a destructive action
    _pushUndo(action, data) {
        this._undoStack.push({ action, data, timestamp: Date.now() });
        if (this._undoStack.length > this._maxUndo) {
            this._undoStack.shift();
        }
    },

    // Undo the last action
    undo() {
        const last = this._undoStack.pop();
        if (!last) return null;

        switch (last.action) {
            case 'deleteEntry':
                this._data.entries.push(last.data);
                break;
            case 'updateEntry':
                const idx = this._data.entries.findIndex(e => e.id === last.data.id);
                if (idx !== -1) this._data.entries[idx] = last.data;
                break;
            case 'bulkDelete':
                this._data.entries.push(...last.data);
                break;
            case 'bulkUpdate':
                for (const entry of last.data) {
                    const i = this._data.entries.findIndex(e => e.id === entry.id);
                    if (i !== -1) this._data.entries[i] = entry;
                }
                break;
        }

        this._save();
        this.emit('change');
        return last;
    },

    // --- Event emitter ---
    on(event, callback) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(callback);
        return () => {
            this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
        };
    },

    emit(event, data) {
        (this._listeners[event] || []).forEach(cb => cb(data));
    },

    // --- Entries CRUD ---
    getEntries(filters = {}) {
        let entries = [...this._data.entries];

        // Filter out archived unless specifically requested
        if (filters.status !== 'archived') {
            entries = entries.filter(e => e.status !== 'archived');
        }
        if (filters.status && filters.status !== 'all') {
            entries = entries.filter(e => e.status === filters.status);
        }
        if (filters.category) {
            entries = entries.filter(e => e.category === filters.category);
        }
        if (filters.trackerId) {
            entries = entries.filter(e => e.trackerId === filters.trackerId);
        }
        if (filters.priority) {
            entries = entries.filter(e => e.priority === filters.priority);
        }
        if (filters.tag) {
            entries = entries.filter(e => e.tags && e.tags.includes(filters.tag));
        }
        if (filters.dateFrom) {
            const from = new Date(filters.dateFrom);
            from.setHours(0, 0, 0, 0);
            entries = entries.filter(e => new Date(e.dueDate || e.date) >= from);
        }
        if (filters.dateTo) {
            const to = new Date(filters.dateTo);
            to.setHours(23, 59, 59, 999);
            entries = entries.filter(e => new Date(e.dueDate || e.date) <= to);
        }
        if (filters.query) {
            entries = SearchUtils.filterByQuery(entries, filters.query);
        }

        // Sorting
        const sort = filters.sort || 'newest';
        switch (sort) {
            case 'newest':
                entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'oldest':
                entries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'priority': {
                const p = { high: 0, medium: 1, low: 2 };
                entries.sort((a, b) => (p[a.priority] ?? 1) - (p[b.priority] ?? 1));
                break;
            }
            case 'dueDate':
                entries.sort((a, b) => {
                    const da = a.dueDate || a.date;
                    const db = b.dueDate || b.date;
                    return new Date(da) - new Date(db);
                });
                break;
            case 'status': {
                const s = { pending: 0, completed: 1, skipped: 2, archived: 3 };
                entries.sort((a, b) => (s[a.status] ?? 0) - (s[b.status] ?? 0));
                break;
            }
            case 'custom':
                entries.sort((a, b) => (a.order || 0) - (b.order || 0));
                break;
        }

        return entries;
    },

    getEntry(id) {
        return this._data.entries.find(e => e.id === id) || null;
    },

    addEntry(entryData) {
        const entry = Models.createEntry(entryData);
        this._data.entries.push(entry);
        this._save();
        this.emit('change');
        return entry;
    },

    updateEntry(id, updates) {
        const idx = this._data.entries.findIndex(e => e.id === id);
        if (idx === -1) return null;

        const old = { ...this._data.entries[idx] };
        this._pushUndo('updateEntry', old);

        this._data.entries[idx] = {
            ...this._data.entries[idx],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this._save();
        this.emit('change');
        return this._data.entries[idx];
    },

    toggleComplete(id) {
        const entry = this.getEntry(id);
        if (!entry) return null;

        const isCompleted = entry.status === 'completed';
        return this.updateEntry(id, {
            status: isCompleted ? 'pending' : 'completed',
            completedAt: isCompleted ? null : new Date().toISOString()
        });
    },

    deleteEntry(id) {
        const idx = this._data.entries.findIndex(e => e.id === id);
        if (idx === -1) return false;

        const removed = this._data.entries.splice(idx, 1)[0];
        this._pushUndo('deleteEntry', removed);
        this._save();
        this.emit('change');
        return removed;
    },

    duplicateEntry(id) {
        const entry = this.getEntry(id);
        if (!entry) return null;

        const duplicate = Models.createEntry({
            ...entry,
            id: undefined,
            title: entry.title + ' (copy)',
            status: 'pending',
            completedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        this._data.entries.push(duplicate);
        this._save();
        this.emit('change');
        return duplicate;
    },

    // Bulk operations
    bulkUpdateStatus(ids, status) {
        const oldEntries = [];
        for (const id of ids) {
            const idx = this._data.entries.findIndex(e => e.id === id);
            if (idx !== -1) {
                oldEntries.push({ ...this._data.entries[idx] });
                this._data.entries[idx].status = status;
                this._data.entries[idx].updatedAt = new Date().toISOString();
                if (status === 'completed') {
                    this._data.entries[idx].completedAt = new Date().toISOString();
                }
            }
        }
        if (oldEntries.length) {
            this._pushUndo('bulkUpdate', oldEntries);
            this._save();
            this.emit('change');
        }
        return oldEntries.length;
    },

    bulkDelete(ids) {
        const removed = [];
        for (const id of ids) {
            const idx = this._data.entries.findIndex(e => e.id === id);
            if (idx !== -1) {
                removed.push(this._data.entries.splice(idx, 1)[0]);
            }
        }
        if (removed.length) {
            this._pushUndo('bulkDelete', removed);
            this._save();
            this.emit('change');
        }
        return removed.length;
    },

    // --- Categories ---
    getCategories() {
        return [...this._data.categories];
    },

    getCategoryById(id) {
        return this._data.categories.find(c => c.id === id) || null;
    },

    getCategoryByName(name) {
        return this._data.categories.find(c => c.name.toLowerCase() === name.toLowerCase()) || null;
    },

    addCategory(data) {
        const cat = Models.createCategory(data);
        this._data.categories.push(cat);
        this._save();
        this.emit('change');
        return cat;
    },

    updateCategory(id, updates) {
        const cat = this._data.categories.find(c => c.id === id);
        if (cat) {
            Object.assign(cat, updates);
            this._save();
            this.emit('change');
        }
        return cat;
    },

    deleteCategory(id) {
        this._data.categories = this._data.categories.filter(c => c.id !== id);
        // Remove category from entries that reference it
        this._data.entries.forEach(e => {
            if (e.category === id) e.category = '';
        });
        this._save();
        this.emit('change');
    },

    // --- Trackers ---
    getTrackers() {
        return [...this._data.trackers];
    },

    getTracker(id) {
        return this._data.trackers.find(t => t.id === id) || null;
    },

    addTracker(data) {
        const tracker = Models.createTracker(data);
        this._data.trackers.push(tracker);
        this._save();
        this.emit('change');
        return tracker;
    },

    updateTracker(id, updates) {
        const tracker = this._data.trackers.find(t => t.id === id);
        if (tracker) {
            Object.assign(tracker, updates);
            this._save();
            this.emit('change');
        }
        return tracker;
    },

    deleteTracker(id) {
        this._data.trackers = this._data.trackers.filter(t => t.id !== id);
        this._data.entries.forEach(e => {
            if (e.trackerId === id) e.trackerId = '';
        });
        this._save();
        this.emit('change');
    },

    // --- Settings ---
    getSetting(key) {
        return this._data.settings[key];
    },

    setSetting(key, value) {
        this._data.settings[key] = value;
        this._save();
        this.emit('settingsChange', { key, value });
    },

    // --- Analytics helpers ---
    getCompletedToday() {
        return this._data.entries.filter(e =>
            e.status === 'completed' && e.completedAt && DateUtils.isToday(e.completedAt)
        ).length;
    },

    getStreak() {
        // Calculate the current streak: consecutive days with at least one completion
        const completions = this._data.entries
            .filter(e => e.status === 'completed' && e.completedAt)
            .map(e => DateUtils.dateKey(e.completedAt))
            .filter(Boolean);

        const uniqueDays = [...new Set(completions)].sort().reverse();
        if (uniqueDays.length === 0) return 0;

        let streak = 0;
        const today = DateUtils.dateKey(new Date());
        const yesterday = DateUtils.dateKey(new Date(Date.now() - 86400000));

        // Start counting only if there's a completion today or yesterday
        if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;

        let checkDate = new Date(uniqueDays[0]);
        for (const dayKey of uniqueDays) {
            if (DateUtils.dateKey(checkDate) === dayKey) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    },

    getCompletionRate(days = 7) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        since.setHours(0, 0, 0, 0);

        const relevant = this._data.entries.filter(e => new Date(e.createdAt) >= since);
        if (relevant.length === 0) return 0;

        const completed = relevant.filter(e => e.status === 'completed').length;
        return Math.round((completed / relevant.length) * 100);
    },

    // Get all data for export
    getAllData() {
        return JSON.parse(JSON.stringify(this._data));
    },

    // Import data
    importData(data) {
        if (data.entries) this._data.entries = data.entries;
        if (data.categories) this._data.categories = data.categories;
        if (data.trackers) this._data.trackers = data.trackers;
        if (data.settings) this._data.settings = { ...this._data.settings, ...data.settings };
        this._save();
        this.emit('change');
    },

    // Clear all data
    clearAll() {
        this._pushUndo('bulkDelete', [...this._data.entries]);
        this._data.entries = [];
        this._save();
        this.emit('change');
    }
};
