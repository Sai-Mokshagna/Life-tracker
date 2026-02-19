// ===========================================
// Dashboard View — Today's focus, upcoming, overdue, stats
// ===========================================

const DashboardView = {
  render(container) {
    DOM.clear(container);

    const today = new Date();
    const allEntries = Store.getEntries({ sort: 'dueDate' });

    // Stats
    const totalActive = allEntries.filter(e => e.status === 'pending').length;
    const completedToday = Store.getCompletedToday();
    const streak = Store.getStreak();
    const completionRate = Store.getCompletionRate(7);

    // Group entries
    const todayEntries = allEntries.filter(e =>
      e.status !== 'completed' && e.dueDate && DateUtils.isToday(e.dueDate)
    );
    const overdueEntries = allEntries.filter(e =>
      e.status !== 'completed' && e.dueDate && DateUtils.isOverdue(e.dueDate)
    );
    const upcomingEntries = allEntries.filter(e =>
      e.status !== 'completed' && e.dueDate &&
      DateUtils.isWithinDays(e.dueDate, 7) && !DateUtils.isToday(e.dueDate) && !DateUtils.isOverdue(e.dueDate)
    );
    const recentCompleted = allEntries.filter(e => e.status === 'completed').slice(0, 3);

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Stats row -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${totalActive}</div>
            <div class="stat-label">Active</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${completedToday}</div>
            <div class="stat-label">Done Today</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${streak > 0 ? '🔥 ' + streak : '—'}</div>
            <div class="stat-label">Day Streak</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${completionRate}%</div>
            <div class="stat-label">This Week</div>
          </div>
        </div>

        <!-- Overdue -->
        ${overdueEntries.length > 0 ? `
          <div class="section">
            <div class="section-header">
              <div>
                <div class="section-title" style="color: var(--danger)">Slipped Through</div>
                <div class="section-subtitle">No stress — pick these up when you're ready</div>
              </div>
              <span class="badge badge-danger">${overdueEntries.length}</span>
            </div>
            <div class="entries-list" id="dash-overdue"></div>
          </div>
        ` : ''}

        <!-- Today's focus -->
        <div class="section">
          <div class="section-header">
            <div>
              <div class="section-title">Today's Focus</div>
              <div class="section-subtitle">${DateUtils.formatDate(today)}</div>
            </div>
            <span class="badge badge-accent">${todayEntries.length}</span>
          </div>
          <div class="entries-list" id="dash-today">
            ${todayEntries.length === 0 ? `
              <div class="empty-state" style="padding: var(--sp-8);">
                <div class="empty-state-icon">☀️</div>
                <div class="empty-state-title">Nothing scheduled for today</div>
                <div class="empty-state-text">Enjoy the freedom, or add something if you'd like.</div>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Upcoming -->
        ${upcomingEntries.length > 0 ? `
          <div class="section">
            <div class="section-header">
              <div class="section-title">Coming Up This Week</div>
              <span class="badge badge-neutral">${upcomingEntries.length}</span>
            </div>
            <div class="entries-list" id="dash-upcoming"></div>
          </div>
        ` : ''}

        <!-- Recent completions -->
        ${recentCompleted.length > 0 ? `
          <div class="section">
            <div class="section-header">
              <div class="section-title">Recently Completed</div>
            </div>
            <div class="entries-list" id="dash-completed"></div>
          </div>
        ` : ''}
      </div>
    `;

    // Render entry items into their sections
    this._renderEntries(container.querySelector('#dash-overdue'), overdueEntries);
    this._renderEntries(container.querySelector('#dash-today'), todayEntries);
    this._renderEntries(container.querySelector('#dash-upcoming'), upcomingEntries);
    this._renderEntries(container.querySelector('#dash-completed'), recentCompleted);
  },

  _renderEntries(listEl, entries) {
    if (!listEl || entries.length === 0) return;

    entries.forEach((entry, i) => {
      const item = this._createEntryItem(entry);
      item.style.animationDelay = `${i * 50}ms`;
      listEl.appendChild(item);
    });
  },

  _createEntryItem(entry) {
    const cat = Store.getCategoryById(entry.category);
    const isCompleted = entry.status === 'completed';

    const item = DOM.el('div', {
      className: `entry-item ${isCompleted ? 'completed' : ''}`,
      dataset: { id: entry.id }
    });

    // Checkbox
    const checkbox = DOM.el('div', {
      className: `entry-checkbox ${isCompleted ? 'checked' : ''}`,
      onClick: (e) => {
        e.stopPropagation();
        Store.toggleComplete(entry.id);
        const wasCompleted = isCompleted;
        if (!wasCompleted) {
          Toast.show('Nice work! ✓', 'success');
        }
      }
    }, isCompleted ? '✓' : '');

    // Body
    const body = DOM.el('div', { className: 'entry-body' });

    const title = DOM.el('div', { className: 'entry-title' }, entry.title);
    body.appendChild(title);

    const meta = DOM.el('div', { className: 'entry-meta' });

    if (entry.priority && entry.priority !== 'medium') {
      meta.appendChild(DOM.el('span', { className: `priority-dot ${entry.priority}` }));
    }

    if (cat) {
      meta.appendChild(DOM.el('span', { className: 'badge badge-neutral' }, cat.name));
    }

    if (entry.dueDate) {
      const dateText = DateUtils.isToday(entry.dueDate) ? 'Today' : DateUtils.formatShort(entry.dueDate);
      const isOverdue = DateUtils.isOverdue(entry.dueDate) && !isCompleted;
      meta.appendChild(DOM.el('span', { style: isOverdue ? 'color: var(--danger)' : '' }, dateText));
    }

    if (entry.tags && entry.tags.length > 0) {
      meta.appendChild(DOM.el('span', {}, entry.tags.slice(0, 2).map(t => `#${t}`).join(' ')));
    }

    body.appendChild(meta);

    // Progress bar (if progress is set)
    if (entry.progress > 0) {
      const progressWrap = DOM.el('div', {
        style: 'display:flex; align-items:center; gap:var(--sp-2); margin-top:var(--sp-2);'
      });
      const bar = DOM.el('div', { className: 'progress-bar', style: 'flex:1;' });
      const fillClass = entry.progress >= 100 ? 'success' : entry.progress >= 50 ? '' : 'warning';
      bar.appendChild(DOM.el('div', {
        className: `progress-fill ${fillClass}`,
        style: `width:${Math.min(entry.progress, 100)}%`
      }));
      progressWrap.appendChild(bar);
      progressWrap.appendChild(DOM.el('span', {
        style: 'font-size:var(--font-xs); color:var(--text-tertiary); white-space:nowrap;'
      }, entry.progress + '%'));
      body.appendChild(progressWrap);
    }

    // Actions
    const actions = DOM.el('div', { className: 'entry-actions' });
    actions.appendChild(DOM.el('button', {
      className: 'btn-icon btn-sm',
      title: 'Edit',
      onClick: (e) => { e.stopPropagation(); EntryForm.open(entry.id); }
    }, '✎'));
    actions.appendChild(DOM.el('button', {
      className: 'btn-icon btn-sm',
      title: 'Delete',
      onClick: (e) => {
        e.stopPropagation();
        const removed = Store.deleteEntry(entry.id);
        if (removed) {
          Toast.showUndo('Entry removed.', () => Store.undo());
        }
      }
    }, '🗑'));

    item.appendChild(checkbox);
    item.appendChild(body);
    item.appendChild(actions);

    // Click to edit
    item.addEventListener('click', () => EntryForm.open(entry.id));

    return item;
  }
};
