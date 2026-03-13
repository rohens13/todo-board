// State
let data = { columns: [], tasks: [] };
let selectedColor = '#6366f1';

// Undo history stack
let undoStack = [];
const MAX_UNDO = 20;

// Save state for undo
function saveStateForUndo() {
    const state = JSON.parse(JSON.stringify(data));
    undoStack.push(state);
    if (undoStack.length > MAX_UNDO) {
        undoStack.shift();
    }
    updateUndoButton();
}

// Update undo button state
function updateUndoButton() {
    const btn = document.getElementById('undoBtn');
    btn.disabled = undoStack.length === 0;
}

// Undo last action
async function undo() {
    if (undoStack.length === 0) return;

    data = undoStack.pop();

    // Save to server
    await fetch('/api/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    renderBoard();
    updateUndoButton();
}

// Load data on start
async function loadData() {
    const response = await fetch('/api/data');
    data = await response.json();
    renderBoard();
    updateUndoButton();
}

// Render the board
function renderBoard() {
    const board = document.getElementById('board');
    board.innerHTML = data.columns.map(column => {
        const tasks = data.tasks.filter(t => t.column === column.id);
        return `
            <div class="column" data-column="${column.id}"
                 ondragover="handleDragOver(event)"
                 ondragleave="handleDragLeave(event)"
                 ondrop="handleDrop(event)">
                <div class="column-header">
                    <div class="column-dot" style="background: ${column.color}"></div>
                    <span class="column-title">${column.title}</span>
                    <span class="column-count">${tasks.length}</span>
                    ${tasks.length > 0 ? `<button class="clear-column-btn" onclick="clearColumn('${column.id}', '${column.title}')">Clear</button>` : ''}
                </div>
                <div class="tasks">
                    ${tasks.length === 0 ?
                        '<div class="empty-state">Drop tasks here</div>' :
                        tasks.map(task => renderTask(task)).join('')
                    }
                </div>
            </div>
        `;
    }).join('');
}

// Render a single task
function renderTask(task) {
    const date = new Date(task.createdAt).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric'
    });
    return `
        <div class="task"
             draggable="true"
             data-id="${task.id}"
             style="border-color: ${task.color}"
             ondragstart="handleDragStart(event)"
             ondragend="handleDragEnd(event)">
            <div class="task-title">${escapeHtml(task.title)}</div>
            <div class="task-notes">${escapeHtml(task.notes || '')}</div>
            <div class="task-meta">
                <span class="task-date">${date}</span>
                <div class="task-actions">
                    <button class="task-edit" onclick="openEditModal('${task.id}')" title="Edit">✎</button>
                    <button class="task-delete" onclick="deleteTask('${task.id}')" title="Delete">✕</button>
                </div>
            </div>
        </div>
    `;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add new task
async function addTask() {
    const input = document.getElementById('newTaskInput');
    const title = input.value.trim();

    if (!title) return;

    saveStateForUndo();

    const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, color: selectedColor })
    });

    const task = await response.json();
    data.tasks.push(task);
    renderBoard();
    input.value = '';
}

// Delete task
async function deleteTask(id) {
    saveStateForUndo();

    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    data.tasks = data.tasks.filter(t => t.id !== id);
    renderBoard();
}

// Clear all tasks in a column
async function clearColumn(columnId, columnTitle) {
    const tasksInColumn = data.tasks.filter(t => t.column === columnId);
    if (tasksInColumn.length === 0) return;

    const confirmed = confirm(`Are you sure you want to clear all ${tasksInColumn.length} task(s) from "${columnTitle}"?\n\nThis can be undone with Cmd+Z.`);
    if (!confirmed) return;

    saveStateForUndo();

    // Delete all tasks in this column
    for (const task of tasksInColumn) {
        await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
    }

    data.tasks = data.tasks.filter(t => t.column !== columnId);
    renderBoard();
}

// Move task to new column
async function moveTask(taskId, newColumn) {
    const task = data.tasks.find(t => t.id === taskId);
    if (!task || task.column === newColumn) return;

    saveStateForUndo();

    task.column = newColumn;
    await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column: newColumn })
    });

    renderBoard();
}

// Open edit modal
function openEditModal(taskId) {
    const task = data.tasks.find(t => t.id === taskId);
    if (!task) return;

    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskNotes').value = task.notes || '';
    document.getElementById('taskModal').classList.remove('hidden');
}

// Close modal
function closeModal() {
    document.getElementById('taskModal').classList.add('hidden');
}

