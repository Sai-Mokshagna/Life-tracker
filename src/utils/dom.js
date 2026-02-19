// ===========================================
// DOM Helpers — Tiny utilities for cleaner component code
// ===========================================

const DOM = {
    // Create an element with optional attributes and children
    el(tag, attrs = {}, ...children) {
        const element = document.createElement(tag);

        for (const [key, value] of Object.entries(attrs)) {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key.startsWith('on') && typeof value === 'function') {
                const event = key.slice(2).toLowerCase();
                element.addEventListener(event, value);
            } else if (key === 'dataset' && typeof value === 'object') {
                for (const [dk, dv] of Object.entries(value)) {
                    element.dataset[dk] = dv;
                }
            } else if (key === 'htmlFor') {
                element.setAttribute('for', value);
            } else if (value !== undefined && value !== null && value !== false) {
                element.setAttribute(key, value);
            }
        }

        for (const child of children) {
            if (child == null || child === false) continue;
            if (typeof child === 'string' || typeof child === 'number') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            } else if (Array.isArray(child)) {
                child.forEach(c => {
                    if (c instanceof Node) element.appendChild(c);
                    else if (c != null) element.appendChild(document.createTextNode(String(c)));
                });
            }
        }

        return element;
    },

    // Query shorthand
    qs(selector, parent = document) {
        return parent.querySelector(selector);
    },

    qsa(selector, parent = document) {
        return Array.from(parent.querySelectorAll(selector));
    },

    // Set innerHTML safely (for trusted content only)
    html(element, htmlString) {
        element.innerHTML = htmlString;
        return element;
    },

    // Clear all children
    clear(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
        return element;
    },

    // Simple event listener
    on(element, event, handler, options) {
        element.addEventListener(event, handler, options);
        return () => element.removeEventListener(event, handler, options);
    },

    // Show / hide
    show(el) { el.hidden = false; },
    hide(el) { el.hidden = true; },

    // Generate a unique ID
    uid() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }
};
