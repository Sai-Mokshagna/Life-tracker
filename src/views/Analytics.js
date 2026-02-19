// ===========================================
// Analytics View — Charts, streaks, insights
// Uses inline canvas drawing (no Chart.js dependency needed)
// ===========================================

const AnalyticsView = {
    render(container) {
        DOM.clear(container);

        const allEntries = Store.getEntries({ status: 'all' });
        const streak = Store.getStreak();
        const completionRate7 = Store.getCompletionRate(7);
        const completionRate30 = Store.getCompletionRate(30);
        const totalCompleted = allEntries.filter(e => e.status === 'completed').length;
        const totalEntries = allEntries.length;

        // Get completions by day for last 30 days
        const last30 = DateUtils.lastNDays(30);
        const completionsByDay = last30.map(day => {
            const dateKey = DateUtils.dateKey(day);
            return allEntries.filter(e =>
                e.status === 'completed' && e.completedAt && DateUtils.dateKey(e.completedAt) === dateKey
            ).length;
        });

        // Category breakdown
        const categories = Store.getCategories();
        const catCounts = categories.map(cat => ({
            name: cat.name,
            color: cat.color,
            count: allEntries.filter(e => e.category === cat.id).length
        })).filter(c => c.count > 0);

        // Most productive day of week
        const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
        allEntries.filter(e => e.status === 'completed' && e.completedAt).forEach(e => {
            const day = new Date(e.completedAt).getDay();
            dayOfWeekCounts[day]++;
        });
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const bestDayIdx = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts));
        const bestDay = dayOfWeekCounts[bestDayIdx] > 0 ? dayNames[bestDayIdx] : null;

        container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Overview stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${totalCompleted}</div>
            <div class="stat-label">Total Completed</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${streak > 0 ? '🔥 ' + streak : '—'}</div>
            <div class="stat-label">Current Streak</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${completionRate7}%</div>
            <div class="stat-label">7-Day Rate</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${completionRate30}%</div>
            <div class="stat-label">30-Day Rate</div>
          </div>
        </div>

        ${totalEntries === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">📊</div>
            <div class="empty-state-title">Not enough data yet</div>
            <div class="empty-state-text">Start adding entries and completing them to see your patterns and progress here.</div>
          </div>
        ` : `
          <div class="charts-grid">
            <!-- Completion trend -->
            <div class="chart-wrap">
              <div class="card-title" style="margin-bottom: var(--sp-4)">Completions — Last 30 Days</div>
              <canvas id="chart-completions" height="200"></canvas>
            </div>

            <!-- Category breakdown -->
            <div class="chart-wrap">
              <div class="card-title" style="margin-bottom: var(--sp-4)">By Category</div>
              <div id="chart-categories"></div>
            </div>

            <!-- Day of week -->
            <div class="chart-wrap">
              <div class="card-title" style="margin-bottom: var(--sp-4)">Activity by Day of Week</div>
              <canvas id="chart-weekdays" height="180"></canvas>
            </div>

            <!-- Insights -->
            <div class="chart-wrap">
              <div class="card-title" style="margin-bottom: var(--sp-4)">Insights</div>
              <div id="insights-list" style="font-size: var(--font-sm); color: var(--text-secondary);"></div>
            </div>
          </div>
        `}
      </div>
    `;

        if (totalEntries > 0) {
            // Draw charts after DOM is ready
            requestAnimationFrame(() => {
                this._drawCompletionChart(completionsByDay, last30);
                this._drawCategoryBreakdown(catCounts);
                this._drawWeekdayChart(dayOfWeekCounts, dayNames);
                this._renderInsights(bestDay, streak, completionRate7, totalCompleted, totalEntries);
            });
        }
    },

    _drawCompletionChart(data, days) {
        const canvas = document.getElementById('chart-completions');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const w = rect.width;
        const h = rect.height;
        const padding = { top: 20, right: 20, bottom: 30, left: 35 };
        const chartW = w - padding.left - padding.right;
        const chartH = h - padding.top - padding.bottom;

        const max = Math.max(...data, 1);

        // Get theme colors
        const style = getComputedStyle(document.documentElement);
        const accentColor = style.getPropertyValue('--accent').trim();
        const borderColor = style.getPropertyValue('--border-light').trim();
        const textColor = style.getPropertyValue('--text-tertiary').trim();

        ctx.clearRect(0, 0, w, h);

        // Grid lines
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartH / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(w - padding.right, y);
            ctx.stroke();
        }

        // Y axis labels
        ctx.font = '11px Inter, sans-serif';
        ctx.fillStyle = textColor;
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const val = Math.round(max - (max / 4) * i);
            const y = padding.top + (chartH / 4) * i;
            ctx.fillText(val, padding.left - 8, y + 4);
        }

        // Draw the area + line
        const stepX = chartW / (data.length - 1 || 1);

        // Area fill
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top + chartH);
        data.forEach((val, i) => {
            const x = padding.left + stepX * i;
            const y = padding.top + chartH - (val / max) * chartH;
            if (i === 0) ctx.lineTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.lineTo(padding.left + stepX * (data.length - 1), padding.top + chartH);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(0, padding.top, 0, h);
        // Parse accent color to add transparency
        gradient.addColorStop(0, accentColor + '33');
        gradient.addColorStop(1, accentColor + '05');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Line
        ctx.beginPath();
        data.forEach((val, i) => {
            const x = padding.left + stepX * i;
            const y = padding.top + chartH - (val / max) * chartH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Dots on non-zero values
        data.forEach((val, i) => {
            if (val > 0) {
                const x = padding.left + stepX * i;
                const y = padding.top + chartH - (val / max) * chartH;
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fillStyle = accentColor;
                ctx.fill();
            }
        });

        // X axis labels (every 7th day)
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.font = '10px Inter, sans-serif';
        days.forEach((day, i) => {
            if (i % 7 === 0 || i === days.length - 1) {
                const x = padding.left + stepX * i;
                ctx.fillText(DateUtils.formatShort(day), x, h - 5);
            }
        });
    },

    _drawCategoryBreakdown(catCounts) {
        const container = document.getElementById('chart-categories');
        if (!container || catCounts.length === 0) {
            if (container) container.innerHTML = '<div style="color:var(--text-tertiary); font-size:var(--font-sm);">No categorized entries yet.</div>';
            return;
        }

        const total = catCounts.reduce((sum, c) => sum + c.count, 0);

        catCounts.sort((a, b) => b.count - a.count);

        catCounts.forEach(cat => {
            const pct = Math.round((cat.count / total) * 100);
            const row = DOM.el('div', {
                style: 'margin-bottom: 12px;'
            });

            const label = DOM.el('div', {
                style: 'display:flex; justify-content:space-between; font-size:var(--font-sm); margin-bottom:4px;'
            },
                DOM.el('span', { style: 'display:flex; align-items:center; gap:6px;' },
                    DOM.el('span', { className: 'color-dot', style: `background:${cat.color}` }),
                    cat.name
                ),
                DOM.el('span', { style: 'color:var(--text-tertiary)' }, `${cat.count} (${pct}%)`)
            );

            const bar = DOM.el('div', { className: 'progress-bar' },
                DOM.el('div', { className: 'progress-fill', style: `width:${pct}%; background:${cat.color}` })
            );

            row.appendChild(label);
            row.appendChild(bar);
            container.appendChild(row);
        });
    },

    _drawWeekdayChart(counts, names) {
        const canvas = document.getElementById('chart-weekdays');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const w = rect.width;
        const h = rect.height;
        const padding = { top: 10, right: 20, bottom: 30, left: 20 };
        const chartW = w - padding.left - padding.right;
        const chartH = h - padding.top - padding.bottom;

        const max = Math.max(...counts, 1);
        const barWidth = (chartW / 7) * 0.6;
        const barGap = chartW / 7;

        const style = getComputedStyle(document.documentElement);
        const accentColor = style.getPropertyValue('--accent').trim();
        const mutedColor = style.getPropertyValue('--bg-inset').trim();
        const textColor = style.getPropertyValue('--text-tertiary').trim();

        ctx.clearRect(0, 0, w, h);

        counts.forEach((count, i) => {
            const x = padding.left + barGap * i + (barGap - barWidth) / 2;
            const barH = (count / max) * chartH;
            const y = padding.top + chartH - barH;

            // Background bar
            ctx.fillStyle = mutedColor;
            ctx.beginPath();
            this._roundedRect(ctx, x, padding.top, barWidth, chartH, 4);
            ctx.fill();

            // Value bar
            if (count > 0) {
                ctx.fillStyle = accentColor;
                ctx.beginPath();
                this._roundedRect(ctx, x, y, barWidth, barH, 4);
                ctx.fill();
            }

            // Label
            ctx.fillStyle = textColor;
            ctx.textAlign = 'center';
            ctx.font = '11px Inter, sans-serif';
            ctx.fillText(names[i], x + barWidth / 2, h - 8);

            // Count on top
            if (count > 0) {
                ctx.fillStyle = accentColor;
                ctx.font = '11px Inter, sans-serif';
                ctx.fillText(count, x + barWidth / 2, y - 5);
            }
        });
    },

    _roundedRect(ctx, x, y, w, h, r) {
        if (h < r * 2) r = h / 2;
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
    },

    _renderInsights(bestDay, streak, rate, completed, total) {
        const el = document.getElementById('insights-list');
        if (!el) return;

        const insights = [];

        if (bestDay) {
            insights.push(`📅 Your most productive day is <strong>${bestDay}</strong>.`);
        }

        if (streak >= 3) {
            insights.push(`🔥 You're on a <strong>${streak}-day streak</strong> — keep the momentum going!`);
        } else if (streak === 0 && completed > 0) {
            insights.push(`💡 No streak running right now. Complete something today to start one.`);
        }

        if (rate >= 80) {
            insights.push(`🌟 A <strong>${rate}%</strong> completion rate this week — that's really solid.`);
        } else if (rate >= 50) {
            insights.push(`📊 You're completing about <strong>${rate}%</strong> of your entries this week.`);
        } else if (rate > 0) {
            insights.push(`📊 Your completion rate is <strong>${rate}%</strong> this week. Small steps count!`);
        }

        if (total > 0 && completed === 0) {
            insights.push(`🌱 You've got ${total} entries tracked. Time to tackle the first one!`);
        } else if (completed > 10) {
            insights.push(`✅ You've completed <strong>${completed} entries</strong> total — nice progress.`);
        }

        if (insights.length === 0) {
            insights.push('Start tracking and completing entries to see personalized insights here.');
        }

        el.innerHTML = insights.map(i => `<p style="margin-bottom: var(--sp-3); line-height: 1.6;">${i}</p>`).join('');
    }
};
