// ===========================================
// Entry Form — Create / edit entry modal with all fields
// ===========================================

const EntryForm = {
    // Open the entry form modal
    // If entryId is provided, it's edit mode
    open(entryId = null, defaults = {}) {
        const entry = entryId ? Store.getEntry(entryId) : null;
        const isEdit = !!entry;

        Modal.open((body) => {
            const data = entry || { ...Models.createEntry(), ...defaults };

            body.innerHTML = `
        <div class="modal-header">
          <h2 class="modal-title">${isEdit ? 'Edit Entry' : 'New Entry'}</h2>
          <button class="modal-close" id="entry-form-close">✕</button>
        </div>
        <div class="modal-body-inner">
          <div class="form-group">
            <label class="form-label" for="ef-title">What are you tracking?</label>
            <input class="form-input" type="text" id="ef-title" placeholder="e.g., Morning run, Read 20 pages, Buy groceries..." value="${this._esc(data.title)}" autofocus />
          </div>

          <div class="form-group">
            <label class="form-label" for="ef-desc">Notes (optional)</label>
            <textarea class="form-textarea" id="ef-desc" placeholder="Any details, thoughts, or context..." rows="3">${this._esc(data.description)}</textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="ef-category">Category</label>
              <select class="form-select" id="ef-category">
                <option value="">No category</option>
                ${Store.getCategories().map(c =>
                `<option value="${c.id}" ${data.category === c.id ? 'selected' : ''}>${c.name}</option>`
            ).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="ef-tracker">Tracker</label>
              <select class="form-select" id="ef-tracker">
                <option value="">No tracker</option>
                ${Store.getTrackers().map(t =>
                `<option value="${t.id}" ${data.trackerId === t.id ? 'selected' : ''}>${t.name}</option>`
            ).join('')}
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="ef-due">Due date</label>
              <input class="form-input" type="date" id="ef-due" value="${DateUtils.toInputDate(data.dueDate)}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="ef-priority">Priority</label>
              <select class="form-select" id="ef-priority">
                <option value="low" ${data.priority === 'low' ? 'selected' : ''}>Low</option>
                <option value="medium" ${data.priority === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="high" ${data.priority === 'high' ? 'selected' : ''}>High</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Tags</label>
            <div class="tags-input-wrap" id="ef-tags-wrap">
              ${(data.tags || []).map(t =>
                `<span class="tag">${this._esc(t)}<span class="tag-remove" data-tag="${this._esc(t)}">✕</span></span>`
            ).join('')}
              <input class="tags-input" type="text" id="ef-tags-input" placeholder="Type and press Enter..." />
            </div>
            <div class="form-hint">Press Enter or comma to add a tag</div>
          </div>

          <!-- Advanced section (collapsible) -->
          <details class="form-group" ${(data.repeat !== 'none' || data.links || data.progress > 0) ? 'open' : ''}>
            <summary style="cursor:pointer; font-size: var(--font-sm); font-weight: var(--weight-medium); color: var(--text-secondary); margin-bottom: var(--sp-3);">
              More options
            </summary>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="ef-repeat">Repeat</label>
                <select class="form-select" id="ef-repeat">
                  ${Object.entries(Models.repeatLabels).map(([k, v]) =>
                `<option value="${k}" ${data.repeat === k ? 'selected' : ''}>${v}</option>`
            ).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="ef-status">Status</label>
                <select class="form-select" id="ef-status">
                  ${Object.entries(Models.statusLabels).map(([k, v]) =>
                `<option value="${k}" ${data.status === k ? 'selected' : ''}>${v}</option>`
            ).join('')}
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="ef-progress">Progress: <span id="ef-progress-val">${data.progress || 0}%</span></label>
              <input class="range-slider" type="range" id="ef-progress" min="0" max="100" value="${data.progress || 0}" />
            </div>

            <div class="form-group">
              <label class="form-label">How are you feeling? <span id="ef-mood-val">${Models.moodEmojis[(data.mood || 3) - 1]}</span></label>
              <input class="range-slider" type="range" id="ef-mood" min="1" max="5" value="${data.mood || 3}" />
            </div>

            <div class="form-group">
              <label class="form-label" for="ef-links">Links / references</label>
              <input class="form-input" type="text" id="ef-links" placeholder="Paste a link or note a reference..." value="${this._esc(data.links)}" />
            </div>
          </details>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="ef-cancel">Cancel</button>
          <button class="btn btn-primary" id="ef-save">${isEdit ? 'Save Changes' : 'Add Entry'}</button>
        </div>
      `;

            // Wire up events
            this._bindFormEvents(body, isEdit, entryId, data.tags || []);
        });
    },

    _bindFormEvents(body, isEdit, entryId, initialTags) {
        const tags = [...initialTags];

        // Close button
        body.querySelector('#entry-form-close').addEventListener('click', () => Modal.close());
        body.querySelector('#ef-cancel').addEventListener('click', () => Modal.close());

        // Tags handling
        const tagsWrap = body.querySelector('#ef-tags-wrap');
        const tagsInput = body.querySelector('#ef-tags-input');

        const addTag = (text) => {
            const t = text.trim().toLowerCase();
            if (!t || tags.includes(t)) return;
            tags.push(t);
            const span = DOM.el('span', { className: 'tag' }, t,
                DOM.el('span', { className: 'tag-remove', dataset: { tag: t }, onClick: () => removeTag(t) }, '✕')
            );
            tagsWrap.insertBefore(span, tagsInput);
            tagsInput.value = '';
        };

        const removeTag = (t) => {
            const idx = tags.indexOf(t);
            if (idx !== -1) tags.splice(idx, 1);
            tagsWrap.querySelectorAll('.tag').forEach(el => {
                if (el.textContent.replace('✕', '').trim() === t) el.remove();
            });
        };

        // Handle existing tag remove buttons
        tagsWrap.querySelectorAll('.tag-remove').forEach(btn => {
            btn.addEventListener('click', () => removeTag(btn.dataset.tag));
        });

        tagsInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addTag(tagsInput.value);
            }
            if (e.key === 'Backspace' && !tagsInput.value && tags.length) {
                removeTag(tags[tags.length - 1]);
            }
        });

        // Progress slider display
        const progressSlider = body.querySelector('#ef-progress');
        const progressVal = body.querySelector('#ef-progress-val');
        if (progressSlider && progressVal) {
            progressSlider.addEventListener('input', () => {
                progressVal.textContent = progressSlider.value + '%';
            });
        }

        // Mood slider display
        const moodSlider = body.querySelector('#ef-mood');
        const moodVal = body.querySelector('#ef-mood-val');
        if (moodSlider && moodVal) {
            moodSlider.addEventListener('input', () => {
                moodVal.textContent = Models.moodEmojis[parseInt(moodSlider.value) - 1];
            });
        }

        // Save
        body.querySelector('#ef-save').addEventListener('click', () => {
            const title = body.querySelector('#ef-title').value.trim();
            if (!title) {
                body.querySelector('#ef-title').style.borderColor = 'var(--danger)';
                body.querySelector('#ef-title').setAttribute('placeholder', 'Give it a name — even a short one works!');
                body.querySelector('#ef-title').focus();
                return;
            }

            const entryData = {
                title,
                description: body.querySelector('#ef-desc').value.trim(),
                category: body.querySelector('#ef-category').value,
                trackerId: body.querySelector('#ef-tracker').value,
                dueDate: body.querySelector('#ef-due').value ? new Date(body.querySelector('#ef-due').value + 'T00:00:00').toISOString() : '',
                priority: body.querySelector('#ef-priority').value,
                tags,
                repeat: body.querySelector('#ef-repeat').value,
                status: body.querySelector('#ef-status').value,
                progress: parseInt(progressSlider ? progressSlider.value : 0),
                mood: parseInt(moodSlider ? moodSlider.value : 3),
                links: body.querySelector('#ef-links').value.trim()
            };

            if (isEdit) {
                Store.updateEntry(entryId, entryData);
                Toast.show('Entry updated!', 'success');
            } else {
                Store.addEntry(entryData);
                Toast.show('Added to your tracker!', 'success');
            }

            Modal.close();
        });

        // Enter key on title goes to save
        body.querySelector('#ef-title').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                body.querySelector('#ef-save').click();
            }
        });
    },

    _esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
};
