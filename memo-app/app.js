import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { ref, push, set, update, remove, onValue, get } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";

// ── 앱 상태 ──
let todos       = [];
let currentId   = null;
let currentUser = null;
let saveTimer   = null;
let pendingDeleteId = null;
let unsubTodos  = null;
let filterMode  = 'all'; // 'all' | 'important'

// ── DOM ──
const loadingScreen = document.getElementById('loadingScreen');
const mainApp       = document.getElementById('mainApp');
const todoList      = document.getElementById('todoList');
const todoCount     = document.getElementById('todoCount');
const editorEmpty   = document.getElementById('editorEmpty');
const editorContent = document.getElementById('editorContent');
const titleInput    = document.getElementById('titleInput');
const titleInputMb  = document.getElementById('titleInputMobile');
const bodyInput     = document.getElementById('bodyInput');
const dateInput     = document.getElementById('dateInput');
const saveStatus    = document.getElementById('saveStatus');
const saveStatusMb  = document.getElementById('saveStatusMobile');
const charCount     = document.getElementById('charCount');
const lastModified  = document.getElementById('lastModified');
const searchInput   = document.getElementById('searchInput');
const deleteModal   = document.getElementById('deleteModal');
const userBadge     = document.getElementById('userBadge');
const btnImportant  = document.getElementById('btnImportant');
const btnImportantMb = document.getElementById('btnImportantMobile');

// ════════════════════════════════════════
//  인증 상태 감지 — 페이지 진입 시 확인
// ════════════════════════════════════════
onAuthStateChanged(auth, async (user) => {
  loadingScreen.classList.add('hidden');

  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  // 사용자 프로필 로드
  const snap    = await get(ref(db, `users/${user.uid}`));
  const profile = snap.val() || {};
  currentUser   = { uid: user.uid, email: user.email, name: profile.name || '', org: profile.org || '' };

  userBadge.textContent = `${currentUser.org} · ${currentUser.name}(${currentUser.email})`;
  mainApp.classList.remove('hidden');

  setupTodosListener(user.uid);
});

function setupTodosListener(uid) {
  if (unsubTodos) unsubTodos();
  unsubTodos = onValue(ref(db, `todos/${uid}`), (snapshot) => {
    const data = snapshot.val();
    todos = data
      ? Object.entries(data).map(([id, val]) => ({ id, ...val }))
      : [];
    todos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    renderList(searchInput.value);
  });
}

// ════════════════════════════════════════
//  이벤트 등록
// ════════════════════════════════════════
document.getElementById('btnLogout').addEventListener('click', async () => {
  if (unsubTodos) { unsubTodos(); unsubTodos = null; }
  await signOut(auth);
  window.location.href = 'index.html';
});

// ── 필터 탭 ──
document.getElementById('filterAll').addEventListener('click', () => setFilter('all'));
document.getElementById('filterImportant').addEventListener('click', () => setFilter('important'));

function setFilter(mode) {
  filterMode = mode;
  document.getElementById('filterAll').classList.toggle('active', mode === 'all');
  document.getElementById('filterImportant').classList.toggle('active', mode === 'important');
  renderList(searchInput.value);
}

document.getElementById('btnNew').addEventListener('click', createTodo);
document.getElementById('btnDelete').addEventListener('click', () => openDeleteModal(currentId));
document.getElementById('btnDeleteMobile').addEventListener('click', () => openDeleteModal(currentId));
btnImportant.addEventListener('click', () => toggleImportant(currentId));
btnImportantMb.addEventListener('click', () => toggleImportant(currentId));
document.getElementById('btnBack').addEventListener('click', goBackToList);
document.getElementById('btnConfirm').addEventListener('click', confirmDelete);
document.getElementById('btnCancel').addEventListener('click', closeDeleteModal);
deleteModal.addEventListener('click', (e) => { if (e.target === deleteModal) closeDeleteModal(); });

titleInput.addEventListener('input', onEditorChange);
titleInputMb.addEventListener('input', onEditorChange);
bodyInput.addEventListener('input', onEditorChange);
dateInput.addEventListener('change', onEditorChange);
searchInput.addEventListener('input', () => renderList(searchInput.value));

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    if (currentUser) createTodo();
  }
  if (e.key === 'Escape' && isMobile()) goBackToList();
});

