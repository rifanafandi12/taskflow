// ========== STATE ==========
const state = {
  tasks: [],
  search: '',
  page: 1,
  limit: 10,
  loading: false,
  hasMore: true,
};

// ========== DOM REFS ==========
const $ = (sel) => document.querySelector(sel);
const listEl = $('#list');
const emptyEl = $('#empty');
const loadMoreWrap = $('#load-more-wrap');
const loadMoreBtn = $('#load-more');
const form = $('#task-form');
const searchInput = $('#search');
const toastEl = $('#toast');
const editModal = $('#edit-modal');
const editForm = $('#edit-form');

// ========== HELPERS ==========
const STATUS_LABEL = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

function showToast(msg, type = '') {
  toastEl.textContent = msg;
  toastEl.className = 'toast ' + type;
  toastEl.hidden = false;
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(() => { toastEl.hidden = true; }, 2600);
}

function escapeHtml(str = '') {
  return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function createTaskEl(task) {
  const el = document.createElement('div');
  el.className = 'task-item' + (task.status === 'done' ? ' done' : '');
  el.dataset.id = task.id;
  el.innerHTML = `
    <div class="checkbox">
      <input type="checkbox" id="cb-${task.id}" ${task.status === 'done' ? 'checked' : ''}>
      <label for="cb-${task.id}">
        <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </label>
    </div>
    <div class="task-body">
      <div class="task-title">${escapeHtml(task.title)}</div>
      ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
    </div>
    <div class="task-meta">
      <span class="badge ${task.status}">${STATUS_LABEL[task.status]}</span>
      <button class="icon-btn" data-action="edit" title="Edit">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
      </button>
      <button class="icon-btn danger" data-action="delete" title="Hapus">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
      </button>
    </div>
  `;

  // Toggle status via checkbox
  el.querySelector('input[type="checkbox"]').addEventListener('change', async (e) => {
    const newStatus = e.target.checked ? 'done' : 'todo';
    await updateTask(task.id, { status: newStatus });
  });

  // Edit
  el.querySelector('[data-action="edit"]').addEventListener('click', () => openEditModal(task));
  // Delete
  el.querySelector('[data-action="delete"]').addEventListener('click', () => deleteTask(task.id, el));

  return el;
}

function renderTasks() {
  const filtered = state.tasks.filter((t) =>
    t.title.toLowerCase().includes(state.search.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(state.search.toLowerCase())
  );
  listEl.innerHTML = '';
  if (filtered.length === 0 && !state.loading) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;
  filtered.forEach((t) => listEl.appendChild(createTaskEl(t)));
}

function showSkeleton() {
  listEl.innerHTML = Array.from({ length: 5 }).map(() =>
    `<div class="skeleton skeleton-item"></div>`
  ).join('');
  emptyEl.hidden = true;
}

// ========== API ==========
async function fetchTasks(append = false) {
  if (state.loading) return;
  state.loading = true;
  if (!append) showSkeleton();

  try {
    const res = await fetch('/api/tasks');
    if (!res.ok) throw new Error('Gagal memuat tugas');
    const data = await res.json();

    // Simulasi pagination client-side (load more)
    if (append) {
      const start = state.tasks.length;
      state.tasks = state.tasks.concat(data.slice(start, start + state.limit));
      data.forEach((t, i) => {
        if (i >= start && i < start + state.limit) {
          const el = createTaskEl(t);
          listEl.appendChild(el);
        }
      });
    } else {
      state.tasks = data;
      renderTasks();
    }

    state.hasMore = state.tasks.length < data.length;
    loadMoreWrap.hidden = !state.hasMore;
  } catch (err) {
    showToast(err.message, 'error');
    emptyEl.hidden = false;
  } finally {
    state.loading = false;
  }
}

async function createTask(payload) {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Gagal menambah tugas');
  }
  return res.json();
}

async function updateTask(id, payload) {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Gagal update tugas');
  }
  return res.json();
}

async function deleteTask(id, el) {
  if (!confirm('Hapus tugas ini?')) return;
  try {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Gagal menghapus');
    el.classList.add('removing');
    setTimeout(() => {
      state.tasks = state.tasks.filter((t) => t.id !== id);
      el.remove();
      if (state.tasks.length === 0) emptyEl.hidden = false;
    }, 300);
    showToast('Tugas dihapus', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ========== EVENTS ==========
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = $('#title').value.trim();
  const description = $('#description').value.trim();
  const status = $('#status').value;
  if (!title) return;
  try {
    await createTask({ title, description, status });
    form.reset();
    showToast('Tugas ditambahkan', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
});

searchInput.addEventListener('input', (e) => {
  state.search = e.target.value;
  renderTasks();
});

loadMoreBtn.addEventListener('click', () => fetchTasks(true));

// Modal
function openEditModal(task) {
  $('#edit-id').value = task.id;
  $('#edit-title').value = task.title;
  $('#edit-description').value = task.description || '';
  $('#edit-status').value = task.status;
  editModal.hidden = false;
}

editModal.addEventListener('click', (e) => {
  if (e.target.matches('[data-close], .modal-backdrop')) editModal.hidden = true;
});

editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = $('#edit-id').value;
  try {
    await updateTask(id, {
      title: $('#edit-title').value.trim(),
      description: $('#edit-description').value.trim(),
      status: $('#edit-status').value,
    });
    editModal.hidden = true;
    showToast('Tugas diperbarui', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// ========== WEBSOCKET ==========
const socket = io();
socket.on('task:created', (task) => {
  if (!state.tasks.find((t) => t.id === task.id)) {
    state.tasks.unshift(task);
    renderTasks();
    showToast(`Tugas baru: ${task.title}`, 'success');
  }
});
socket.on('task:updated', (task) => {
  const idx = state.tasks.findIndex((t) => t.id === task.id);
  if (idx !== -1) {
    state.tasks[idx] = task;
    renderTasks();
  }
});
socket.on('task:deleted', ({ id }) => {
  state.tasks = state.tasks.filter((t) => t.id !== id);
  renderTasks();
});

// ========== INIT ==========
fetchTasks();