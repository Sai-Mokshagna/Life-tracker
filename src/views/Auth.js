// ===========================================
// Auth View — Login & Sign Up pages
// ===========================================

const AuthView = {
    _container: null,
    _mode: 'login', // 'login' or 'signup'

    render(container) {
        this._container = container;
        this._mode = 'login';
        this._renderForm();
    },

    _renderForm() {
        const isLogin = this._mode === 'login';

        this._container.innerHTML = `
            <div class="auth-screen" id="auth-screen">
                <button class="auth-theme-toggle" id="auth-theme-toggle" aria-label="Toggle theme">
                    <span class="theme-icon-light">☀</span>
                    <span class="theme-icon-dark">☾</span>
                </button>

                <div class="auth-card">
                    <div class="auth-logo">
                        <span class="auth-logo-icon">◉</span>
                        <span class="auth-logo-title">Life Tracker</span>
                        <p class="auth-logo-subtitle">${isLogin ? 'Welcome back! Sign in to continue.' : 'Create your account to get started.'}</p>
                    </div>

                    <div class="auth-alert" id="auth-alert"></div>

                    <div class="auth-form-wrapper">
                        <form class="auth-form entering" id="auth-form" novalidate>
                            ${isLogin ? this._loginFields() : this._signupFields()}

                            <button type="submit" class="auth-submit" id="auth-submit">
                                ${isLogin ? 'Sign In' : 'Create Account'}
                            </button>
                        </form>

                        <div class="auth-divider">
                            <span class="auth-divider-line"></span>
                            <span class="auth-divider-text">or</span>
                            <span class="auth-divider-line"></span>
                        </div>

                        <button type="button" class="auth-google-btn" id="auth-google">
                            <svg class="auth-google-icon" viewBox="0 0 24 24" width="20" height="20">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            <span>Continue with Google</span>
                        </button>
                    </div>

                    <div class="auth-switch">
                        ${isLogin
                ? 'Don\'t have an account? <button class="auth-switch-link" id="auth-switch">Sign up</button>'
                : 'Already have an account? <button class="auth-switch-link" id="auth-switch">Sign in</button>'
            }
                    </div>
                </div>
            </div>
        `;

        this._bindEvents();
    },

    _loginFields() {
        return `
            <div class="form-group">
                <label class="form-label" for="auth-email">Email</label>
                <input type="email" id="auth-email" class="form-input" placeholder="you@example.com" required autocomplete="email" />
                <div class="auth-error-msg" id="error-email"></div>
            </div>

            <div class="form-group">
                <label class="form-label" for="auth-password">Password</label>
                <input type="password" id="auth-password" class="form-input" placeholder="Enter your password" required autocomplete="current-password" />
                <div class="auth-error-msg" id="error-password"></div>
            </div>

            <div class="auth-options-row">
                <label class="toggle-wrap">
                    <input type="checkbox" class="toggle-input" id="auth-remember" checked />
                    <span class="toggle-track"></span>
                    <span style="font-size: var(--font-sm); color: var(--text-secondary);">Remember me</span>
                </label>
            </div>
        `;
    },

    _signupFields() {
        return `
            <div class="form-group">
                <label class="form-label" for="auth-name">Full Name</label>
                <input type="text" id="auth-name" class="form-input" placeholder="John Doe" required autocomplete="name" />
                <div class="auth-error-msg" id="error-name"></div>
            </div>

            <div class="form-group">
                <label class="form-label" for="auth-email">Email</label>
                <input type="email" id="auth-email" class="form-input" placeholder="you@example.com" required autocomplete="email" />
                <div class="auth-error-msg" id="error-email"></div>
            </div>

            <div class="form-group">
                <label class="form-label" for="auth-password">Password</label>
                <input type="password" id="auth-password" class="form-input" placeholder="Create a password" required autocomplete="new-password" />
                <div class="password-strength" id="password-strength">
                    <div class="password-strength-bar"></div>
                    <div class="password-strength-bar"></div>
                    <div class="password-strength-bar"></div>
                    <div class="password-strength-bar"></div>
                </div>
                <div class="password-strength-label" id="password-strength-label"></div>
                <div class="auth-error-msg" id="error-password"></div>
            </div>

            <div class="form-group">
                <label class="form-label" for="auth-confirm">Confirm Password</label>
                <input type="password" id="auth-confirm" class="form-input" placeholder="Confirm your password" required autocomplete="new-password" />
                <div class="auth-error-msg" id="error-confirm"></div>
            </div>
        `;
    },

    _bindEvents() {
        // Form submit
        const form = document.getElementById('auth-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this._handleSubmit();
        });

        // Switch between login/signup
        document.getElementById('auth-switch').addEventListener('click', () => {
            this._switchMode();
        });

        // Theme toggle
        document.getElementById('auth-theme-toggle').addEventListener('click', () => {
            ThemeToggle.cycle();
        });

        // Google sign-in
        document.getElementById('auth-google').addEventListener('click', () => {
            this._handleGoogleSignIn();
        });

        // Password strength (signup only)
        if (this._mode === 'signup') {
            const pwInput = document.getElementById('auth-password');
            pwInput.addEventListener('input', () => {
                this._updatePasswordStrength(pwInput.value);
            });
        }

        // Clear errors on input
        this._container.querySelectorAll('.form-input').forEach(input => {
            input.addEventListener('input', () => {
                input.classList.remove('input-error');
                const errorEl = input.parentElement.querySelector('.auth-error-msg');
                if (errorEl) {
                    errorEl.classList.remove('visible');
                    errorEl.textContent = '';
                }
            });
        });
    },

    _switchMode() {
        this._mode = this._mode === 'login' ? 'signup' : 'login';
        this._renderForm();
    },

    _handleGoogleSignIn() {
        const btn = document.getElementById('auth-google');
        btn.disabled = true;
        btn.innerHTML = `
            <svg class="auth-google-icon auth-google-spinner" viewBox="0 0 24 24" width="20" height="20">
                <circle cx="12" cy="12" r="10" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="40 20" />
            </svg>
            <span>Connecting…</span>
        `;

        // Simulate Google OAuth delay
        setTimeout(() => {
            const result = Store.googleLogin();
            if (result.success) {
                this._onAuthSuccess();
            } else {
                this._showAlert(result.message, 'error');
                this._renderForm(); // Reset the button
            }
        }, 800);
    },

    _handleSubmit() {
        this._clearErrors();

        if (this._mode === 'login') {
            this._handleLogin();
        } else {
            this._handleSignup();
        }
    },

    _handleLogin() {
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value;
        let valid = true;

        if (!email) {
            this._showFieldError('email', 'Email is required');
            valid = false;
        } else if (!this._isValidEmail(email)) {
            this._showFieldError('email', 'Please enter a valid email');
            valid = false;
        }

        if (!password) {
            this._showFieldError('password', 'Password is required');
            valid = false;
        }

        if (!valid) return;

        // Attempt login
        const result = Store.login(email, password);
        if (result.success) {
            this._onAuthSuccess();
        } else {
            this._showAlert(result.message, 'error');
        }
    },

    _handleSignup() {
        const name = document.getElementById('auth-name').value.trim();
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value;
        const confirm = document.getElementById('auth-confirm').value;
        let valid = true;

        if (!name) {
            this._showFieldError('name', 'Name is required');
            valid = false;
        }

        if (!email) {
            this._showFieldError('email', 'Email is required');
            valid = false;
        } else if (!this._isValidEmail(email)) {
            this._showFieldError('email', 'Please enter a valid email');
            valid = false;
        }

        if (!password) {
            this._showFieldError('password', 'Password is required');
            valid = false;
        } else if (password.length < 6) {
            this._showFieldError('password', 'Password must be at least 6 characters');
            valid = false;
        }

        if (!confirm) {
            this._showFieldError('confirm', 'Please confirm your password');
            valid = false;
        } else if (password !== confirm) {
            this._showFieldError('confirm', 'Passwords do not match');
            valid = false;
        }

        if (!valid) return;

        // Attempt signup
        const result = Store.signup(name, email, password);
        if (result.success) {
            this._onAuthSuccess();
        } else {
            this._showAlert(result.message, 'error');
        }
    },

    _onAuthSuccess() {
        const screen = document.getElementById('auth-screen');
        screen.style.transition = 'opacity 0.35s ease';
        screen.style.opacity = '0';
        setTimeout(() => {
            App.onAuthSuccess();
        }, 350);
    },

    _showFieldError(field, msg) {
        const input = document.getElementById(`auth-${field}`);
        const errorEl = document.getElementById(`error-${field}`);
        if (input) input.classList.add('input-error');
        if (errorEl) {
            errorEl.textContent = msg;
            errorEl.classList.add('visible');
        }
    },

    _showAlert(msg, type) {
        const alert = document.getElementById('auth-alert');
        alert.textContent = msg;
        alert.className = `auth-alert visible ${type}`;
    },

    _clearErrors() {
        document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
        document.querySelectorAll('.auth-error-msg').forEach(el => {
            el.classList.remove('visible');
            el.textContent = '';
        });
        const alert = document.getElementById('auth-alert');
        if (alert) alert.className = 'auth-alert';
    },

    _isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    _updatePasswordStrength(password) {
        const bars = document.querySelectorAll('#password-strength .password-strength-bar');
        const label = document.getElementById('password-strength-label');
        let strength = 0;

        if (password.length >= 6) strength++;
        if (password.length >= 10) strength++;
        if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password) || /[^a-zA-Z0-9]/.test(password)) strength++;

        const levels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
        const classes = ['', 'weak', 'fair', 'good', 'good'];

        bars.forEach((bar, i) => {
            bar.classList.remove('active', 'weak', 'fair', 'good');
            if (i < strength) {
                bar.classList.add('active', classes[strength]);
            }
        });

        label.textContent = password.length > 0 ? levels[strength] || '' : '';
    },

    // Hide the auth screen
    hide() {
        const screen = document.getElementById('auth-screen');
        if (screen) screen.remove();
    }
};
