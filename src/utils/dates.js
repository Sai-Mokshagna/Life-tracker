// ===========================================
// Date Utilities — Formatting, relative time, schedule helpers
// ===========================================

const DateUtils = {
    // Format a date to "Feb 18, 2026"
    formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    },

    // Format date to "Feb 18"
    formatShort(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    },

    // Format to "2026-02-18" for input[type=date]
    toInputDate(date) {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    },

    // Format to "10:30" for input[type=time]
    toInputTime(date) {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    },

    // Relative time: "2 days ago", "in 3 hours", "just now"
    relativeTime(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        const now = new Date();
        const diffMs = now - d;
        const diffMin = Math.floor(Math.abs(diffMs) / 60000);
        const diffHr = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHr / 24);
        const past = diffMs > 0;

        if (diffMin < 1) return 'just now';
        if (diffMin < 60) return past ? `${diffMin}m ago` : `in ${diffMin}m`;
        if (diffHr < 24) return past ? `${diffHr}h ago` : `in ${diffHr}h`;
        if (diffDay < 7) return past ? `${diffDay}d ago` : `in ${diffDay}d`;
        return this.formatShort(dateStr);
    },

    // Check if a date string is today
    isToday(dateStr) {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        const now = new Date();
        return d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth() &&
            d.getDate() === now.getDate();
    },

    // Check if a date is before today (overdue)
    isOverdue(dateStr) {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);
        return d < today;
    },

    // Check if a date falls within the next N days
    isWithinDays(dateStr, days) {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);
        const future = new Date(now);
        future.setDate(future.getDate() + days);
        return d >= now && d <= future;
    },

    // Get start of today
    startOfToday() {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    },

    // Get the day name (Mon, Tue, etc.)
    dayName(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { weekday: 'short' });
    },

    // Get an array of the last N dates
    lastNDays(n) {
        const days = [];
        const now = new Date();
        for (let i = n - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            days.push(d);
        }
        return days;
    },

    // Get the date key "YYYY-MM-DD" for grouping
    dateKey(date) {
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return '';
        return this.toInputDate(d);
    },

    // Check if two dates are the same day
    sameDay(d1, d2) {
        const a = new Date(d1);
        const b = new Date(d2);
        return a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate();
    },

    // Generate next occurrence based on repeat schedule
    nextOccurrence(dateStr, repeat) {
        if (!repeat || repeat === 'none') return null;
        const d = new Date(dateStr);
        switch (repeat) {
            case 'daily': d.setDate(d.getDate() + 1); break;
            case 'weekly': d.setDate(d.getDate() + 7); break;
            case 'biweekly': d.setDate(d.getDate() + 14); break;
            case 'monthly': d.setMonth(d.getMonth() + 1); break;
            default: return null;
        }
        return d.toISOString();
    }
};