// Save task edit
async function saveTaskEdit() {
    const id = document.getElementById('editTaskId').value;
    const title = document.getElementById('editTaskTitle').value.trim();
    const notes = document.getElementById('editTaskNotes').value.trim();

    if (!title) return;

    const task = data.tasks.find(t => t.id === id);
    if (task) {
        saveStateForUndo();

        task.title = title;
        task.notes = notes;

        await fetch(`/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, notes })
        });

        renderBoard();
    }

    closeModal();
}

// Drag and drop handlers
let draggedTaskId = null;

function handleDragStart(event) {
    draggedTaskId = event.target.dataset.id;
    event.target.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(event) {
    event.target.classList.remove('dragging');
    document.querySelectorAll('.column').forEach(col => col.classList.remove('drag-over'));
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    event.currentTarget.classList.add('drag-over');
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove('drag-over');
}

function handleDrop(event) {
    event.preventDefault();
    const column = event.currentTarget;
    column.classList.remove('drag-over');

    const newColumn = column.dataset.column;
    if (draggedTaskId && newColumn) {
        moveTask(draggedTaskId, newColumn);
    }
    draggedTaskId = null;
}

// Theme switcher
const THEMES = ['dark', 'light', 'ocean', 'forest', 'sunset'];

function applyTheme(theme) {
    // Remove all theme classes
    THEMES.forEach(t => document.body.classList.remove('theme-' + t));
    document.body.classList.remove('light-mode'); // legacy

    if (theme !== 'dark') {
        document.body.classList.add('theme-' + theme);
        if (theme === 'light') document.body.classList.add('light-mode'); // legacy compat
    }

    // Update active swatch
    document.querySelectorAll('.theme-swatch').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });

    localStorage.setItem('theme', theme);
}

function initDarkMode() {
    const saved = localStorage.getItem('theme') ||
        (localStorage.getItem('darkMode') === 'light' ? 'light' : 'dark');

    applyTheme(saved);

    document.getElementById('themeSwitcher').addEventListener('click', e => {
        const swatch = e.target.closest('.theme-swatch');
        if (swatch) applyTheme(swatch.dataset.theme);
    });
}

// Color picker
document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedColor = btn.dataset.color;
    });
});

// Add task button
document.getElementById('addTaskBtn').addEventListener('click', addTask);

// Undo button
document.getElementById('undoBtn').addEventListener('click', undo);

// Enter key to add task
document.getElementById('newTaskInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape to close modal
    if (e.key === 'Escape') closeModal();

    // Cmd+Z to undo
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        undo();
    }
});

// Tabs
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        tab.classList.add('active');
        document.getElementById(`tab-${tab.dataset.tab}`).classList.remove('hidden');
        if (tab.dataset.tab === 'hubspot') loadHubspot();
        if (tab.dataset.tab === 'dd') loadDD();
        if (tab.dataset.tab === 'podcasts') loadPodcasts();
    });
});

let currentFunnelPeriod = '';
let currentFunnelView = 'historical';
let ownerNames = {};

// Interpolate coral (#e88b84) → mauve (#957089) across funnel rows
function funnelBarColor(i, totalRows) {
    const t = Math.min(i / Math.max(totalRows - 1, 1), 1);
    const r = Math.round(232 + (149 - 232) * t);
    const g = Math.round(139 + (112 - 139) * t);
    const b = Math.round(132 + (137 - 132) * t);
    return `rgba(${r},${g},${b},0.88)`;
}

function renderFunnelChart(data, compact = false, ownerId = null) {
    const { total, stages, parked = [] } = data;
    if (total === 0) return '<p class="hs-empty">No deals</p>';

    const ownerAttr = ownerId ? ` data-owner-id="${ownerId}"` : '';
    const allRows = [
        { id: '__all__', name: 'All created deals', count: total, conversionToStage: 100, nextStepConversion: null },
        ...stages
    ];
    const wrapClass = compact ? 'hs-funnel-compact' : 'hs-funnel-full';

    const header = compact ? '' : `
        <div class="hs-funnel-row hs-funnel-header-row">
            <div class="hs-funnel-col-name">Stage</div>
            <div class="hs-funnel-col-bar"></div>
            <div class="hs-funnel-col-metric">To stage</div>
            <div class="hs-funnel-col-metric">Next step</div>
        </div>`;

    const rows = allRows.map((row, i) => {
        const pct = (row.count / total * 100);
        const pctStr = pct.toFixed(1);
        const color = funnelBarColor(i, allRows.length);
        const inside = pct > (compact ? 28 : 18);
        const countStyle = inside
            ? `right:calc(${pctStr}% - 46px);color:rgba(255,255,255,0.95)`
            : `right:calc(${pctStr}% + 6px);color:var(--text-secondary)`;

        const metrics = compact ? '' : `
            <div class="hs-funnel-col-metric">${i === 0 ? '100%' : row.conversionToStage + '%'}</div>
            <div class="hs-funnel-col-metric">${row.nextStepConversion === null ? '—' : row.nextStepConversion + '%'}</div>`;

        return `
            <div class="hs-funnel-row hs-funnel-row-clickable" data-stage-id="${row.id}" data-stage-name="${row.name}"${ownerAttr}>
                <div class="hs-funnel-col-name">${row.name}</div>
                <div class="hs-funnel-col-bar">
                    <span class="hs-funnel-count" style="${countStyle}">${row.count}</span>
                    <div class="hs-funnel-bar-rect" style="width:${pctStr}%;background:${color}"></div>
                </div>
                ${metrics}
            </div>`;
    }).join('');

    const parkedHtml = parked.length === 0 ? '' : `
        <div class="hs-funnel-parked">
            <span class="hs-funnel-parked-label">Parked</span>
            ${parked.map(s => `
                <span class="hs-funnel-parked-item hs-funnel-row-clickable" data-stage-id="${s.id}" data-stage-name="${s.name}"${ownerAttr}>
                    <span class="hs-funnel-parked-name">${s.name}</span>
                    <span class="hs-funnel-parked-count">${s.count}</span>
                    <span class="hs-funnel-parked-pct">${(s.count / total * 100).toFixed(1)}%</span>
                </span>`).join('')}
        </div>`;

    return `<div class="${wrapClass}">${header}${rows}${parkedHtml}</div>`;
}

async function loadFunnel(period = currentFunnelPeriod, view = currentFunnelView) {
    currentFunnelPeriod = period;
    currentFunnelView = view;
    const loadingEl = document.getElementById('hs-funnel-loading');
    const contentEl = document.getElementById('hs-funnel-content');

    loadingEl.classList.remove('hidden');
    contentEl.innerHTML = '';

    try {
        const params = new URLSearchParams();
        if (period) params.set('period', period);
        if (view === 'current') params.set('view', 'current');
        const qs = params.toString();
        const url = '/api/hubspot/funnel' + (qs ? `?${qs}` : '');
        const res = await fetch(url);
        if (!res.ok) throw new Error();
        const { aggregate, byOwner } = await res.json();

        ownerNames = {};
        byOwner.forEach(o => { ownerNames[o.ownerId] = o.ownerName; });

        const ownerCardsHtml = byOwner.map(owner => `
            <div class="hs-funnel-owner-card">
                <div class="hs-funnel-owner-header">
                    <span class="hs-funnel-owner-name">${owner.ownerName}</span>
                    <span class="hs-funnel-owner-badge">${owner.total}</span>
                </div>
                ${renderFunnelChart(owner, true, owner.ownerId)}
            </div>`
        ).join('');

        contentEl.innerHTML = `
            <div class="hs-funnel-section-label">All Owners</div>
            ${renderFunnelChart(aggregate, false)}
            <div class="hs-funnel-divider"></div>
            <div class="hs-funnel-section-label">By Owner</div>
            <div class="hs-funnel-owners-grid">${ownerCardsHtml}</div>`;

        loadingEl.classList.add('hidden');
    } catch (err) {
        loadingEl.textContent = 'Failed to load funnel data.';
    }
}

// Period selector
document.addEventListener('click', e => {
    const btn = e.target.closest('.hs-period-btn');
    if (!btn) return;
    document.querySelectorAll('.hs-period-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadFunnel(btn.dataset.period, currentFunnelView);
});

// View toggle (historical / current)
document.addEventListener('click', e => {
    const btn = e.target.closest('.hs-view-btn');
    if (!btn) return;
    document.querySelectorAll('.hs-view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadFunnel(currentFunnelPeriod, btn.dataset.view);
});

// Funnel row drilldown — click any stage row to see deals
document.addEventListener('click', e => {
    const row = e.target.closest('.hs-funnel-row-clickable');
    if (!row) return;
    const { stageId, stageName, ownerId } = row.dataset;
    openDealsPanel(stageId, stageName, ownerId || null);
});

function openDealsPanel(stageId, stageName, ownerId) {
    const panel = document.getElementById('hs-deals-panel');
    const titleEl = document.getElementById('hs-deals-title');
    const subtitleEl = document.getElementById('hs-deals-subtitle');
    const body = document.getElementById('hs-deals-panel-body');

    titleEl.textContent = stageName;
    subtitleEl.textContent = 'Loading…';
    body.innerHTML = '<div class="hs-deals-loading">Loading deals…</div>';
    panel.classList.add('open');

    const params = new URLSearchParams({ stageId, view: currentFunnelView });
    if (currentFunnelPeriod) params.set('period', currentFunnelPeriod);
    if (ownerId) params.set('ownerId', ownerId);

    fetch(`/api/hubspot/funnel/deals?${params}`)
        .then(r => r.json())
        .then(({ deals, total }) => {
            const ownerLabel = ownerId ? (ownerNames[ownerId] || ownerId) : 'All owners';
            subtitleEl.textContent = `${total} deal${total !== 1 ? 's' : ''} · ${ownerLabel}`;
            body.innerHTML = renderDealsTable(deals);
        })
        .catch(() => {
            body.innerHTML = '<p style="color:var(--text-muted);padding:16px">Failed to load deals.</p>';
        });
}

function closeDealsPanel() {
    document.getElementById('hs-deals-panel').classList.remove('open');
}

function renderDealsTable(deals) {
    if (deals.length === 0) return '<p class="hs-empty" style="padding:16px">No deals found.</p>';
    const fmt = n => n > 0 ? '$' + n.toLocaleString('en-AU', { maximumFractionDigits: 0 }) : '—';
    const fmtDate = s => s ? new Date(s).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
    return `
        <table class="hs-deals-table">
            <thead><tr>
                <th>Deal Name</th>
                <th>Amount</th>
                <th>Current Stage</th>
                <th>Owner</th>
                <th>Close Date</th>
            </tr></thead>
            <tbody>
                ${deals.map(d => `
                    <tr>
                        <td class="deal-name">${d.name}</td>
                        <td class="deal-amount">${fmt(d.amount)}</td>
                        <td><span class="deal-stage-pill">${d.stage}</span></td>
                        <td>${d.owner}</td>
                        <td>${fmtDate(d.closeDate)}</td>
                    </tr>`).join('')}
            </tbody>
        </table>`;
}

document.getElementById('hs-deals-back').addEventListener('click', closeDealsPanel);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDealsPanel(); });

// ── Podcasts ────────────────────────────────────────────────────────────────

let podData = [];
let podExpanded = new Set();   // podcast IDs
let epExpanded = new Set();    // episode IDs
let currentEpIdeas = [];       // ideas being edited in ep editor

// ── Investment idea helpers ──────────────────────────────────────────────────

function convDots(n, max = 5) {
    return Array.from({ length: max }, (_, i) =>
        `<span class="conv-dot ${i < n ? 'filled' : ''}"></span>`
    ).join('');
}

const DIR_CLASSES = { Long: 'dir-long', Short: 'dir-short', Watch: 'dir-watch', Neutral: 'dir-neutral' };

function renderIdeaCard(idea) {
    const dirClass = DIR_CLASSES[idea.direction] || 'dir-watch';
    const tickers = idea.tickers ? `<span class="idea-tickers">${idea.tickers}</span>` : '';
    const ts = idea.timestamp ? `<span class="idea-timestamp">⏱ ${idea.timestamp}</span>` : '';
    return `
        <div class="inv-idea-card">
            <div class="inv-idea-top">
                <span class="dir-badge ${dirClass}">${idea.direction || 'Watch'}</span>
                <span class="inv-idea-asset">${idea.asset}</span>
                ${tickers}
                ${ts}
            </div>
            ${idea.thesis ? `<p class="inv-idea-thesis">${idea.thesis}</p>` : ''}
            <div class="inv-idea-ratings">
                <div class="inv-conviction-group">
                    <span class="conv-label">Podcast</span>
                    <span class="conv-dots">${convDots(idea.podConviction || 0)}</span>
                    <span class="conv-num">${idea.podConviction || '—'}/5</span>
                </div>
                <div class="inv-conviction-group">
                    <span class="conv-label">My view</span>
                    <span class="conv-dots">${convDots(idea.myConviction || 0)}</span>
                    <span class="conv-num">${idea.myConviction || '—'}/5</span>
                </div>
            </div>
            ${idea.myAnalysis ? `<p class="inv-idea-analysis">${idea.myAnalysis}</p>` : ''}
        </div>`;
}

function renderIdeasInForm() {
    const c = document.getElementById('ep-ideas-container');
    if (!c) return;
    if (currentEpIdeas.length === 0) {
        c.innerHTML = '<p class="ep-no-ideas">No ideas added yet.</p>';
        return;
    }
    c.innerHTML = currentEpIdeas.map((idea, i) => `
        <div class="idea-form-card" data-idx="${i}">
            <div class="idea-form-row1">
                <select class="dd-input idea-f idea-direction" data-field="direction" data-idx="${i}">
                    <option value="Long" ${idea.direction === 'Long' ? 'selected' : ''}>Long</option>
                    <option value="Short" ${idea.direction === 'Short' ? 'selected' : ''}>Short</option>
                    <option value="Watch" ${idea.direction === 'Watch' ? 'selected' : ''}>Watch</option>
                    <option value="Neutral" ${idea.direction === 'Neutral' ? 'selected' : ''}>Neutral</option>
                </select>
                <input class="dd-input idea-f idea-asset" data-field="asset" data-idx="${i}" placeholder="Asset / Trade name" value="${idea.asset || ''}">
                <input class="dd-input idea-f idea-tickers" data-field="tickers" data-idx="${i}" placeholder="LNG, NFE…" value="${idea.tickers || ''}">
                <input class="dd-input idea-f idea-ts" data-field="timestamp" data-idx="${i}" placeholder="@23:45" value="${idea.timestamp || ''}">
                <button type="button" class="idea-remove-btn" onclick="removeIdea(${i})">✕</button>
            </div>
            <textarea class="dd-input idea-f dd-textarea idea-thesis" data-field="thesis" data-idx="${i}" rows="2" placeholder="Investment thesis…">${idea.thesis || ''}</textarea>
            <div class="idea-form-row2">
                <label class="idea-conv-label">Podcast conviction</label>
                <select class="dd-input idea-f idea-pod-conv" data-field="podConviction" data-idx="${i}">
                    ${[1,2,3,4,5].map(n => `<option value="${n}" ${(idea.podConviction||0) == n ? 'selected' : ''}>${n}/5</option>`).join('')}
                </select>
                <label class="idea-conv-label">My conviction</label>
                <select class="dd-input idea-f idea-my-conv" data-field="myConviction" data-idx="${i}">
                    ${[1,2,3,4,5].map(n => `<option value="${n}" ${(idea.myConviction||0) == n ? 'selected' : ''}>${n}/5</option>`).join('')}
                </select>
            </div>
            <textarea class="dd-input idea-f dd-textarea idea-analysis" data-field="myAnalysis" data-idx="${i}" rows="2" placeholder="My research & analysis (optional)…">${idea.myAnalysis || ''}</textarea>
        </div>`).join('');
}

// Sync DOM → currentEpIdeas before reading
function syncIdeasFromDOM() {
    document.querySelectorAll('.idea-f').forEach(el => {
        const idx = parseInt(el.dataset.idx);
        const field = el.dataset.field;
        if (isNaN(idx) || !field || !currentEpIdeas[idx]) return;
        const raw = el.value;
        currentEpIdeas[idx][field] = (field === 'podConviction' || field === 'myConviction') ? parseInt(raw) : raw;
    });
}

function removeIdea(idx) {
    syncIdeasFromDOM();
    currentEpIdeas.splice(idx, 1);
    renderIdeasInForm();
}

document.getElementById('addIdeaBtn').addEventListener('click', () => {
    syncIdeasFromDOM();
    currentEpIdeas.push({ id: Date.now().toString(), asset: '', tickers: '', direction: 'Long', timestamp: '', thesis: '', podConviction: 3, myConviction: 3, myAnalysis: '' });
    renderIdeasInForm();
});

async function loadPodcasts() {
    document.getElementById('pod-loading').classList.remove('hidden');
    document.getElementById('pod-list').innerHTML = '';
    const res = await fetch('/api/podcasts');
    podData = await res.json();
    document.getElementById('pod-loading').classList.add('hidden');
    renderPodList();
}

function renderPodList() {
    const el = document.getElementById('pod-list');
    if (podData.length === 0) {
        el.innerHTML = '<p class="dd-empty">No podcasts yet. Click "+ Add Podcast" to get started.</p>';
        return;
    }
    el.innerHTML = podData.map(p => renderPodCard(p)).join('');
}

function renderPodCard(p) {
    const expanded = podExpanded.has(p.id);
    const eps = p.episodes || [];
    const latestEp = eps[0];
    const epCountLabel = eps.length === 0 ? 'No episodes' : `${eps.length} episode${eps.length !== 1 ? 's' : ''}`;

    const episodesHtml = expanded ? `
        <div class="pod-episodes">
            <div class="pod-ep-toolbar">
                <button class="pod-add-ep-btn" onclick="event.stopPropagation(); openEpEditor('${p.id}')">+ Add Episode</button>
            </div>
            ${eps.length === 0
                ? '<p class="dd-empty" style="padding:12px 16px">No episodes yet.</p>'
                : eps.map(e => renderEpisodeCard(e, p.id)).join('')}
        </div>` : '';

    return `
        <div class="pod-card ${expanded ? 'pod-card-expanded' : ''}" data-pod-id="${p.id}">
            <div class="pod-card-header" onclick="togglePodCard('${p.id}')">
                <div class="pod-card-title-wrap">
                    <span class="pod-card-name">${p.name}</span>
                    ${p.publisher ? `<span class="pod-publisher">${p.publisher}</span>` : ''}
                    ${p.website ? `<a href="${p.website}" target="_blank" class="dd-website" onclick="event.stopPropagation()">${p.website.replace(/^https?:\/\//, '')}</a>` : ''}
                </div>
                <div class="dd-card-actions">
                    <span class="pod-ep-count">${epCountLabel}</span>
                    <button class="dd-action-btn" onclick="event.stopPropagation(); openPodEditor('${p.id}')">Edit</button>
                    <button class="dd-action-btn dd-action-delete" onclick="event.stopPropagation(); deletePodcast('${p.id}')">✕</button>
                    <span class="dd-expand-icon">${expanded ? '▲' : '▼'}</span>
                </div>
            </div>
            ${p.description ? `<div class="pod-description">${p.description}</div>` : ''}
            ${episodesHtml}
        </div>`;
}

function renderEpisodeCard(e, podId) {
    const expanded = epExpanded.has(e.id);
    const fmtDate = s => s ? new Date(s + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

    const lines = text => (text || '').split('\n').filter(l => l.trim());
    const bulletList = (text, cls) => {
        const items = lines(text);
        if (!items.length) return '';
        return `<ul class="${cls}">${items.map(l => `<li>${l.replace(/^[-•*]\s*/, '')}</li>`).join('')}</ul>`;
    };

    const ideas = e.investmentIdeas || [];
    const ideasHtml = ideas.length ? `
        <div class="ep-section">
            <div class="ep-section-label ep-opps-label">
                Investment Ideas
                <span class="ep-ideas-count">${ideas.length}</span>
            </div>
            <div class="inv-ideas-grid">${ideas.map(renderIdeaCard).join('')}</div>
        </div>` : '';

    const body = expanded ? `
        <div class="ep-body">
            ${e.summary ? `<p class="ep-summary">${e.summary}</p>` : ''}
            ${lines(e.insights).length ? `<div class="ep-section"><div class="ep-section-label">Key Insights</div>${bulletList(e.insights, 'ep-insights-list')}</div>` : ''}
            ${ideasHtml}
            ${e.notes ? `<div class="ep-section"><div class="ep-section-label">Notes</div><p class="ep-notes">${e.notes}</p></div>` : ''}
        </div>` : '';

    return `
        <div class="ep-card ${expanded ? 'ep-card-expanded' : ''}">
            <div class="ep-card-header" onclick="toggleEpCard('${e.id}')">
                <div class="ep-header-main">
                    <span class="ep-title">${e.title}</span>
                    <div class="ep-meta">
                        ${fmtDate(e.date) ? `<span class="ep-date">${fmtDate(e.date)}</span>` : ''}
                        ${e.guests ? `<span class="ep-guests">with ${e.guests}</span>` : ''}
                        ${e.url ? `<a href="${e.url}" target="_blank" class="ep-link" onclick="event.stopPropagation()">Listen ↗</a>` : ''}
                    </div>
                </div>
                <div class="ep-actions">
                    <button class="dd-action-btn" onclick="event.stopPropagation(); openEpEditor('${podId}', '${e.id}')">Edit</button>
                    <button class="dd-action-btn dd-action-delete" onclick="event.stopPropagation(); deleteEpisode('${podId}', '${e.id}')">✕</button>
                    <span class="dd-expand-icon">${expanded ? '▲' : '▼'}</span>
                </div>
            </div>
            ${body}
        </div>`;
}

function togglePodCard(id) {
    if (podExpanded.has(id)) podExpanded.delete(id);
    else podExpanded.add(id);
    renderPodList();
}

function toggleEpCard(id) {
    if (epExpanded.has(id)) epExpanded.delete(id);
    else epExpanded.add(id);
    renderPodList();
}

// Podcast editor
function openPodEditor(id = null) {
    const panel = document.getElementById('pod-editor-panel');
    document.getElementById('pod-editor-title').textContent = id ? 'Edit Podcast' : 'Add Podcast';
    if (id) {
        const p = podData.find(x => x.id === id);
        if (!p) return;
        document.getElementById('pod-edit-id').value = p.id;
        document.getElementById('pod-edit-name').value = p.name || '';
        document.getElementById('pod-edit-publisher').value = p.publisher || '';
        document.getElementById('pod-edit-website').value = p.website || '';
        document.getElementById('pod-edit-desc').value = p.description || '';
    } else {
        document.getElementById('pod-editor-form').reset();
        document.getElementById('pod-edit-id').value = '';
    }
    panel.classList.add('open');
}

function closePodEditor() {
    document.getElementById('pod-editor-panel').classList.remove('open');
}

async function deletePodcast(id) {
    const p = podData.find(x => x.id === id);
    if (!p || !confirm(`Delete "${p.name}" and all its episodes?`)) return;
    await fetch(`/api/podcasts/${id}`, { method: 'DELETE' });
    podExpanded.delete(id);
    await loadPodcasts();
}

document.getElementById('pod-editor-form').addEventListener('submit', async e => {
    e.preventDefault();
    const id = document.getElementById('pod-edit-id').value;
    const payload = {
        name: document.getElementById('pod-edit-name').value.trim(),
        publisher: document.getElementById('pod-edit-publisher').value.trim(),
        website: document.getElementById('pod-edit-website').value.trim(),
        description: document.getElementById('pod-edit-desc').value.trim(),
    };
    if (id) {
        await fetch(`/api/podcasts/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } else {
        const res = await fetch('/api/podcasts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const newPod = await res.json();
        podExpanded.add(newPod.id);
    }
    closePodEditor();
    await loadPodcasts();
});

document.getElementById('addPodcastBtn').addEventListener('click', () => openPodEditor());
document.getElementById('pod-editor-back').addEventListener('click', closePodEditor);
document.getElementById('importYouTubeBtn').addEventListener('click', openYtImport);

// ── YouTube Import ────────────────────────────────────────────────────────

function openYtImport() {
    document.getElementById('yt-url-section').classList.remove('hidden');
    document.getElementById('yt-progress-section').classList.add('hidden');
    document.getElementById('yt-import-url').value = '';
    document.getElementById('yt-import-btn').disabled = false;
    document.getElementById('yt-import-btn').textContent = 'Import';
    document.getElementById('yt-done-actions').style.display = 'none';
    document.getElementById('yt-import-modal').classList.remove('hidden');
}

function closeYtImport() {
    document.getElementById('yt-import-modal').classList.add('hidden');
}

function addYtStep(message, status = 'running') {
    const el = document.createElement('div');
    el.className = `yt-step yt-step-${status}`;
    const icon = status === 'done' ? '✓' : status === 'error' ? '✗' : '◌';
    el.innerHTML = `<span class="yt-step-icon">${icon}</span><span class="yt-step-text">${message}</span>`;
    document.getElementById('yt-steps').appendChild(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return el;
}

function updateYtStep(el, status, message) {
    el.className = `yt-step yt-step-${status}`;
    const icon = status === 'done' ? '✓' : status === 'error' ? '✗' : '◌';
    el.innerHTML = `<span class="yt-step-icon">${icon}</span><span class="yt-step-text">${message}</span>`;
}

async function startYtImport() {
    const url = document.getElementById('yt-import-url').value.trim();
    if (!url) { document.getElementById('yt-import-url').focus(); return; }

    document.getElementById('yt-url-section').classList.add('hidden');
    document.getElementById('yt-progress-section').classList.remove('hidden');
    document.getElementById('yt-steps').innerHTML = '';

    let lastStep = null;

    try {
        const response = await fetch(`/api/podcasts/import-youtube?url=${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error(`Server error ${response.status}`);

        const reader = response.body.getReader();
        const dec = new TextDecoder();
        let buf = '';
        let importResult = null;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });

            const lines = buf.split('\n');
            buf = lines.pop(); // keep incomplete line

            let eventType = '';
            for (const line of lines) {
                if (line.startsWith('event: ')) {
                    eventType = line.slice(7).trim();
                } else if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (eventType === 'progress' && data.message) {
                            if (lastStep) updateYtStep(lastStep, 'done', lastStep.querySelector('.yt-step-text').textContent);
                            lastStep = addYtStep(data.message, 'running');
                        } else if (eventType === 'complete') {
                            importResult = data;
                        } else if (eventType === 'error' && data.message) {
                            if (lastStep) updateYtStep(lastStep, 'error', lastStep.querySelector('.yt-step-text').textContent);
                            addYtStep(`Error: ${data.message}`, 'error');
                        }
                    } catch {}
                    eventType = '';
                }
            }
        }

        if (importResult) {
            if (lastStep) updateYtStep(lastStep, 'done', lastStep.querySelector('.yt-step-text').textContent);
            addYtStep('Saving podcast and episodes...', 'running');

            // Create podcast
            const pod = await fetch('/api/podcasts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(importResult.podcast)
            }).then(r => r.json());

            // Create episodes oldest-first so newest ends up first in list
            for (let i = importResult.episodes.length - 1; i >= 0; i--) {
                await fetch(`/api/podcasts/${pod.id}/episodes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(importResult.episodes[i])
                });
            }

            const lastStepEl = document.querySelector('.yt-step:last-child');
            if (lastStepEl) updateYtStep(lastStepEl, 'done', `Saved ${importResult.episodes.length} episodes`);
            addYtStep(`Done! "${importResult.podcast.name}" added with ${importResult.episodes.length} episodes.`, 'done');
            document.getElementById('yt-done-actions').style.display = 'flex';

            await loadPodcasts();
        }
    } catch (err) {
        if (lastStep) updateYtStep(lastStep, 'error', lastStep.querySelector('.yt-step-text').textContent);
        addYtStep(`Error: ${err.message}`, 'error');
        document.getElementById('yt-done-actions').style.display = 'flex';
    }
}

