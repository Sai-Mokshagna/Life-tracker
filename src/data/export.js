// ===========================================
// Export / Import — JSON and CSV support
// ===========================================

const DataExport = {
    // Export all data as JSON file download
    exportJSON() {
        const data = Store.getAllData();
        const json = JSON.stringify(data, null, 2);
        this._download(json, 'life-tracker-backup.json', 'application/json');
    },

    // Export entries as CSV
    exportCSV() {
        const entries = Store.getEntries({ status: 'all' });
        if (entries.length === 0) {
            Toast.show('Nothing to export yet — add some entries first.', 'info');
            return;
        }

        const headers = [
            'Title', 'Description', 'Category', 'Due Date', 'Status',
            'Priority', 'Tags', 'Repeat', 'Progress', 'Mood',
            'Created', 'Completed'
        ];

        const rows = entries.map(e => {
            const cat = Store.getCategoryById(e.category);
            return [
                this._csvEscape(e.title),
                this._csvEscape(e.description),
                this._csvEscape(cat ? cat.name : ''),
                e.dueDate ? DateUtils.formatDate(e.dueDate) : '',
                e.status,
                e.priority,
                (e.tags || []).join('; '),
                e.repeat || 'none',
                e.progress || 0,
                e.mood || 3,
                DateUtils.formatDate(e.createdAt),
                e.completedAt ? DateUtils.formatDate(e.completedAt) : ''
            ];
        });

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        this._download(csv, 'life-tracker-entries.csv', 'text/csv');
    },

    // Import from JSON file
    importJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (!data || typeof data !== 'object') {
                        reject(new Error('That doesn\'t look like a valid backup file.'));
                        return;
                    }
                    // Basic validation
                    if (data.entries && !Array.isArray(data.entries)) {
                        reject(new Error('The entries data doesn\'t look right. Make sure you\'re using a Life Tracker backup file.'));
                        return;
                    }
                    Store.importData(data);
                    resolve({
                        entries: (data.entries || []).length,
                        categories: (data.categories || []).length,
                        trackers: (data.trackers || []).length
                    });
                } catch (err) {
                    reject(new Error('Couldn\'t read that file — it might be corrupted or in the wrong format.'));
                }
            };
            reader.onerror = () => reject(new Error('Something went wrong reading the file. Want to try again?'));
            reader.readAsText(file);
        });
    },

    _csvEscape(str) {
        if (!str) return '';
        str = String(str);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    },

    _download(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Toast.show('Download started — check your Downloads folder.', 'success');
    }
};
