// ===========================================
// Data Models — Shape definitions and factory functions
// ===========================================

const Models = {
    // Default categories that come with the app
    defaultCategories() {
        return [
            { id: 'cat_tasks', name: 'Tasks', color: '#5a9ae6', icon: '✓' },
            { id: 'cat_habits', name: 'Habits', color: '#6bb87d', icon: '↻' },
            { id: 'cat_goals', name: 'Goals', color: '#d4a54a', icon: '★' },
            { id: 'cat_expenses', name: 'Expenses', color: '#d06a5c', icon: '$' },
            { id: 'cat_study', name: 'Study', color: '#9a7bd4', icon: '📖' },
        ];
    },

    // Default trackers
    defaultTrackers() {
        return [
            { id: 'trk_tasks', name: 'Tasks', categoryId: 'cat_tasks', icon: '✓' },
            { id: 'trk_habits', name: 'Habits', categoryId: 'cat_habits', icon: '↻' },
            { id: 'trk_goals', name: 'Goals', categoryId: 'cat_goals', icon: '★' },
        ];
    },

    // Create a new entry with all possible fields
    createEntry(overrides = {}) {
        return {
            id: DOM.uid(),
            title: '',
            description: '',
            category: '',
            trackerId: '',
            date: new Date().toISOString(),
            dueDate: '',
            status: 'pending',       // pending | completed | skipped | archived
            priority: 'medium',      // low | medium | high
            tags: [],
            repeat: 'none',          // none | daily | weekly | biweekly | monthly
            progress: 0,             // 0-100
            mood: 3,                 // 1-5
            links: '',               // free text for references
            completedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            order: Date.now(),
            ...overrides
        };
    },

    // Create a new category
    createCategory(overrides = {}) {
        return {
            id: 'cat_' + DOM.uid(),
            name: 'New Category',
            color: '#8a8480',
            icon: '•',
            ...overrides
        };
    },

    // Create a new custom tracker
    createTracker(overrides = {}) {
        return {
            id: 'trk_' + DOM.uid(),
            name: 'New Tracker',
            categoryId: '',
            icon: '◉',
            ...overrides
        };
    },

    // Statuses human-readable
    statusLabels: {
        pending: 'Pending',
        completed: 'Completed',
        skipped: 'Skipped',
        archived: 'Archived'
    },

    priorityLabels: {
        low: 'Low',
        medium: 'Medium',
        high: 'High'
    },

    repeatLabels: {
        none: 'No repeat',
        daily: 'Daily',
        weekly: 'Weekly',
        biweekly: 'Every 2 weeks',
        monthly: 'Monthly'
    },

    moodEmojis: ['😫', '😕', '😐', '🙂', '😊']
};