// Episode editor
function openEpEditor(podId, epId = null) {
    const panel = document.getElementById('ep-editor-panel');
    document.getElementById('ep-editor-title').textContent = epId ? 'Edit Episode' : 'Add Episode';
    document.getElementById('ep-edit-pod-id').value = podId;
    if (epId) {
        const p = podData.find(x => x.id === podId);
        const ep = p && (p.episodes || []).find(e => e.id === epId);
        if (!ep) return;
        document.getElementById('ep-edit-ep-id').value = ep.id;
        document.getElementById('ep-edit-title').value = ep.title || '';
        document.getElementById('ep-edit-date').value = ep.date || '';
        document.getElementById('ep-edit-guests').value = ep.guests || '';
        document.getElementById('ep-edit-url').value = ep.url || '';
        document.getElementById('ep-edit-summary').value = ep.summary || '';
        document.getElementById('ep-edit-insights').value = ep.insights || '';
        document.getElementById('ep-edit-notes').value = ep.notes || '';
        currentEpIdeas = JSON.parse(JSON.stringify(ep.investmentIdeas || []));
    } else {
        document.getElementById('ep-editor-form').reset();
        document.getElementById('ep-edit-ep-id').value = '';
        document.getElementById('ep-edit-pod-id').value = podId;
        document.getElementById('ep-edit-date').value = new Date().toISOString().slice(0, 10);
        currentEpIdeas = [];
    }
    renderIdeasInForm();
    panel.classList.add('open');
}

function closeEpEditor() {
    document.getElementById('ep-editor-panel').classList.remove('open');
}

async function deleteEpisode(podId, epId) {
    if (!confirm('Delete this episode?')) return;
    await fetch(`/api/podcasts/${podId}/episodes/${epId}`, { method: 'DELETE' });
    epExpanded.delete(epId);
    await loadPodcasts();
}

