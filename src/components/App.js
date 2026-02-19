// ===========================================
// App — Root controller, routing, global event wiring
// ===========================================

const App = {
    _container: null,
    _currentView: 'dashboard',

    init() {
        this._container = document.getElementById('view-container');

        // Quick add button
        document.getElementById('quick-add-btn').addEventListener('click', () => {
            EntryForm.open();
        });

        // Listen for data changes to re-render current view
        Store.on('change', () => this._renderCurrentView());

        // Handle hash-based routing
        window.addEventListener('hashchange', () => this._onHashChange());

        // Initial route
        this._onHashChange();
    },

    navigate(viewId) {
        window.location.hash = viewId;
    },

    _onHashChange() {
        const hash = window.location.hash.slice(1) || 'dashboard';
        this._currentView = hash;

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            entries: 'All Entries',
            analytics: 'Analytics',
            settings: 'Settings'
        };

        let pageTitle = titles[hash];
        if (!pageTitle && hash.startsWith('tracker-')) {
            const trackerId = hash.replace('tracker-', '');
            const tracker = Store.getTracker(trackerId);
            pageTitle = tracker ? tracker.name : 'Tracker';
        }

        document.getElementById('page-title').textContent = pageTitle || 'Life Tracker';

        // Update sidebar active state
        Sidebar.updateActive(hash);

        // Render the view
        this._renderCurrentView();
    },

    _renderCurrentView() {
        const hash = this._currentView;

        switch (hash) {
            case 'dashboard':
                DashboardView.render(this._container);
                break;
            case 'entries':
                EntriesListView.render(this._container);
                break;
            case 'analytics':
                AnalyticsView.render(this._container);
                break;
            case 'settings':
                SettingsView.render(this._container);
                break;
            default:
                if (hash.startsWith('tracker-')) {
                    const trackerId = hash.replace('tracker-', '');
                    EntriesListView.render(this._container, trackerId);
                } else {
                    DashboardView.render(this._container);
                }
        }
    }
};
