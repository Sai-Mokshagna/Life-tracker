// ===========================================
// Sidebar — Navigation and tracker list
// ===========================================

const Sidebar = {
    _el: null,
    _overlay: null,
    _trackerList: null,

    init() {
        this._el = document.getElementById('sidebar');
        this._overlay = document.getElementById('sidebar-overlay');
        this._trackerList = document.getElementById('tracker-nav-list');

        // Mobile menu toggle
        document.getElementById('menu-toggle').addEventListener('click', () => this.open());
        document.getElementById('sidebar-close').addEventListener('click', () => this.close());
        this._overlay.addEventListener('click', () => this.close());

        // Navigation clicks
        DOM.qsa('.nav-item', this._el).forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                if (view) {
                    App.navigate(view);
                    this.close();
                }
            });
        });

        // Render custom tracker nav items
        this.renderTrackerNav();
        Store.on('change', () => this.renderTrackerNav());
    },

    renderTrackerNav() {
        if (!this._trackerList) return;
        DOM.clear(this._trackerList);

        const trackers = Store.getTrackers();
        trackers.forEach(tracker => {
            const item = DOM.el('a', {
                href: `#tracker-${tracker.id}`,
                className: 'nav-item',
                dataset: { view: `tracker-${tracker.id}` }
            },
                DOM.el('span', { className: 'nav-icon' }, tracker.icon || '◉'),
                DOM.el('span', { className: 'nav-label' }, tracker.name)
            );

            item.addEventListener('click', (e) => {
                e.preventDefault();
                App.navigate(`tracker-${tracker.id}`);
                this.close();
            });

            this._trackerList.appendChild(item);
        });
    },

    updateActive(viewId) {
        DOM.qsa('.nav-item', this._el).forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewId);
        });
    },

    open() {
        this._el.classList.add('open');
        this._overlay.classList.add('visible');
    },

    close() {
        this._el.classList.remove('open');
        this._overlay.classList.remove('visible');
    }
};