document.getElementById('ep-editor-form').addEventListener('submit', async e => {
    e.preventDefault();
    const podId = document.getElementById('ep-edit-pod-id').value;
    const epId = document.getElementById('ep-edit-ep-id').value;
    syncIdeasFromDOM();
    const payload = {
        title: document.getElementById('ep-edit-title').value.trim(),
        date: document.getElementById('ep-edit-date').value,
        guests: document.getElementById('ep-edit-guests').value.trim(),
        url: document.getElementById('ep-edit-url').value.trim(),
        summary: document.getElementById('ep-edit-summary').value.trim(),
        insights: document.getElementById('ep-edit-insights').value.trim(),
        notes: document.getElementById('ep-edit-notes').value.trim(),
        investmentIdeas: currentEpIdeas.filter(idea => idea.asset.trim()),
    };
    if (epId) {
        await fetch(`/api/podcasts/${podId}/episodes/${epId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } else {
        const res = await fetch(`/api/podcasts/${podId}/episodes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const newEp = await res.json();
        epExpanded.add(newEp.id);
        podExpanded.add(podId);
    }
    closeEpEditor();
    await loadPodcasts();
});

document.getElementById('ep-editor-back').addEventListener('click', closeEpEditor);

// ── DD (Due Diligence) ──────────────────────────────────────────────────────

function parseMoney(s) {
    if (s === '' || s == null) return null;
    const clean = String(s).replace(/[$,\s]/g, '').toUpperCase();
    if (clean.endsWith('B')) return parseFloat(clean) * 1e9;
    if (clean.endsWith('M')) return parseFloat(clean) * 1e6;
    if (clean.endsWith('K')) return parseFloat(clean) * 1e3;
    return parseFloat(clean) || null;
}

function formatMoney(n) {
    if (n == null || isNaN(n)) return '—';
    const sign = n < 0 ? '-' : '';
    const abs = Math.abs(n);
    if (abs >= 1e9) return sign + '$' + (abs / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6) return sign + '$' + (abs / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3) return sign + '$' + Math.round(abs / 1e3) + 'K';
    return sign + '$' + Math.round(abs);
}

function growthPct(a, b) {
    if (!a || !b) return null;
    return ((b - a) / Math.abs(a) * 100);
}

function fmtGrowth(pct) {
    if (pct == null) return '—';
    const sign = pct >= 0 ? '+' : '';
    return `<span class="dd-growth ${pct >= 0 ? 'pos' : 'neg'}">${sign}${pct.toFixed(1)}%</span>`;
}

function fmtPct(num, denom) {
    if (!denom) return '—';
    return (num / denom * 100).toFixed(1) + '%';
}

let ddCompanies = [];
let ddExpanded = new Set();

async function loadDD() {
    document.getElementById('dd-loading').classList.remove('hidden');
    document.getElementById('dd-cards').innerHTML = '';
    const res = await fetch('/api/companies');
    ddCompanies = await res.json();
    document.getElementById('dd-loading').classList.add('hidden');
    renderDDCards();
}

function renderDDCards() {
    const el = document.getElementById('dd-cards');
    if (ddCompanies.length === 0) {
        el.innerHTML = '<p class="dd-empty">No companies yet. Click "+ Add Company" to get started.</p>';
        return;
    }
    el.innerHTML = ddCompanies.map(c => renderCompanyCard(c)).join('');
}

// Benchmark color coding helpers
function nrrClass(v) { return v == null ? '' : v >= 120 ? 'dd-metric-excellent' : v >= 100 ? 'dd-metric-good' : v >= 90 ? 'dd-metric-warn' : 'dd-metric-bad'; }
function grrClass(v) { return v == null ? '' : v >= 95 ? 'dd-metric-excellent' : v >= 88 ? 'dd-metric-good' : v >= 80 ? 'dd-metric-warn' : 'dd-metric-bad'; }
function logoChurnClass(v) { return v == null ? '' : v <= 2 ? 'dd-metric-excellent' : v <= 5 ? 'dd-metric-good' : v <= 10 ? 'dd-metric-warn' : 'dd-metric-bad'; }
function concClass(v) { return v == null ? '' : v <= 5 ? 'dd-metric-excellent' : v <= 10 ? 'dd-metric-good' : v <= 20 ? 'dd-metric-warn' : 'dd-metric-bad'; }
function ltvCacClass(v) { return v == null ? '' : v >= 5 ? 'dd-metric-excellent' : v >= 3 ? 'dd-metric-good' : v >= 2 ? 'dd-metric-warn' : 'dd-metric-bad'; }
function cacPaybackClass(v) { return v == null ? '' : v <= 12 ? 'dd-metric-excellent' : v <= 18 ? 'dd-metric-good' : v <= 24 ? 'dd-metric-warn' : 'dd-metric-bad'; }
function r40Class(v) { return v == null ? '' : v >= 40 ? 'dd-metric-excellent' : v >= 20 ? 'dd-metric-good' : v >= 0 ? 'dd-metric-warn' : 'dd-metric-bad'; }

function cmPill(label, value, cls, suffix = '%') {
    if (value == null) return '';
    return `<div class="dd-cm-pill ${cls}"><span class="dd-cm-label">${label}</span><span class="dd-cm-value">${typeof value === 'number' ? value.toFixed(1) : value}${suffix}</span></div>`;
}

// ── SVG chart helpers ────────────────────────────────────────────────────────

function svgWrap(w, h, body) {
    return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">${body}</svg>`;
}

function chartConcentration(cm) {
    const t1  = cm.top1CustomerPct  ?? 0;
    const t3  = cm.top3CustomerPct  ?? t1;
    const t5  = cm.top5CustomerPct  ?? t3;
    const t10 = cm.top10CustomerPct ?? t5;
    if (t1 === 0 && t10 === 0) return '';

    const W = 380, barH = 20, labelY = barH + 16, H = labelY + 10;
    const segs = [
        { label: 'Top 1',    pct: t1,        color: '#ef4444' },
        { label: '2–3',      pct: t3 - t1,   color: '#f97316' },
        { label: '4–5',      pct: t5 - t3,   color: '#eab308' },
        { label: '6–10',     pct: t10 - t5,  color: '#84cc16' },
        { label: 'Rest',     pct: 100 - t10, color: '#22c55e' },
    ].filter(s => s.pct > 0.05);

    let x = 0, bars = '', pctLabels = '';
    for (const s of segs) {
        const w = (s.pct / 100) * W;
        bars += `<rect x="${x.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="${barH}" fill="${s.color}" opacity="0.82" rx="2"/>`;
        if (w > 26) {
            bars += `<text x="${(x + w/2).toFixed(1)}" y="${(barH/2+4).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="white">${s.label}</text>`;
            pctLabels += `<text x="${(x + w/2).toFixed(1)}" y="${labelY}" text-anchor="middle" font-size="10" fill="#8892A4">${s.pct.toFixed(1)}%</text>`;
        }
        x += w;
    }
    return `<div class="dd-chart-wrap dd-chart-full">
        <div class="dd-chart-title">Customer Concentration</div>
        <div class="dd-conc-legend">${segs.map(s => `<span><i style="background:${s.color}"></i>${s.label} ${s.pct.toFixed(1)}%</span>`).join('')}</div>
        ${svgWrap(W, H, bars + pctLabels)}
    </div>`;
}

function chartBars(data, title, valueFn, labelFn, colorFn, yLabel) {
    if (!data || data.length === 0) return '';
    const W = 380, H = 150, padL = 52, padB = 28, padT = 14, padR = 10;
    const chartW = W - padL - padR, chartH = H - padB - padT;
    const vals = data.map(valueFn).filter(v => v != null && isFinite(v));
    if (vals.length === 0) return '';
    const maxVal = Math.max(...vals, 0.01);
    const barW = Math.min(52, chartW / data.length - 8);
    const gap = (chartW - barW * data.length) / (data.length + 1);

    let bars = '', labels = '', yAxis = '';
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
        const v = (maxVal * i / ticks);
        const y = padT + chartH - (chartH * i / ticks);
        const tickLabel = yLabel === '$' ? formatMoney(v) : v.toFixed(1) + '%';
        yAxis += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}" stroke="#253045" stroke-width="1"/>`;
        yAxis += `<text x="${(padL - 5).toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="10" fill="#4B5568">${tickLabel}</text>`;
    }

    data.forEach((d, i) => {
        const val = valueFn(d);
        if (val == null) return;
        const bx = padL + gap + i * (barW + gap);
        const bh = Math.max(2, (val / maxVal) * chartH);
        const by = padT + chartH - bh;
        const color = colorFn(val);
        bars += `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" fill="${color}" opacity="0.85" rx="3"/>`;
        const dispVal = yLabel === '$' ? formatMoney(val) : val.toFixed(1) + '%';
        bars += `<text x="${(bx + barW/2).toFixed(1)}" y="${(by - 4).toFixed(1)}" text-anchor="middle" font-size="10" fill="#8892A4">${dispVal}</text>`;
        labels += `<text x="${(bx + barW/2).toFixed(1)}" y="${(H - 5).toFixed(1)}" text-anchor="middle" font-size="10" fill="#4B5568">${labelFn(d)}</text>`;
    });

    return `<div class="dd-chart-wrap">
        <div class="dd-chart-title">${title}</div>
        ${svgWrap(W, H, yAxis + bars + labels)}
    </div>`;
}

function chartLine(data, title, valueFn, labelFn, baseline) {
    if (!data || data.length < 2) return '';
    const W = 380, H = 120, padL = 46, padB = 24, padT = 12, padR = 16;
    const chartW = W - padL - padR, chartH = H - padB - padT;
    const vals = data.map(valueFn).filter(v => v != null);
    if (vals.length < 2) return '';
    const minV = Math.min(...vals, baseline ?? Math.min(...vals));
    const maxV = Math.max(...vals, baseline ?? Math.max(...vals));
    const range = maxV - minV || 1;
    const pad = range * 0.15;
    const lo = minV - pad, hi = maxV + pad, span = hi - lo;

    const toX = i => padL + (i / (data.length - 1)) * chartW;
    const toY = v => padT + chartH - ((v - lo) / span) * chartH;

    let grid = '', line = '', dots = '', xLabels = '', yLabels = '';
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
        const v = lo + (span * i / ticks);
        const y = toY(v);
        grid += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}" stroke="#253045" stroke-width="1"/>`;
        yLabels += `<text x="${(padL - 4).toFixed(1)}" y="${(y + 3.5).toFixed(1)}" text-anchor="end" font-size="8" fill="#4B5568">${v.toFixed(0)}%</text>`;
    }

    if (baseline != null) {
        const by = toY(baseline);
        grid += `<line x1="${padL}" y1="${by.toFixed(1)}" x2="${W - padR}" y2="${by.toFixed(1)}" stroke="#8B5CF6" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.6"/>`;
        grid += `<text x="${(W - padR + 2).toFixed(1)}" y="${(by + 3.5).toFixed(1)}" font-size="8" fill="#8B5CF6">${baseline}%</text>`;
    }

    const points = data.map((d, i) => `${toX(i).toFixed(1)},${toY(valueFn(d)).toFixed(1)}`).join(' ');
    line += `<polyline points="${points}" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>`;

    data.forEach((d, i) => {
        const v = valueFn(d);
        const x = toX(i), y = toY(v);
        const col = v >= 120 ? '#10b981' : v >= 100 ? '#84cc16' : v >= 90 ? '#f59e0b' : '#ef4444';
        dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${col}" stroke="#0D1117" stroke-width="1.5"/>`;
        dots += `<text x="${x.toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="middle" font-size="8" fill="#8892A4">${v.toFixed(0)}%</text>`;
        if (data.length <= 8 || i % 2 === 0) {
            xLabels += `<text x="${x.toFixed(1)}" y="${(H - 4).toFixed(1)}" text-anchor="middle" font-size="8" fill="#4B5568">${labelFn(d)}</text>`;
        }
    });

    return `<div class="dd-chart-wrap">
        <div class="dd-chart-title">${title}</div>
        ${svgWrap(W, H, grid + line + dots + xLabels + yLabels)}
    </div>`;
}

function cohortCellColor(v) {
    if (v == null) return '';
    if (v === 100) return 'background:#1a4731;color:#6ee7b7;';
    if (v >= 130) return 'background:#064e3b;color:#34d399;';
    if (v >= 115) return 'background:#065f46;color:#6ee7b7;';
    if (v >= 105) return 'background:#14532d;color:#86efac;';
    if (v >= 100) return 'background:#1a4731;color:#6ee7b7;';
    if (v >= 90)  return 'background:#713f12;color:#fde68a;';
    if (v >= 80)  return 'background:#7c2d12;color:#fdba74;';
    if (v >= 70)  return 'background:#7f1d1d;color:#fca5a5;';
    return 'background:#450a0a;color:#f87171;';
}

function renderCohortTable(cohortTableData) {
    if (!cohortTableData || cohortTableData.length === 0) return '';
    const allYears = ['FY2021','FY2022','FY2023','FY2024','FY2025'];
    const fmtM = v => v >= 1000000 ? '$' + (v/1000000).toFixed(1) + 'M' : v >= 1000 ? '$' + Math.round(v/1000) + 'K' : '$' + v;

    const rows = cohortTableData.map(row => {
        const yearMap = {};
        for (const y of row.years || []) yearMap[y.year] = y.pct;
        const cells = allYears.map(y => {
            const v = yearMap[y] ?? null;
            if (v == null) return `<td class="cell-empty">·</td>`;
            const disp = v > 999 ? `>${Math.floor(v/1000)}k%` : `${v}%`;
            return `<td style="${cohortCellColor(v)}">${disp}</td>`;
        }).join('');
        return `<tr>
            <td class="row-label">${row.cohort}</td>
            <td class="row-meta">${(row.customers||0).toLocaleString()}</td>
            <td class="row-meta">${fmtM(row.initialRev||0)}</td>
            ${cells}
        </tr>`;
    }).join('');

    // Derive insights from cohort data
    const insights = [];
    const latestCohort = cohortTableData[cohortTableData.length - 1];
    const oldestCohort = cohortTableData[0];
    // Best mature cohort: oldest with most years of data, check if above 100 in any year beyond Y1
    const oldestYears = oldestCohort?.years || [];
    const oldestPeak = Math.max(...oldestYears.map(y => y.pct ?? 0));
    const oldestLatest = oldestYears[oldestYears.length - 1]?.pct;
    if (oldestCohort && oldestLatest != null) {
        const dir = oldestLatest >= 100 ? 'expanded to' : 'retained';
        const col = oldestLatest >= 110 ? '#10b981' : oldestLatest >= 100 ? '#84cc16' : oldestLatest >= 80 ? '#f59e0b' : '#ef4444';
        insights.push(`<span style="color:${col};font-weight:700">${oldestCohort.cohort} cohort</span> (${(oldestCohort.customers||0).toLocaleString()} customers) ${dir} <strong>${oldestLatest}%</strong> of initial revenue by year ${oldestYears.length} — ${oldestLatest >= 100 ? 'net expansion from upsell' : 'churn not fully offset by expansion'}.`);
    }
    // Worst drop: newest cohort with Y2 data
    const withY2 = cohortTableData.filter(r => (r.years||[]).length >= 2);
    if (withY2.length > 0) {
        const y2vals = withY2.map(r => ({ cohort: r.cohort, y2: r.years[1]?.pct })).filter(r => r.y2 != null);
        const worst = y2vals.reduce((a, b) => b.y2 < a.y2 ? b : a, y2vals[0]);
        const best  = y2vals.reduce((a, b) => b.y2 > a.y2 ? b : a, y2vals[0]);
        if (worst.y2 < 90) {
            const col = worst.y2 < 70 ? '#ef4444' : '#f59e0b';
            insights.push(`<span style="color:${col};font-weight:700">Year-2 churn is structural:</span> worst cohort (${worst.cohort}) retained only <strong>${worst.y2}%</strong> in year 2 vs best (${best.cohort}) at <strong>${best.y2}%</strong> — new customer onboarding and early retention need attention.`);
        }
    }
    // Recovery trend: does revenue recover after Y2 dip?
    const recovering = cohortTableData.filter(r => {
        const yrs = (r.years||[]).filter(y => y.pct != null).map(y => y.pct);
        return yrs.length >= 3 && yrs[2] > yrs[1];
    });
    if (recovering.length > 0 && recovering.length >= Math.ceil(cohortTableData.filter(r => (r.years||[]).filter(y=>y.pct!=null).length >= 3).length / 2)) {
        insights.push(`<span style="color:#38bdf8;font-weight:700">Recovery pattern detected:</span> ${recovering.length} of ${cohortTableData.length} cohorts show revenue recovery in year 3+, suggesting expansion revenue compensates for early-year churn in retained accounts.`);
    }

    const insightBox = insights.length > 0 ? `
    <div style="margin-top:10px;padding:10px 14px;background:#161B27;border:1px solid #253045;border-radius:7px;font-size:0.78rem;line-height:1.65;color:#8892A4;">
        <div style="font-size:0.62rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#4B5568;margin-bottom:8px;">Key Takeaways</div>
        ${insights.map(s => `<div style="margin-bottom:6px;padding-left:10px;border-left:2px solid #253045;">${s}</div>`).join('')}
    </div>` : '';

    return `<div class="dd-cm-section-label">Cohort Revenue Retention</div>
    <div class="dd-cohort-table-wrap">
    <table class="dd-cohort-table">
        <thead><tr>
            <th class="left">Cohort</th>
            <th style="text-align:right">Custs</th>
            <th style="text-align:right">Init Rev</th>
            ${allYears.map(y => `<th>${y}</th>`).join('')}
        </tr></thead>
        <tbody>${rows}</tbody>
    </table>
    </div>
    ${insightBox}`;
}

