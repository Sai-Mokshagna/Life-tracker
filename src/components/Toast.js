// ===========================================
// Toast — Non-intrusive notification system
// ===========================================

const Toast = {
    _container: null,

    init() {
        this._container = document.getElementById('toast-container');
    },

    // Show a toast message with optional action
    // type: 'info' | 'success' | 'error' | 'undo'
    show(message, type = 'info', action = null) {
        if (!this._container) this.init();

        const toast = DOM.el('div', { className: 'toast' });

        const msgSpan = DOM.el('span', {}, message);
        toast.appendChild(msgSpan);

        if (action) {
            const actionBtn = DOM.el('button', {
                className: 'toast-action',
                onClick: () => {
                    action.handler();
                    toast.remove();
                }
            }, action.label);
            toast.appendChild(actionBtn);
        }

        const dismiss = DOM.el('button', {
            className: 'toast-dismiss',
            onClick: () => toast.remove()
        }, '✕');
        toast.appendChild(dismiss);

        this._container.appendChild(toast);

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(8px)';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    },

    // Convenience method for undo toasts
    showUndo(message, undoCallback) {
        this.show(message, 'undo', {
            label: 'Undo',
            handler: undoCallback
        });
    }
};
