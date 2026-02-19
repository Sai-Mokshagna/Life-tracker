// ===========================================
// Search Utility — Real-time fuzzy-ish keyword matching
// ===========================================

const SearchUtils = {
    // Search entries by keyword across title, description, and tags
    filterByQuery(entries, query) {
        if (!query || !query.trim()) return entries;

        const terms = query.toLowerCase().trim().split(/\s+/);

        return entries.filter(entry => {
            const searchable = [
                entry.title || '',
                entry.description || '',
                (entry.tags || []).join(' '),
                entry.category || ''
            ].join(' ').toLowerCase();

            // Every search term must appear somewhere in the searchable text
            return terms.every(term => searchable.includes(term));
        });
    },

    // Highlight matching text (returns HTML string)
    highlight(text, query) {
        if (!query || !text) return text;
        const terms = query.trim().split(/\s+/).filter(Boolean);
        let result = text;
        for (const term of terms) {
            const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            result = result.replace(regex, '<mark>$1</mark>');
        }
        return result;
    }
};