function renderCustomerCohortTable(rows) {
    if (!rows || rows.length === 0) return '';
    const allYears = ['2021','2022','2023','2024','2025'];
    const fmtK = v => v >= 1000000 ? '$' + (v/1000000).toFixed(1) + 'M' : v >= 1000 ? '$' + Math.round(v/1000) + 'K' : '$' + v;

    const dataRows = rows.map(row => {
        const cells = allYears.map(y => {
            const v = row.pcts?.[y] ?? null;
            if (v == null) return `<td class="cell-empty">·</td>`;
            const capColor = Math.min(v, 500);
            const disp = v > 9999 ? `>${Math.floor(v/1000)}k%` : v > 999 ? `${(v/1000).toFixed(1)}k%` : `${v}%`;
            return `<td style="${cohortCellColor(capColor)}">${disp}</td>`;
        }).join('');
        return `<tr>
            <td class="row-label" style="max-width:130px;overflow:hidden;text-overflow:ellipsis;" title="${row.id}">${row.id}</td>
            <td class="row-meta" style="text-align:center;">${row.joined ? `FY${row.joined}` : '—'}</td>
            <td class="row-meta">${fmtK(row.rev2025||0)}</td>
            ${cells}
        </tr>`;
    }).join('');

    const footerRows = ['avg','med'].map(stat => {
        const cells = allYears.map(y => {
            const vals = rows.map(r => r.pcts?.[y]).filter(v => v != null && v <= 1000);
            if (vals.length === 0) return `<td>—</td>`;
            const v = stat === 'avg'
                ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length)
                : [...vals].sort((a,b)=>a-b)[Math.floor(vals.length/2)];
            return `<td style="${cohortCellColor(v)}">${v}%</td>`;
        }).join('');
        return `<tr>
            <td class="row-label">${stat === 'avg' ? 'Average' : 'Median'}</td>
            <td></td><td></td>${cells}
        </tr>`;
    }).join('');

    // Derive customer-level insights
    const custInsights = [];
    const activeRows = rows.filter(r => r.pcts?.['2025'] != null);
    const expanding = activeRows.filter(r => (r.pcts?.['2025'] ?? 0) > 100);
    const contracting = activeRows.filter(r => (r.pcts?.['2025'] ?? 0) < 100 && r.pcts?.['2025'] != null);
    if (activeRows.length > 0) {
        const expPct = Math.round(expanding.length / activeRows.length * 100);
        const col = expPct >= 50 ? '#10b981' : expPct >= 35 ? '#f59e0b' : '#ef4444';
        custInsights.push(`<span style="color:${col};font-weight:700">${expanding.length} of ${activeRows.length} customers (${expPct}%)</span> in FY2025 are above their first-year spend — expansion is concentrated in a minority of accounts.`);
    }
    // Top grower
    const topGrower = [...activeRows].filter(r => r.joined !== '2025').sort((a,b) => (b.pcts?.['2025']??0) - (a.pcts?.['2025']??0))[0];
    if (topGrower && (topGrower.pcts?.['2025'] ?? 0) > 150) {
        const col = '#10b981';
        custInsights.push(`<span style="color:${col};font-weight:700">Strongest expander:</span> ${topGrower.id} grew to <strong>${topGrower.pcts['2025'] > 9999 ? '>' + Math.floor(topGrower.pcts['2025']/1000) + 'k%' : topGrower.pcts['2025'] + '%'}</strong> of first-year revenue (${fmtK(topGrower.rev2025)} in FY2025) — a strong signal for product-led expansion in retained accounts.`);
    }
    // Churn signal: customers present in early years but not 2025
    const churned2025 = rows.filter(r => r.pcts && Object.keys(r.pcts).some(y => y < '2025') && !r.pcts['2025']);
    if (churned2025.length > 0) {
        custInsights.push(`<span style="color:#f59e0b;font-weight:700">${churned2025.length} top-${rows.length} customers</span> by historical spend are absent from FY2025 — tracking win-back potential in this group could represent meaningful re-activation revenue.`);
    }

    const custInsightBox = custInsights.length > 0 ? `
    <div style="margin-top:10px;padding:10px 14px;background:#161B27;border:1px solid #253045;border-radius:7px;font-size:0.78rem;line-height:1.65;color:#8892A4;">
        <div style="font-size:0.62rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#4B5568;margin-bottom:8px;">Key Takeaways</div>
        ${custInsights.map(s => `<div style="margin-bottom:6px;padding-left:10px;border-left:2px solid #253045;">${s}</div>`).join('')}
    </div>` : '';

    return `<div class="dd-cm-section-label">Customer Retention — Top ${rows.length} by FY2025 Revenue</div>
    <div class="dd-cohort-table-wrap" style="max-height:420px;overflow-y:auto;">
    <table class="dd-cohort-table">
        <thead style="position:sticky;top:0;z-index:2;"><tr>
            <th class="left" style="min-width:120px;">Customer</th>
            <th>Joined</th>
            <th style="text-align:right;">FY25 Rev</th>
            ${allYears.map(y => `<th>FY${y}</th>`).join('')}
        </tr></thead>
        <tbody>${dataRows}</tbody>
        <tfoot>${footerRows}</tfoot>
    </table>
    </div>
    ${custInsightBox}`;
}

function renderCustomerMetrics(cm) {
    if (!cm) return '';
    const hasRetention = cm.nrr != null || cm.grr != null || cm.logoChurnRate != null || cm.revenueChurnRate != null;
    const hasConcentration = cm.top1CustomerPct != null || cm.top3CustomerPct != null || cm.top5CustomerPct != null || cm.top10CustomerPct != null;
    const hasUnitEcon = cm.ltvCacRatio != null || cm.cacPaybackMonths != null || cm.ruleOf40 != null;
    const hasOther = cm.customerCount != null || cm.arpu != null || cm.expansionRevenuePct != null;
    const hasCharts = hasConcentration || (cm.valueChurnByYear?.length > 0) || (cm.logoChurnByYear?.length > 0) || (cm.cohortNRR?.length > 1);
    const hasCohortTable = cm.cohortTableData?.length > 0;
    const hasCustomerCohort = cm.customerCohortRows?.length > 0;
    if (!hasRetention && !hasConcentration && !hasUnitEcon && !hasOther && !cm.cohortInsights && !hasCharts && !hasCohortTable && !hasCustomerCohort) return '';

    const concChart      = chartConcentration(cm);
    // Support both { churned, period } and { churned, year } field names
    const valueChurnChart = chartBars(
        cm.valueChurnByYear?.filter(d => d.churned != null),
        'Value Churn by Year ($)',
        d => d.churned,
        d => d.period || d.year,
        v => '#ef4444',
        '$'
    );
    // Support both { rate, period } and { churnRatePct, year } field names
    const vcPctData = cm.valueChurnByYear?.filter(d => (d.rate ?? d.churnRatePct) != null);
    const valueChurnPctChart = vcPctData?.length > 0 ? chartBars(
        vcPctData,
        'Value Churn Rate by Year (%)',
        d => d.rate ?? d.churnRatePct,
        d => d.period || d.year,
        v => logoChurnClass(v) === 'dd-metric-excellent' ? '#10b981' : logoChurnClass(v) === 'dd-metric-good' ? '#84cc16' : logoChurnClass(v) === 'dd-metric-warn' ? '#f59e0b' : '#ef4444',
        '%'
    ) : '';
    const lcData = cm.logoChurnByYear?.filter(d => (d.rate ?? d.churnRatePct) != null);
    const logoChurnChart = lcData?.length > 0 ? chartBars(
        lcData,
        'Logo Churn Rate by Year (%)',
        d => d.rate ?? d.churnRatePct,
        d => d.period || d.year,
        v => v <= 2 ? '#10b981' : v <= 5 ? '#84cc16' : v <= 10 ? '#f59e0b' : '#ef4444',
        '%'
    ) : '';
    const cohortChart = chartLine(
        cm.cohortNRR?.filter(d => d.nrr != null),
        'Net Revenue Retention by Year',
        d => d.nrr,
        d => d.period,
        100
    );

    return `<div class="dd-analysis-block dd-customer-metrics">
        <span class="dd-analysis-label">Customer Metrics</span>
        ${hasRetention ? `<div class="dd-cm-section-label">Retention &amp; Churn</div>
        <div class="dd-cm-pills">
            ${cmPill('NRR', cm.nrr, nrrClass(cm.nrr))}
            ${cmPill('GRR', cm.grr, grrClass(cm.grr))}
            ${cmPill('Logo Churn', cm.logoChurnRate, logoChurnClass(cm.logoChurnRate))}
            ${cmPill('Rev Churn', cm.revenueChurnRate, logoChurnClass(cm.revenueChurnRate))}
        </div>` : ''}
        ${hasConcentration ? `<div class="dd-cm-section-label">Customer Concentration</div>
        <div class="dd-cm-pills">
            ${cmPill('Top 1', cm.top1CustomerPct, concClass(cm.top1CustomerPct))}
            ${cmPill('Top 3', cm.top3CustomerPct, concClass(cm.top3CustomerPct))}
            ${cmPill('Top 5', cm.top5CustomerPct, concClass(cm.top5CustomerPct))}
            ${cmPill('Top 10', cm.top10CustomerPct, concClass(cm.top10CustomerPct))}
        </div>` : ''}
        ${hasUnitEcon ? `<div class="dd-cm-section-label">Unit Economics</div>
        <div class="dd-cm-pills">
            ${cmPill('LTV:CAC', cm.ltvCacRatio, ltvCacClass(cm.ltvCacRatio), 'x')}
            ${cmPill('CAC Payback', cm.cacPaybackMonths, cacPaybackClass(cm.cacPaybackMonths), ' mo')}
            ${cmPill('Rule of 40', cm.ruleOf40, r40Class(cm.ruleOf40))}
            ${cm.expansionRevenuePct != null ? cmPill('Expansion ARR', cm.expansionRevenuePct, 'dd-metric-neutral') : ''}
        </div>` : ''}
        ${hasOther ? `<div class="dd-cm-pills" style="margin-top:6px">
            ${cm.customerCount != null ? `<div class="dd-cm-pill dd-metric-neutral"><span class="dd-cm-label">Customers</span><span class="dd-cm-value">${cm.customerCount.toLocaleString()}</span></div>` : ''}
            ${cm.arpu != null ? `<div class="dd-cm-pill dd-metric-neutral"><span class="dd-cm-label">ARPU</span><span class="dd-cm-value">${formatMoney(cm.arpu)}</span></div>` : ''}
        </div>` : ''}
        ${concChart || valueChurnChart || valueChurnPctChart || logoChurnChart || cohortChart ? `
        <div class="dd-cm-section-label">Trends</div>
        <div class="dd-charts-grid">
            ${concChart}
            ${valueChurnChart}
            ${valueChurnPctChart}
            ${logoChurnChart}
            ${cohortChart}
        </div>` : ''}
        ${cm.cohortInsights ? `<p class="dd-cm-cohort-text">${cm.cohortInsights}</p>` : ''}
        ${hasCohortTable ? renderCohortTable(cm.cohortTableData) : ''}
        ${hasCustomerCohort ? renderCustomerCohortTable(cm.customerCohortRows) : ''}
    </div>`;
}

