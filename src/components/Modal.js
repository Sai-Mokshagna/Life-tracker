// ===========================================
// Modal — Reusable modal with keyboard dismiss and focus trapping
// ===========================================

const Modal = {
    _overlay: null,
    _body: null,
    _onClose: null,
    _previousFocus: null,

    init() {
        this._overlay = document.getElementById('modal-overlay');
        this._body = document.getElementById('modal-body');

        // Click backdrop to close
        this._overlay.addEventListener('click', (e) => {
            if (e.target === this._overlay) this.close();
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this._overlay.hidden) {
                this.close();
            }
        });
    },

    // Open a modal with custom content
    // contentFn receives the body element and should populate it
    open(contentFn, onClose) {
        if (!this._overlay) this.init();

        this._previousFocus = document.activeElement;
        this._onClose = onClose || null;

        DOM.clear(this._body);
        contentFn(this._body);

        this._overlay.hidden = false;
        document.body.style.overflow = 'hidden';

        // Focus the first focusable element
        requestAnimationFrame(() => {
            const firstInput = this._body.querySelector('input, textarea, select, button');
            if (firstInput) firstInput.focus();
        });
    },

    close() {
        if (!this._overlay) return;
        this._overlay.hidden = true;
        document.body.style.overflow = '';

        if (this._onClose) this._onClose();
        if (this._previousFocus) this._previousFocus.focus();
    },

    isOpen() {
        return this._overlay && !this._overlay.hidden;
    }
};