// ════════════════════════════════════════
//  할일 기능
// ════════════════════════════════════════
function isMobile() {
  return window.innerWidth <= 767;
}

function showEditor() {
  if (isMobile()) mainApp.classList.add('editor-open');
}

function goBackToList() {
  mainApp.classList.remove('editor-open');
}

function createTodo() {
  if (!currentUser) return;
  const newRef = push(ref(db, `todos/${currentUser.uid}`));
  currentId = newRef.key;

  set(newRef, {
    title:      '',
    dueDate:    '',
    notes:      '',
    done:       false,
    important:  false,
    authorName: currentUser.name,
    authorId:   currentUser.uid,
    createdAt:  new Date().toISOString(),
    updatedAt:  new Date().toISOString(),
  });

  editorEmpty.classList.add('hidden');
  editorContent.classList.remove('hidden');
  titleInput.value         = '';
  titleInputMb.value       = '';
  bodyInput.value          = '';
  dateInput.value          = '';
  charCount.textContent    = '0자';
  lastModified.textContent = '방금 전';

  (isMobile() ? titleInputMb : titleInput).focus();
  showEditor();
}

function openTodo(id) {
  currentId = id;
  const todo = getTodo(id);
  if (!todo) return;

  editorEmpty.classList.add('hidden');
  editorContent.classList.remove('hidden');
  titleInput.value   = todo.title   || '';
  titleInputMb.value = todo.title   || '';
  bodyInput.value    = todo.notes   || '';
  dateInput.value    = todo.dueDate || '';
  updateFooter(todo);

  document.querySelectorAll('.todo-item').forEach(el => {
    el.classList.toggle('active', el.dataset.id === id);
  });

  updateImportantButtons(!!todo.important);
  showEditor();
}

function toggleImportant(id) {
  if (!currentUser) return;
  const todo = getTodo(id);
  if (!todo) return;
  const next = !todo.important;
  update(ref(db, `todos/${currentUser.uid}/${id}`), {
    important: next,
    updatedAt: new Date().toISOString(),
  });
  updateImportantButtons(next);
}

function updateImportantButtons(isImportant) {
  const label = isImportant ? '⭐ 중요' : '☆ 중요';
  btnImportant.textContent   = label;
  btnImportantMb.textContent = isImportant ? '⭐' : '☆';
  btnImportant.classList.toggle('active', isImportant);
  btnImportantMb.classList.toggle('active', isImportant);
}

function toggleDone(id) {
  if (!currentUser) return;
  const todo = getTodo(id);
  if (!todo) return;
  update(ref(db, `todos/${currentUser.uid}/${id}`), {
    done:      !todo.done,
    updatedAt: new Date().toISOString(),
  });
}

function onEditorChange() {
  if (!currentId || !currentUser) return;

  const activeEl = document.activeElement;
  if (activeEl === titleInput)        titleInputMb.value = titleInput.value;
  else if (activeEl === titleInputMb) titleInput.value   = titleInputMb.value;

  const title   = titleInput.value || titleInputMb.value;
  const notes   = bodyInput.value;
  const dueDate = dateInput.value;

  charCount.textContent = `${notes.length}자`;
  setSaveStatus('저장 중...');

  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    update(ref(db, `todos/${currentUser.uid}/${currentId}`), {
      title, notes, dueDate,
      updatedAt: new Date().toISOString(),
    });
    setSaveStatus('저장됨');
    lastModified.textContent = '방금 전';
    setTimeout(() => setSaveStatus(''), 1500);
  }, 400);
}

function setSaveStatus(text) {
  saveStatus.textContent   = text;
  saveStatusMb.textContent = text;
}

function updateFooter(todo) {
  charCount.textContent    = `${(todo.notes || '').length}자`;
  lastModified.textContent = formatDate(todo.updatedAt);
}

function openDeleteModal(id) {
  if (!id) return;
  pendingDeleteId = id;
  deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
  pendingDeleteId = null;
  deleteModal.classList.add('hidden');
}