function renderFinancialInsights(c) {
    const rev = c.revenue || [null, null, null];
    const ebitda = c.ebitda || [null, null, null];
    const gp = c.grossProfit || [null, null, null];
    const sga = c.sga || [null, null, null];
    const years = c.years || ['Year 1', 'Year 2', 'Year 3'];

    // Only render if we have at least 2 years of revenue
    const revVals = rev.filter(v => v != null);
    if (revVals.length < 2) return '';

    const insights = [];
    const fmt = v => formatMoney(v);
    const pct = (a, b) => (a != null && b != null && b !== 0) ? Math.round(a / b * 100) : null;
    const growth = (a, b) => (a != null && b != null && a !== 0) ? Math.round((b - a) / Math.abs(a) * 100) : null;

    // Revenue growth
    const g1 = growth(rev[0], rev[1]);
    const g2 = growth(rev[1], rev[2]);
    const latestRev = rev[2] ?? rev[1];
    const latestYear = rev[2] != null ? years[2] : years[1];
    if (g2 != null && g1 != null) {
        const accelerating = g2 > g1;
        const col = g2 >= 20 ? '#10b981' : g2 >= 10 ? '#84cc16' : g2 >= 0 ? '#f59e0b' : '#ef4444';
        const trend = accelerating ? 'accelerating' : 'decelerating';
        insights.push(`<span style="color:${col};font-weight:700">Revenue ${g2 >= 0 ? 'growing' : 'declining'} at ${Math.abs(g2)}% YoY</span> in ${latestYear} (${fmt(latestRev)}), ${trend} from ${g1}% the prior year.`);
    } else if (g1 != null) {
        const col = g1 >= 20 ? '#10b981' : g1 >= 10 ? '#84cc16' : g1 >= 0 ? '#f59e0b' : '#ef4444';
        insights.push(`<span style="color:${col};font-weight:700">Revenue ${g1 >= 0 ? 'grew' : 'declined'} ${Math.abs(g1)}% YoY</span> to ${fmt(rev[1])} in ${years[1]}.`);
    }

    // EBITDA margin trend
    const ebitdaVals = ebitda.filter(v => v != null);
    if (ebitdaVals.length >= 1) {
        const latestEbitda = ebitda[2] ?? ebitda[1] ?? ebitda[0];
        const latestEbitdaRev = rev[ebitda.findIndex(v => v === latestEbitda)];
        const margin = pct(latestEbitda, latestEbitdaRev);
        const prevEbitda = ebitda[2] != null ? ebitda[1] : ebitda[0];
        const prevRev = ebitda[2] != null ? rev[1] : rev[0];
        const prevMargin = pct(prevEbitda, prevRev);
        if (margin != null) {
            const improving = prevMargin != null && margin > prevMargin;
            const col = margin >= 20 ? '#10b981' : margin >= 10 ? '#84cc16' : margin >= 0 ? '#f59e0b' : '#ef4444';
            const trend = prevMargin != null ? ` (${improving ? 'up' : 'down'} from ${prevMargin}% prior year)` : '';
            insights.push(`<span style="color:${col};font-weight:700">EBITDA margin ${margin}%</span>${trend} — ${margin >= 20 ? 'strong profitability' : margin >= 10 ? 'healthy margins' : margin >= 0 ? 'thin margins, limited buffer' : 'loss-making at operating level'}.`);
        }
    }

    // Gross margin
    const gpVals = gp.filter(v => v != null);
    if (gpVals.length >= 1) {
        const latestGP = gp[2] ?? gp[1] ?? gp[0];
        const latestGPRev = rev[gp.findIndex(v => v === latestGP)];
        const gpMargin = pct(latestGP, latestGPRev);
        const prevGP = gp[2] != null ? gp[1] : gp[0];
        const prevGPRev = gp[2] != null ? rev[1] : rev[0];
        const prevGPMargin = pct(prevGP, prevGPRev);
        if (gpMargin != null) {
            const trend = prevGPMargin != null && prevGPMargin !== gpMargin
                ? ` vs ${prevGPMargin}% prior year — ${gpMargin > prevGPMargin ? 'improving' : 'compressing'}`
                : '';
            const col = gpMargin >= 60 ? '#10b981' : gpMargin >= 40 ? '#84cc16' : gpMargin >= 25 ? '#f59e0b' : '#ef4444';
            insights.push(`<span style="color:${col};font-weight:700">Gross margin ${gpMargin}%</span>${trend} — ${gpMargin >= 60 ? 'high-margin business with strong unit economics' : gpMargin >= 40 ? 'solid gross margins' : gpMargin >= 25 ? 'moderate margins, cost structure warrants scrutiny' : 'low gross margins, limited room for overhead'}.`);
        }
    }

    // SG&A efficiency
    const sgaVals = sga.filter(v => v != null);
    if (sgaVals.length >= 1 && revVals.length >= 1) {
        const latestSGA = sga[2] ?? sga[1] ?? sga[0];
        const latestSGARev = rev[sga.findIndex(v => v === latestSGA)];
        const sgaPct = pct(latestSGA, latestSGARev);
        if (sgaPct != null) {
            const col = sgaPct <= 20 ? '#10b981' : sgaPct <= 35 ? '#84cc16' : sgaPct <= 50 ? '#f59e0b' : '#ef4444';
            insights.push(`<span style="color:${col};font-weight:700">SG&A at ${sgaPct}% of revenue</span> — ${sgaPct <= 20 ? 'lean cost structure' : sgaPct <= 35 ? 'efficient overhead' : sgaPct <= 50 ? 'elevated overhead, monitor for leverage' : 'high overhead relative to revenue'}.`);
        }
    }

    if (insights.length === 0) return '';

    return `<div style="margin-top:12px;padding:10px 14px;background:#161B27;border:1px solid #253045;border-radius:7px;font-size:0.78rem;line-height:1.65;color:#8892A4;">
        <div style="font-size:0.62rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#4B5568;margin-bottom:8px;">P&L Key Takeaways</div>
        ${insights.map(s => `<div style="margin-bottom:6px;padding-left:10px;border-left:2px solid #253045;">${s}</div>`).join('')}
    </div>`;
}

function renderBalanceSheetSection(c) {
    const bs = c.balanceSheet || {};
    const years = c.years || ['Year 1', 'Year 2', 'Year 3'];

    const cash = bs.cash || [null, null, null];
    const ar   = bs.accountsReceivable || [null, null, null];
    const inv  = bs.inventory || [null, null, null];
    const tca  = bs.totalCurrentAssets || [null, null, null];
    const ta   = bs.totalAssets || [null, null, null];
    const ap   = bs.accountsPayable || [null, null, null];
    const std  = bs.shortTermDebt || [null, null, null];
    const tcl  = bs.totalCurrentLiabilities || [null, null, null];
    const ltd  = bs.longTermDebt || [null, null, null];
    const tl   = bs.totalLiabilities || [null, null, null];
    const eq   = bs.totalEquity || [null, null, null];

    const allVals = [...cash, ...ar, ...inv, ...tca, ...ta, ...ap, ...std, ...tcl, ...ltd, ...tl, ...eq];
    if (allVals.every(v => v == null)) {
        return `
    <div class="dd-analysis-block">
        <span class="dd-analysis-label">Balance Sheet</span>
        <p style="color:var(--text-muted);font-size:0.82rem;margin-top:8px;">No balance sheet data yet. Use <strong>Edit</strong> to enter manually or <strong>+ Doc</strong> to extract from an uploaded file.</p>
    </div>`;
    }

    const fmt = v => formatMoney(v);

    function bsRow(label, vals, cls = '') {
        if (vals.every(v => v == null)) return '';
        return `<tr class="${cls}"><td>${label}</td>${vals.map(v => `<td>${fmt(v)}</td>`).join('')}</tr>`;
    }
    function bsHead(label) {
        return `<tr class="dd-row-section-head"><td colspan="4">${label}</td></tr>`;
    }
    function ratioRow(label, vals, fmtFn) {
        if (vals.every(v => v == null)) return '';
        return `<tr class="dd-row-sub"><td>${label}</td>${vals.map(v => `<td>${v == null ? '—' : fmtFn(v)}</td>`).join('')}</tr>`;
    }

    // Derived ratios per year
    const currentRatio = [0,1,2].map(i => (tca[i] != null && tcl[i] != null && tcl[i] !== 0) ? tca[i] / tcl[i] : null);
    const netDebt      = [0,1,2].map(i => {
        const d = (std[i] || 0) + (ltd[i] || 0);
        return (d === 0 && cash[i] == null) ? null : d - (cash[i] || 0);
    });
    const deRatio      = [0,1,2].map(i => (tl[i] != null && eq[i] != null && eq[i] !== 0) ? tl[i] / eq[i] : null);
    const hasRatios    = currentRatio.some(v => v != null) || netDebt.some(v => v != null) || deRatio.some(v => v != null);

    const tableHtml = `
    <div class="dd-fin-table-wrap" style="margin-top:12px">
        <table class="dd-fin-table">
            <thead><tr><th></th>${years.map(y => `<th>${y}</th>`).join('')}</tr></thead>
            <tbody>
                ${bsHead('Assets')}
                ${bsRow('Cash &amp; Equiv.', cash, 'dd-row-primary')}
                ${bsRow('Accounts Receivable', ar, 'dd-row-sub')}
                ${bsRow('Inventory', inv, 'dd-row-sub')}
                ${bsRow('Total Current Assets', tca, 'dd-row-primary')}
                ${bsRow('Total Assets', ta, 'dd-row-primary')}
                ${bsHead('Liabilities')}
                ${bsRow('Accounts Payable', ap, 'dd-row-sub')}
                ${bsRow('Short-term Debt', std, 'dd-row-sub')}
                ${bsRow('Total Current Liab.', tcl, 'dd-row-primary')}
                ${bsRow('Long-term Debt', ltd, 'dd-row-sub')}
                ${bsRow('Total Liabilities', tl, 'dd-row-primary')}
                ${bsHead('Equity')}
                ${bsRow('Total Equity', eq, 'dd-row-primary')}
                ${hasRatios ? bsHead('Derived Ratios') : ''}
                ${ratioRow('Current Ratio', currentRatio, v => v.toFixed(2) + 'x')}
                ${ratioRow('Net Debt', netDebt, v => formatMoney(v))}
                ${ratioRow('Debt / Equity', deRatio, v => v.toFixed(2) + 'x')}
            </tbody>
        </table>
    </div>`;

    // Key insights — use latest period with data
    const latestI = tca[2] != null || cash[2] != null ? 2 : tca[1] != null || cash[1] != null ? 1 : 0;
    const prevI   = latestI > 0 ? latestI - 1 : null;
    const rev     = c.revenue || [null, null, null];
    const insights = [];

    const cr = currentRatio[latestI];
    if (cr != null) {
        const col   = cr >= 2 ? '#10b981' : cr >= 1.5 ? '#84cc16' : cr >= 1 ? '#f59e0b' : '#ef4444';
        const label = cr >= 2 ? 'strong liquidity' : cr >= 1.5 ? 'adequate liquidity' : cr >= 1 ? 'thin liquidity buffer — monitor closely' : 'current liabilities exceed current assets — liquidity risk';
        insights.push(`<span style="color:${col};font-weight:700">Current ratio ${cr.toFixed(2)}x</span> — ${label}.`);
    }

    if (cash[latestI] != null && prevI != null && cash[prevI] != null) {
        const delta = cash[latestI] - cash[prevI];
        const col   = delta >= 0 ? '#10b981' : '#ef4444';
        const dir   = delta >= 0 ? 'increased' : 'decreased';
        insights.push(`<span style="color:${col};font-weight:700">Cash ${dir} by ${formatMoney(Math.abs(delta))}</span> to ${formatMoney(cash[latestI])} in ${years[latestI]} — ${delta >= 0 ? 'positive cash generation' : 'cash burn requires monitoring'}.`);
    }

    const nd = netDebt[latestI];
    if (nd != null) {
        const latestRev = rev[latestI];
        if (latestRev && nd > 0) {
            const ndRev = nd / latestRev;
            const col   = ndRev < 1 ? '#84cc16' : ndRev < 2 ? '#f59e0b' : '#ef4444';
            insights.push(`<span style="color:${col};font-weight:700">Leverage at ${ndRev.toFixed(1)}x Net Debt/Revenue</span> — ${formatMoney(nd)} net debt vs ${formatMoney(latestRev)} revenue.`);
        } else if (nd <= 0) {
            insights.push(`<span style="color:#10b981;font-weight:700">Net cash position</span> of ${formatMoney(Math.abs(nd))} in ${years[latestI]} — no net debt on the balance sheet.`);
        }
    }

    const de = deRatio[latestI];
    if (de != null) {
        const col   = de <= 0.5 ? '#10b981' : de <= 1 ? '#84cc16' : de <= 2 ? '#f59e0b' : '#ef4444';
        const label = de <= 0.5 ? 'conservatively financed' : de <= 1 ? 'moderate leverage' : de <= 2 ? 'moderately leveraged — debt servicing warrants attention' : 'highly leveraged';
        insights.push(`<span style="color:${col};font-weight:700">Debt/Equity ${de.toFixed(2)}x</span> — ${label}.`);
    }

    if (tca[latestI] != null && tcl[latestI] != null && prevI != null && tca[prevI] != null && tcl[prevI] != null) {
        const wcNow  = tca[latestI] - tcl[latestI];
        const wcPrev = tca[prevI] - tcl[prevI];
        const delta  = wcNow - wcPrev;
        const col    = delta >= 0 ? '#10b981' : '#f59e0b';
        const dir    = delta >= 0 ? 'improved' : 'tightened';
        insights.push(`<span style="color:${col};font-weight:700">Working capital ${dir}</span> from ${formatMoney(wcPrev)} to ${formatMoney(wcNow)} — ${wcNow >= 0 ? 'positive working capital supports operations' : 'negative working capital — operational funding risk'}.`);
    }

    const insightBox = insights.length === 0 ? '' : `
    <div style="margin-top:10px;padding:10px 14px;background:var(--surface-1);border:1px solid var(--border-color);border-radius:7px;font-size:0.78rem;line-height:1.65;color:var(--text-secondary);">
        <div style="font-size:0.62rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;">Balance Sheet Key Takeaways</div>
        ${insights.map(s => `<div style="margin-bottom:6px;padding-left:10px;border-left:2px solid var(--border-color);">${s}</div>`).join('')}
    </div>`;

    return `
    <div class="dd-analysis-block">
        <span class="dd-analysis-label">Balance Sheet</span>
        ${tableHtml}
        ${insightBox}
    </div>`;
}

