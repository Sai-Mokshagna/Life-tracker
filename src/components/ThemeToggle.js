// ===========================================
// Theme Toggle — Light/dark mode switching
// ===========================================

const ThemeToggle = {
    init() {
        const saved = Store.getSetting('theme') || 'light';
        this.applyTheme(saved);

        const btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.addEventListener('click', () => this.toggle());
        }
    },

    toggle() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        this.applyTheme(next);
        Store.setSetting('theme', next);
    },

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }
};