function confirmDelete() {
  if (!pendingDeleteId || !currentUser) return;
  remove(ref(db, `todos/${currentUser.uid}/${pendingDeleteId}`));

  if (currentId === pendingDeleteId) {
    currentId = null;
    editorEmpty.classList.remove('hidden');
    editorContent.classList.add('hidden');
    goBackToList();
  }
  closeDeleteModal();
}

function renderList(query = '') {
  const q = query.trim().toLowerCase();
  let base = q
    ? todos.filter(t =>
        (t.title || '').toLowerCase().includes(q) ||
        (t.notes || '').toLowerCase().includes(q)
      )
    : todos;

  if (filterMode === 'important') {
    base = base.filter(t => t.important);
  }

  const sorted = [...base].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (!!a.important !== !!b.important) return a.important ? -1 : 1;
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  const undoneCount   = sorted.filter(t => !t.done).length;
  const importantCount = todos.filter(t => t.important && !t.done).length;
  const importantBadge = importantCount > 0 ? ` · ⭐ ${importantCount}개` : '';
  todoCount.textContent = `${undoneCount}개 남음 / 전체 ${sorted.length}개${importantBadge}`;
  todoList.innerHTML = '';

  if (sorted.length === 0) {
    const li = document.createElement('li');
    li.style.cssText = 'padding:24px 18px;text-align:center;color:rgba(255,255,255,0.6);font-size:13px;';
    li.textContent = q ? '검색 결과가 없습니다' : '할일이 없습니다';
    todoList.appendChild(li);
    return;
  }

  sorted.forEach(todo => {
    const li = document.createElement('li');
    const isActive = todo.id === currentId;
    li.className = 'todo-item'
      + (isActive        ? ' active'    : '')
      + (todo.done       ? ' done'      : '')
      + (todo.important  ? ' important' : '');
    li.dataset.id = todo.id;

    const title     = todo.title || '제목 없음';
    const dueBadge  = todo.dueDate
      ? `<span class="due-badge ${getDueBadgeClass(todo)}">${formatDueDate(todo.dueDate)}</span>`
      : '';
    const authorTag = todo.authorName
      ? `<span class="todo-item-author">✍ ${escapeHtml(todo.authorName)}</span>`
      : '';
    const starTag = todo.important
      ? `<span class="todo-item-star">⭐</span>`
      : '';

    li.innerHTML = `
      <div class="todo-check-wrap">
        <input type="checkbox" class="todo-checkbox" ${todo.done ? 'checked' : ''}>
      </div>
      <div class="todo-item-content">
        <div class="todo-item-title">${q ? highlight(title, q) : escapeHtml(title)}</div>
        <div class="todo-item-meta">${dueBadge}${authorTag}</div>
      </div>
      ${starTag}
    `;

    li.querySelector('.todo-checkbox').addEventListener('change', (e) => {
      e.stopPropagation();
      toggleDone(todo.id);
    });
    li.addEventListener('click', (e) => {
      if (e.target.classList.contains('todo-checkbox')) return;
      openTodo(todo.id);
    });

    todoList.appendChild(li);
  });
}

// ── 헬퍼 함수 ──
function getDueBadgeClass(todo) {
  if (todo.done) return 'due-done';
  const today = new Date().toISOString().split('T')[0];
  if (todo.dueDate < today) return 'due-overdue';
  if (todo.dueDate === today) return 'due-today';
  return '';
}

function formatDueDate(dateStr) {
  const today = new Date().toISOString().split('T')[0];
  if (dateStr === today) return '오늘';
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dateStr === tomorrow.toISOString().split('T')[0]) return '내일';
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

function getTodo(id)  { return todos.find(t => t.id === id); }

function formatDate(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const now  = new Date();
  const diff = now - date;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  <  1) return '방금 전';
  if (mins  < 60) return `${mins}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days  <  7) return `${days}일 전`;
  return date.toLocaleDateString('ko-KR');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function highlight(text, query) {
  const safe      = escapeHtml(text);
  const safeQuery = escapeHtml(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return safe.replace(new RegExp(safeQuery, 'gi'), m => `<mark class="highlight">${m}</mark>`);
}