function renderCompanyCard(c) {
    const expanded = ddExpanded.has(c.id);
    const rev = c.revenue || [null, null, null];
    const ebitda = c.ebitda || [null, null, null];
    const gp = c.grossProfit || [null, null, null];
    const sga = c.sga || [null, null, null];
    const years = c.years || ['Year 1', 'Year 2', 'Year 3'];
    const cm = c.customerMetrics || null;

    // Latest-year headline metrics for compact view
    const latestRev = rev[2] ?? rev[1] ?? rev[0];
    const prevRev = rev[2] != null ? rev[1] : rev[0];
    const revGrowth = growthPct(prevRev, latestRev);
    const latestEbitda = ebitda[2] ?? ebitda[1] ?? ebitda[0];
    const ebitdaMargin = (latestEbitda != null && latestRev) ? latestEbitda / latestRev * 100 : null;
    const latestGP = gp[2] ?? gp[1] ?? gp[0];
    const gpMargin = (latestGP != null && latestRev) ? latestGP / latestRev * 100 : null;

    const compactMetrics = [
        latestRev != null ? `Rev ${formatMoney(latestRev)}${revGrowth != null ? ' <span class="dd-growth ' + (revGrowth >= 0 ? 'pos' : 'neg') + '">(' + (revGrowth >= 0 ? '+' : '') + revGrowth.toFixed(1) + '% YoY)</span>' : ''}` : null,
        latestEbitda != null ? `EBITDA ${formatMoney(latestEbitda)}${ebitdaMargin != null ? ' <span class="dd-metric-muted">(' + ebitdaMargin.toFixed(1) + '%)</span>' : ''}` : null,
        gpMargin != null ? `GP Margin <span class="dd-metric-muted">${gpMargin.toFixed(1)}%</span>` : null,
        cm && cm.nrr != null ? `NRR <span class="${nrrClass(cm.nrr)}">${cm.nrr.toFixed(1)}%</span>` : null,
        cm && cm.top1CustomerPct != null ? `Top Cust <span class="${concClass(cm.top1CustomerPct)}">${cm.top1CustomerPct.toFixed(1)}%</span>` : null,
    ].filter(Boolean).join('<span class="dd-dot">·</span>');

    const expandedContent = expanded ? `
        <div class="dd-expanded-body">
            ${c.description ? `<p class="dd-description">${c.description}</p>` : ''}
            ${c.documentSummary ? `<div class="dd-analysis-block dd-doc-summary"><span class="dd-analysis-label">Document Summary</span><p>${c.documentSummary}</p></div>` : ''}
            ${c.investmentThesis ? `<div class="dd-analysis-block dd-thesis"><span class="dd-analysis-label">Investment Thesis</span><p>${c.investmentThesis}</p></div>` : ''}
            ${c.keyRisks ? `<div class="dd-analysis-block dd-risks"><span class="dd-analysis-label">Key Risks</span><p>${c.keyRisks.replace(/\n/g, '<br>')}</p></div>` : ''}
            ${renderCustomerMetrics(cm)}
            ${c.sourceFile ? `<div class="dd-source-file">Source: ${c.sourceFile}</div>` : ''}
            <div class="dd-fin-table-wrap">
                <table class="dd-fin-table">
                    <thead><tr>
                        <th></th>
                        ${years.map(y => `<th>${y}</th>`).join('')}
                    </tr></thead>
                    <tbody>
                        <tr class="dd-row-primary">
                            <td>Revenue</td>
                            ${rev.map(v => `<td>${formatMoney(v)}</td>`).join('')}
                        </tr>
                        <tr class="dd-row-sub">
                            <td>YoY Growth</td>
                            <td>—</td>
                            <td>${fmtGrowth(growthPct(rev[0], rev[1]))}</td>
                            <td>${fmtGrowth(growthPct(rev[1], rev[2]))}</td>
                        </tr>
                        <tr class="dd-row-primary">
                            <td>EBITDA</td>
                            ${ebitda.map(v => `<td>${formatMoney(v)}</td>`).join('')}
                        </tr>
                        <tr class="dd-row-sub">
                            <td>Margin</td>
                            ${ebitda.map((v, i) => `<td>${fmtPct(v, rev[i])}</td>`).join('')}
                        </tr>
                        <tr class="dd-row-sub">
                            <td>YoY Growth</td>
                            <td>—</td>
                            <td>${fmtGrowth(growthPct(ebitda[0], ebitda[1]))}</td>
                            <td>${fmtGrowth(growthPct(ebitda[1], ebitda[2]))}</td>
                        </tr>
                        <tr class="dd-row-primary">
                            <td>Gross Profit</td>
                            ${gp.map(v => `<td>${formatMoney(v)}</td>`).join('')}
                        </tr>
                        <tr class="dd-row-sub">
                            <td>GP Margin</td>
                            ${gp.map((v, i) => `<td>${fmtPct(v, rev[i])}</td>`).join('')}
                        </tr>
                        <tr class="dd-row-primary">
                            <td>SG&amp;A</td>
                            ${sga.map(v => `<td>${formatMoney(v)}</td>`).join('')}
                        </tr>
                        <tr class="dd-row-sub">
                            <td>% of Revenue</td>
                            ${sga.map((v, i) => `<td>${fmtPct(v, rev[i])}</td>`).join('')}
                        </tr>
                    </tbody>
                </table>
            </div>
            ${renderFinancialInsights(c)}
            ${renderBalanceSheetSection(c)}
        </div>` : '';

    const websiteDisplay = c.website ? c.website.replace(/^https?:\/\//, '') : '';

    return `
        <div class="dd-card ${expanded ? 'dd-card-expanded' : ''}" data-id="${c.id}">
            <div class="dd-card-header" onclick="toggleDDCard('${c.id}')">
                <div class="dd-card-title-wrap">
                    <span class="dd-card-name">${c.name}</span>
                    ${c.website ? `<a href="${c.website}" target="_blank" class="dd-website" onclick="event.stopPropagation()">${websiteDisplay}</a>` : ''}
                </div>
                <div class="dd-card-actions">
                    <button class="dd-action-btn" onclick="event.stopPropagation(); openDDUpload('${c.id}')">+ Doc</button>
                    <button class="dd-action-btn" onclick="event.stopPropagation(); openDDEditor('${c.id}')">Edit</button>
                    <button class="dd-action-btn dd-action-delete" onclick="event.stopPropagation(); deleteCompany('${c.id}')">✕</button>
                    <span class="dd-expand-icon">${expanded ? '▲' : '▼'}</span>
                </div>
            </div>
            <div class="dd-card-metrics">${compactMetrics || '<span class="dd-metric-muted">No financial data</span>'}</div>
            ${expandedContent}
        </div>`;
}

function toggleDDCard(id) {
    if (ddExpanded.has(id)) ddExpanded.delete(id);
    else ddExpanded.add(id);
    renderDDCards();
}

function openDDEditor(id = null) {
    const panel = document.getElementById('dd-editor-panel');
    const titleEl = document.getElementById('dd-editor-title');

    if (id) {
        const c = ddCompanies.find(x => x.id === id);
        if (!c) return;
        titleEl.textContent = 'Edit Company';
        document.getElementById('dd-edit-id').value = c.id;
        document.getElementById('dd-edit-name').value = c.name || '';
        document.getElementById('dd-edit-website').value = c.website || '';
        document.getElementById('dd-edit-desc').value = c.description || '';
        const yrs = c.years || ['', '', ''];
        const rev = c.revenue || [null, null, null];
        const ebitda = c.ebitda || [null, null, null];
        const gp = c.grossProfit || [null, null, null];
        const sga = c.sga || [null, null, null];
        [1, 2, 3].forEach(i => {
            document.getElementById(`dd-y${i}`).value = yrs[i - 1] || '';
            document.getElementById(`dd-rev${i}`).value = rev[i - 1] != null ? formatMoney(rev[i - 1]).replace(/[$,]/g, '') : '';
            document.getElementById(`dd-ebitda${i}`).value = ebitda[i - 1] != null ? formatMoney(ebitda[i - 1]).replace(/[$,]/g, '') : '';
            document.getElementById(`dd-gp${i}`).value = gp[i - 1] != null ? formatMoney(gp[i - 1]).replace(/[$,]/g, '') : '';
            document.getElementById(`dd-sga${i}`).value = sga[i - 1] != null ? formatMoney(sga[i - 1]).replace(/[$,]/g, '') : '';
        });
        // Balance sheet
        const bs = c.balanceSheet || {};
        const bsFields = ['cash','accountsReceivable','inventory','totalCurrentAssets','totalAssets',
                          'accountsPayable','shortTermDebt','totalCurrentLiabilities','longTermDebt',
                          'totalLiabilities','totalEquity'];
        const bsIds    = ['cash','ar','inv','tca','ta','ap','std','tcl','ltd','tl','eq'];
        bsFields.forEach((field, fi) => {
            const vals = bs[field] || [null, null, null];
            [1, 2, 3].forEach(i => {
                const el = document.getElementById(`dd-bs-${bsIds[fi]}${i}`);
                if (el) el.value = vals[i - 1] != null ? formatMoney(vals[i - 1]).replace(/[$,]/g, '') : '';
            });
        });
    } else {
        titleEl.textContent = 'Add Company';
        document.getElementById('dd-editor-form').reset();
        document.getElementById('dd-edit-id').value = '';
    }
    panel.classList.add('open');
}

function closeDDEditor() {
    document.getElementById('dd-editor-panel').classList.remove('open');
}

async function deleteCompany(id) {
    const c = ddCompanies.find(x => x.id === id);
    if (!c || !confirm(`Delete "${c.name}"?`)) return;
    await fetch(`/api/companies/${id}`, { method: 'DELETE' });
    ddExpanded.delete(id);
    await loadDD();
}

document.getElementById('dd-editor-form').addEventListener('submit', async e => {
    e.preventDefault();
    const id = document.getElementById('dd-edit-id').value;
    const panel = document.getElementById('dd-editor-panel');
    const bsFieldNames = ['cash','accountsReceivable','inventory','totalCurrentAssets','totalAssets',
                          'accountsPayable','shortTermDebt','totalCurrentLiabilities','longTermDebt',
                          'totalLiabilities','totalEquity'];
    const bsInputIds   = ['cash','ar','inv','tca','ta','ap','std','tcl','ltd','tl','eq'];
    const balanceSheet = {};
    bsFieldNames.forEach((field, fi) => {
        balanceSheet[field] = [1, 2, 3].map(i => parseMoney(document.getElementById(`dd-bs-${bsInputIds[fi]}${i}`).value));
    });

    const payload = {
        name: document.getElementById('dd-edit-name').value.trim(),
        website: document.getElementById('dd-edit-website').value.trim(),
        description: document.getElementById('dd-edit-desc').value.trim(),
        years: [1, 2, 3].map(i => document.getElementById(`dd-y${i}`).value.trim()),
        revenue: [1, 2, 3].map(i => parseMoney(document.getElementById(`dd-rev${i}`).value)),
        ebitda: [1, 2, 3].map(i => parseMoney(document.getElementById(`dd-ebitda${i}`).value)),
        grossProfit: [1, 2, 3].map(i => parseMoney(document.getElementById(`dd-gp${i}`).value)),
        sga: [1, 2, 3].map(i => parseMoney(document.getElementById(`dd-sga${i}`).value)),
        balanceSheet,
    };
    // Merge in any pending analysis data from document upload
    const pending = panel.dataset.pendingAnalysis;
    if (pending) {
        try { Object.assign(payload, JSON.parse(pending)); } catch (e) {}
        delete panel.dataset.pendingAnalysis;
    }
    if (id) {
        await fetch(`/api/companies/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } else {
        await fetch('/api/companies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }
    closeDDEditor();
    await loadDD();
});

document.getElementById('addCompanyBtn').addEventListener('click', () => openDDEditor());
document.getElementById('dd-editor-back').addEventListener('click', closeDDEditor);
document.getElementById('uploadDocBtn').addEventListener('click', () => openDDUpload());

// DD Document Upload
let ddUploadFiles = [];
let ddUploadTargetId = null; // null = new company, set = update existing
let _pendingAnalysisData = null;
let _pendingFile = null;

function openDDUpload(companyId = null) {
    ddUploadFiles = [];
    ddUploadTargetId = companyId || null;
    _pendingAnalysisData = null;
    _pendingFile = null;

    // Banner: amber for existing, hidden for new
    const banner = document.getElementById('dd-upload-target-banner');
    if (companyId) {
        const company = ddCompanies.find(c => c.id === companyId);
        const name = company ? company.name : 'company';
        document.getElementById('dd-upload-title').textContent = 'Add Document to Company';
        document.getElementById('dd-upload-desc').textContent = `Upload a file to add data to ${name}.`;
        document.getElementById('dd-upload-target-label').textContent = `Updating: ${name}`;
        banner.className = 'dd-upload-target-banner dd-upload-target-banner--existing';
        banner.classList.remove('hidden');
    } else {
        document.getElementById('dd-upload-title').textContent = 'Upload & Analyze Document';
        document.getElementById('dd-upload-desc').textContent = 'Upload a PDF, Word, or Excel file. Claude will extract financial data and create a new company card automatically.';
        banner.classList.add('hidden');
    }

    document.getElementById('dd-upload-input-section').classList.remove('hidden');
    document.getElementById('dd-upload-progress').classList.add('hidden');
    document.getElementById('dd-new-company-confirm').classList.add('hidden');
    document.getElementById('dd-upload-done-actions').style.display = 'none';
    document.getElementById('dd-file-selected').classList.add('hidden');
    document.getElementById('dd-drop-zone').classList.remove('dd-drop-zone-has-file');
    document.getElementById('dd-file-input').value = '';
    document.getElementById('dd-upload-modal').classList.remove('hidden');
}

function closeDDUpload() {
    document.getElementById('dd-upload-modal').classList.add('hidden');
    ddUploadFiles = [];
    ddUploadTargetId = null;
    _pendingAnalysisData = null;
    _pendingFile = null;
}

function handleDDDrop(e) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => /\.(pdf|docx|xlsx|xls|txt)$/i.test(f.name));
    if (files.length) setDDFiles(files);
}

function handleDDFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length) setDDFiles(files);
}

function setDDFiles(files) {
    ddUploadFiles = files;
    document.getElementById('dd-file-name').textContent = files.length === 1 ? files[0].name : `${files.length} files selected`;
    document.getElementById('dd-file-selected').classList.remove('hidden');
    document.getElementById('dd-drop-zone').classList.add('dd-drop-zone-has-file');
}

function clearDDFile() {
    ddUploadFiles = [];
    document.getElementById('dd-file-input').value = '';
    document.getElementById('dd-file-selected').classList.add('hidden');
    document.getElementById('dd-drop-zone').classList.remove('dd-drop-zone-has-file');
}

function addDDStep(msg, status = 'running') {
    const el = document.createElement('div');
    el.className = `yt-step yt-step-${status}`;
    const icon = status === 'done' ? '✓' : status === 'error' ? '✗' : '◌';
    el.innerHTML = `<span class="yt-step-icon">${icon}</span><span class="yt-step-text">${msg}</span>`;
    document.getElementById('dd-upload-steps').appendChild(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return el;
}

function updateDDStep(el, status, msg) {
    el.className = `yt-step yt-step-${status}`;
    const icon = status === 'done' ? '✓' : status === 'error' ? '✗' : '◌';
    el.innerHTML = `<span class="yt-step-icon">${icon}</span><span class="yt-step-text">${msg}</span>`;
}

async function startDDUpload() {
    if (!ddUploadFiles.length) return;

    document.getElementById('dd-upload-input-section').classList.add('hidden');
    document.getElementById('dd-upload-progress').classList.remove('hidden');
    document.getElementById('dd-upload-steps').innerHTML = '';
    document.getElementById('dd-new-company-confirm').classList.add('hidden');
    document.getElementById('dd-upload-done-actions').style.display = 'none';

    for (const file of ddUploadFiles) {
        await analyzeAndSaveFile(file);
    }

    // For existing company uploads, show Done button immediately after all files processed.
    // For new company, the confirm panel is shown instead — Done button appears after Save.
    if (ddUploadTargetId) {
        await loadDD();
        document.getElementById('dd-upload-done-actions').style.display = 'flex';
    }
}

async function analyzeAndSaveFile(file) {
    const uploadStep = addDDStep(`Uploading ${file.name}…`);
    const analyzeStep = addDDStep(`Analyzing with Claude…`);
    const formData = new FormData();
    formData.append('file', file);
    try {
        const res = await fetch('/api/dd/analyze-document', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Analysis failed');

        updateDDStep(uploadStep, 'done', `Uploaded ${file.name}`);
        updateDDStep(analyzeStep, 'done', `Analysis complete`);

        if (ddUploadTargetId) {
            await mergeIntoExistingCompany(data, file);
        } else {
            showNewCompanyConfirm(data, file);
        }
    } catch (err) {
        updateDDStep(uploadStep, 'error', `Upload failed`);
        updateDDStep(analyzeStep, 'error', err.message);
        document.getElementById('dd-upload-done-actions').style.display = 'flex';
    }
}

async function mergeIntoExistingCompany(data, file) {
    const existing = ddCompanies.find(c => c.id === ddUploadTargetId) || {};
    const saveStep = addDDStep(`Saving to ${existing.name || 'company'}…`);
    try {
        const existingCm = existing.customerMetrics || {};
        const newCm = data.customerMetrics || {};
        const mergedCm = {};
        const cmKeys = ['nrr','grr','logoChurnRate','revenueChurnRate','top1CustomerPct','top3CustomerPct','top5CustomerPct','top10CustomerPct','customerCount','arpu','ltvCacRatio','cacPaybackMonths','ruleOf40','expansionRevenuePct','cohortInsights','valueChurnByYear','logoChurnByYear','cohortNRR','customerCohortRows','cohortTableData'];
        const hasValue = v => v != null && v !== '' && !(Array.isArray(v) && v.length === 0);
        for (const k of cmKeys) mergedCm[k] = hasValue(newCm[k]) ? newCm[k] : (existingCm[k] ?? null);

        const existingBs = existing.balanceSheet || {};
        const newBs = data.balanceSheet || {};
        const bsMergeFields = ['cash','accountsReceivable','inventory','totalCurrentAssets','totalAssets','accountsPayable','shortTermDebt','totalCurrentLiabilities','longTermDebt','totalLiabilities','totalEquity'];
        const mergedBs = {};
        for (const k of bsMergeFields) {
            const n = newBs[k] || [null,null,null], o = existingBs[k] || [null,null,null];
            mergedBs[k] = n.map((v, i) => v != null ? v : (o[i] ?? null));
        }

        await fetch(`/api/companies/${ddUploadTargetId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: existing.name,
                website: existing.website || data.website || '',
                description: existing.description || data.description || '',
                years: data.years?.some(y => y) ? data.years : (existing.years || ['','','']),
                revenue: data.revenue?.some(v => v != null) ? data.revenue : (existing.revenue || [null,null,null]),
                ebitda: data.ebitda?.some(v => v != null) ? data.ebitda : (existing.ebitda || [null,null,null]),
                grossProfit: data.grossProfit?.some(v => v != null) ? data.grossProfit : (existing.grossProfit || [null,null,null]),
                sga: data.sga?.some(v => v != null) ? data.sga : (existing.sga || [null,null,null]),
                netIncome: data.netIncome?.some(v => v != null) ? data.netIncome : (existing.netIncome || [null,null,null]),
                documentSummary: data.documentSummary || existing.documentSummary || '',
                investmentThesis: data.investmentThesis || existing.investmentThesis || '',
                keyRisks: data.keyRisks || existing.keyRisks || '',
                sourceFile: [existing.sourceFile, file.name].filter(Boolean).join(', '),
                customerMetrics: mergedCm,
                balanceSheet: mergedBs,
            })
        });
        updateDDStep(saveStep, 'done', `${existing.name} updated`);
    } catch (err) {
        updateDDStep(saveStep, 'error', `Save failed: ${err.message}`);
        document.getElementById('dd-upload-done-actions').style.display = 'flex';
    }
}

