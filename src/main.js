// ===========================================
// Main Entry Point — Boot everything up
// ===========================================

(function () {
    'use strict';

    // Initialize the data store (loads from LocalStorage)
    Store.init();

    // Initialize UI components
    Toast.init();
    Modal.init();
    ThemeToggle.init();
    Sidebar.init();

    // Boot the app (handles routing + initial render)
    App.init();

    // Log a friendly greeting
    console.log(
        '%c☀ Life Tracker loaded',
        'color: #e07850; font-weight: bold; font-size: 14px;'
    );
})();
