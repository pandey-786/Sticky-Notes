 

 
const STORAGE_KEY = 'sticky-notes-board';
let notes = [];
let selectedColor = '#FDE68A';
let topZ = 10;
 
let drag = { active: false, noteEl: null, noteId: null, offX: 0, offY: 0 };

 
let resize = { active: false, noteEl: null, noteId: null, startX: 0, startY: 0, startW: 0, startH: 0 };

 
function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    notes = raw ? JSON.parse(raw) : [];
  } catch {
    notes = [];
  }
}

 
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function getNoteById(id) {
  return notes.find(n => n.id === id);
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function randomPos() {
  const board = document.getElementById('board');
  const bw = board.clientWidth;
  const bh = board.clientHeight;
  return {
    x: clamp(Math.random() * (bw - 240) + 40, 20, bw - 220),
    y: clamp(Math.random() * (bh - 220) + 40, 20, bh - 200),
  };
}

function updateEmptyState() {
  const el = document.getElementById('emptyState');
  el.classList.toggle('hidden', notes.length > 0);
}

 
function createNoteEl(note) {
  const el = document.createElement('div');
  el.className = 'note';
  el.dataset.id = note.id;
  el.style.cssText = `
    background: ${note.color};
    left: ${note.x}px;
    top: ${note.y}px;
    width: ${note.width}px;
    min-height: ${note.height}px;
    z-index: ${note.z};
  `;

 
  const header = document.createElement('div');
  header.className = 'note-header';

  const delBtn = document.createElement('button');
  delBtn.className = 'note-delete';
  delBtn.innerHTML = '×';
  delBtn.title = 'Delete note';
  delBtn.addEventListener('click', e => {
    e.stopPropagation();
    deleteNote(note.id, el);
  });
  header.appendChild(delBtn);

 
  const text = document.createElement('div');
  text.className = 'note-text';
  text.contentEditable = 'true';
  text.spellcheck = true;
  text.textContent = note.text;

  text.addEventListener('input', () => {
    const n = getNoteById(note.id);
    if (n) { n.text = text.textContent; saveNotes(); }
  });

 
  text.addEventListener('mousedown', e => e.stopPropagation());

 
  const footer = document.createElement('div');
  footer.className = 'note-footer';

  const handle = document.createElement('div');
  handle.className = 'note-resize-handle';
  handle.title = 'Resize';
  footer.appendChild(handle);

  el.appendChild(header);
  el.appendChild(text);
  el.appendChild(footer);

 
  el.addEventListener('mousedown', e => {
    if (e.target === delBtn || e.target === handle) return;
    e.preventDefault();
    bringToFront(note.id, el);
    drag.active = true;
    drag.noteEl = el;
    drag.noteId = note.id;
    drag.offX = e.clientX - el.offsetLeft;
    drag.offY = e.clientY - el.offsetTop;
    el.classList.add('dragging');
  });

 
  handle.addEventListener('mousedown', e => {
    e.preventDefault();
    e.stopPropagation();
    bringToFront(note.id, el);
    resize.active = true;
    resize.noteEl = el;
    resize.noteId = note.id;
    resize.startX = e.clientX;
    resize.startY = e.clientY;
    resize.startW = el.offsetWidth;
    resize.startH = el.offsetHeight;
    el.classList.add('resizing');
  });

  return el;
}
 
function renderBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  notes.forEach(note => {
    board.appendChild(createNoteEl(note));
  });
  updateEmptyState();
}

 
function addNote() {
  const pos = randomPos();
  const note = {
    id: uid(),
    text: '',
    color: selectedColor,
    x: pos.x,
    y: pos.y,
    width: 200,
    height: 160,
    z: ++topZ,
  };
  notes.push(note);
  saveNotes();

  const el = createNoteEl(note);
  document.getElementById('board').appendChild(el);
  updateEmptyState();

 
  setTimeout(() => {
    const textEl = el.querySelector('.note-text');
    if (textEl) textEl.focus();
  }, 10);
}

function deleteNote(id, el) {
  notes = notes.filter(n => n.id !== id);
  el.style.transform = 'scale(0.85)';
  el.style.opacity = '0';
  el.style.transition = 'transform 0.18s, opacity 0.18s';
  setTimeout(() => el.remove(), 180);
  saveNotes();
  updateEmptyState();
}

function bringToFront(id, el) {
  const note = getNoteById(id);
  if (note) {
    note.z = ++topZ;
    el.style.zIndex = note.z;
  }
}

function clearAll() {
  if (notes.length === 0) return;
  if (!confirm('Delete all notes? This cannot be undone.')) return;
  notes = [];
  saveNotes();
  renderBoard();
}

 
window.addEventListener('mousemove', e => {
  if (drag.active) {
    const board = document.getElementById('board');
    const bw = board.clientWidth;
    const bh = board.clientHeight;
    const noteW = drag.noteEl.offsetWidth;
    const noteH = drag.noteEl.offsetHeight;

    const x = clamp(e.clientX - drag.offX, 0, bw - noteW);
    const y = clamp(e.clientY - drag.offY, 0, bh - noteH);

    drag.noteEl.style.left = x + 'px';
    drag.noteEl.style.top  = y + 'px';
  }

  if (resize.active) {
    const dw = e.clientX - resize.startX;
    const dh = e.clientY - resize.startY;
    const newW = Math.max(150, resize.startW + dw);
    const newH = Math.max(120, resize.startH + dh);
    resize.noteEl.style.width = newW + 'px';
    resize.noteEl.style.minHeight = newH + 'px';
  }
});

window.addEventListener('mouseup', () => {
  if (drag.active) {
    const note = getNoteById(drag.noteId);
    if (note) {
      note.x = parseInt(drag.noteEl.style.left);
      note.y = parseInt(drag.noteEl.style.top);
      saveNotes();
    }
    drag.noteEl.classList.remove('dragging');
    drag.active = false;
    drag.noteEl = null;
    drag.noteId = null;
  }

  if (resize.active) {
    const note = getNoteById(resize.noteId);
    if (note) {
      note.width  = resize.noteEl.offsetWidth;
      note.height = resize.noteEl.offsetHeight;
      saveNotes();
    }
    resize.noteEl.classList.remove('resizing');
    resize.active = false;
    resize.noteEl = null;
    resize.noteId = null;
  }
});

 
window.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    addNote();
  }
});

 
document.getElementById('colorPicker').addEventListener('click', e => {
  const swatch = e.target.closest('.color-swatch');
  if (!swatch) return;
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
  swatch.classList.add('active');
  selectedColor = swatch.dataset.color;
});

 
document.getElementById('btnAdd').addEventListener('click', addNote);
document.getElementById('btnClear').addEventListener('click', clearAll);
 
loadNotes();
if (notes.length > 0) {
  topZ = Math.max(...notes.map(n => n.z || 10));
}
renderBoard();