function showNewCompanyConfirm(data, file) {
    _pendingAnalysisData = data;
    _pendingFile = file;

    document.getElementById('dd-confirm-name').value = data.name || file.name.replace(/\.[^.]+$/, '');

    const years = data.years || [], rev = data.revenue || [];
    const finParts = years.map((y, i) => y && rev[i] != null ? `${y}: $${(rev[i]/1e6).toFixed(1)}M rev` : null).filter(Boolean);
    document.getElementById('dd-confirm-financials').textContent = finParts.join(' · ');

    document.getElementById('dd-new-company-confirm').classList.remove('hidden');
    document.getElementById('dd-confirm-create-btn').onclick = saveNewCompany;
}

async function saveNewCompany() {
    const data = _pendingAnalysisData;
    const file = _pendingFile;
    const name = document.getElementById('dd-confirm-name').value.trim() || data.name || file.name.replace(/\.[^.]+$/, '');
    document.getElementById('dd-new-company-confirm').classList.add('hidden');
    const saveStep = addDDStep(`Saving ${name}…`);
    try {
        await fetch('/api/companies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                website: data.website || '',
                description: data.description || '',
                years: data.years || ['','',''],
                revenue: data.revenue || [null,null,null],
                ebitda: data.ebitda || [null,null,null],
                grossProfit: data.grossProfit || [null,null,null],
                sga: data.sga || [null,null,null],
                documentSummary: data.documentSummary || '',
                investmentThesis: data.investmentThesis || '',
                keyRisks: data.keyRisks || '',
                sourceFile: data.sourceFile || file.name,
                netIncome: data.netIncome || [null,null,null],
                balanceSheet: data.balanceSheet || {},
            })
        });
        updateDDStep(saveStep, 'done', `${name} added to DD Board`);
        await loadDD();
        document.getElementById('dd-upload-done-actions').style.display = 'flex';
    } catch (err) {
        updateDDStep(saveStep, 'error', `Save failed: ${err.message}`);
        document.getElementById('dd-upload-done-actions').style.display = 'flex';
    }
}

// HubSpot
async function loadHubspot() {
    const loading = document.getElementById('hubspot-loading');
    const error = document.getElementById('hubspot-error');
    const content = document.getElementById('hubspot-content');

    loading.classList.remove('hidden');
    error.classList.add('hidden');
    content.classList.add('hidden');

    try {
        const res = await fetch('/api/hubspot');
        if (!res.ok) throw new Error('Failed to fetch');
        const d = await res.json();

        document.getElementById('hs-total-contacts').textContent = d.totalContacts.toLocaleString();
        document.getElementById('hs-total-companies').textContent = d.totalCompanies.toLocaleString();
        document.getElementById('hs-total-deals').textContent = d.totalDeals.toLocaleString();
        document.getElementById('hs-pipeline-value').textContent = '$' + d.totalPipelineValue.toLocaleString(undefined, { maximumFractionDigits: 0 });
        document.getElementById('hs-new-contacts').textContent = d.newContactsLast30Days.toLocaleString();

        // Deals by stage
        const stageEl = document.getElementById('hs-deals-by-stage');
        const stages = Object.entries(d.dealsByStage);
        if (stages.length === 0) {
            stageEl.innerHTML = '<p class="hs-empty">No deals found</p>';
        } else {
            const max = Math.max(...stages.map(s => s[1]));
            stageEl.innerHTML = stages.map(([stage, count]) => `
                <div class="hs-stage-row">
                    <div class="hs-stage-name">${stage}</div>
                    <div class="hs-stage-bar-wrap">
                        <div class="hs-stage-bar" style="width: ${(count/max*100).toFixed(0)}%"></div>
                    </div>
                    <div class="hs-stage-count">${count}</div>
                </div>
            `).join('');
        }

        // Recent deals
        const dealsEl = document.getElementById('hs-recent-deals');
        if (d.recentDeals.length === 0) {
            dealsEl.innerHTML = '<p class="hs-empty">No deals found</p>';
        } else {
            dealsEl.innerHTML = d.recentDeals.map(deal => `
                <div class="hs-deal-row">
                    <div class="hs-deal-stage">${deal.stage}</div>
                    <div class="hs-deal-amount">${deal.amount ? '$' + deal.amount.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}</div>
                    <div class="hs-deal-date">${deal.closedate ? new Date(deal.closedate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No close date'}</div>
                </div>
            `).join('');
        }

        loading.classList.add('hidden');
        content.classList.remove('hidden');

        // Load deal funnel in parallel (non-blocking)
        loadFunnel();
    } catch (err) {
        loading.classList.add('hidden');
        error.classList.remove('hidden');
        error.textContent = 'Failed to load HubSpot data. Please check your API key.';
    }
}

document.getElementById('refreshHubspot').addEventListener('click', loadHubspot);

// Initialize
initDarkMode();
loadData();
