/* ==========================================================================
   Anne OS Kids — apps/notes.js
   📝 Anne Notes: criar, editar, excluir, pesquisar notas
   ========================================================================== */

function openNotesApp(mode) {
  const panel = document.createElement('div');
  panel.className = 'notes-layout';
  panel.innerHTML = `
    <div class="notes-sidebar">
      <input type="text" class="notes-search" id="notes-search" placeholder="🔎 Pesquisar notas...">
      <div id="notes-list"></div>
    </div>
    <div class="notes-editor" id="notes-editor">
      <div class="notes-empty">Selecione uma nota ou crie uma nova 📝</div>
    </div>
  `;
  setTimeout(() => initNotesApp(panel, mode), 0);
  return panel;
}

async function initNotesApp(panel, mode) {
  let activeId = null;
  let saveTimeout = null;

  async function loadNotes(filter = '') {
    if (!userManager.currentUser) return [];
    const notes = await db.getByIndex('notes', 'usuario_id', userManager.currentUser.id);
    notes.sort((a, b) => new Date(b.data) - new Date(a.data));
    return filter ? notes.filter(n => (n.titulo + n.conteudo).toLowerCase().includes(filter.toLowerCase())) : notes;
  }

  async function renderList(filter = '') {
    const list = panel.querySelector('#notes-list');
    const notes = await loadNotes(filter);
    list.innerHTML = '';
    if (!notes.length) {
      list.innerHTML = '<p style="color:#aaa;font-size:.85rem;padding:.5rem;">Nenhuma nota encontrada.</p>';
    }
    notes.forEach(n => {
      const item = document.createElement('div');
      item.className = 'note-item' + (n.id === activeId ? ' active' : '');
      const dt = new Date(n.data).toLocaleDateString('pt-BR');
      item.innerHTML = `<div class="ni-title">${n.titulo || 'Sem título'}</div><div class="ni-date">${dt}</div>`;
      item.addEventListener('click', () => { soundManager.click(); openEditor(n); });
      list.appendChild(item);
    });
  }

  function openEditor(note) {
    activeId = note.id;
    const editor = panel.querySelector('#notes-editor');
    editor.innerHTML = `
      <input type="text" id="note-title" placeholder="Título da nota" value="${escapeAttr(note.titulo || '')}">
      <textarea id="note-content" placeholder="Escreva aqui...">${note.conteudo || ''}</textarea>
      <div class="notes-toolbar">
        <button id="note-new">➕ Nova nota</button>
        <button id="note-delete" class="danger">🗑️ Excluir</button>
      </div>
    `;
    const titleEl = editor.querySelector('#note-title');
    const contentEl = editor.querySelector('#note-content');
    const autoSave = () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(async () => {
        note.titulo = titleEl.value.trim() || 'Sem título';
        note.conteudo = contentEl.value;
        note.data = new Date().toISOString();
        await db.put('notes', note);
        renderList(panel.querySelector('#notes-search').value);
      }, 500);
    };
    titleEl.addEventListener('input', autoSave);
    contentEl.addEventListener('input', autoSave);
    editor.querySelector('#note-new').addEventListener('click', () => createNewNote());
    editor.querySelector('#note-delete').addEventListener('click', async () => {
      await db.delete('notes', note.id);
      activeId = null;
      panel.querySelector('#notes-editor').innerHTML = '<div class="notes-empty">Selecione uma nota ou crie uma nova 📝</div>';
      renderList();
      notificationManager.show('Nota excluída.', '🗑️', 2000);
    });
    renderList(panel.querySelector('#notes-search').value);
  }

  async function createNewNote() {
    if (!userManager.currentUser) return;
    const note = { usuario_id: userManager.currentUser.id, titulo: 'Nova nota', conteudo: '', data: new Date().toISOString() };
    const id = await db.add('notes', note);
    note.id = id;
    await achievementManager.checkAndUnlock();
    openEditor(note);
    setTimeout(() => { const t = panel.querySelector('#note-title'); if (t) { t.focus(); t.select(); } }, 50);
  }

  panel.querySelector('#notes-search').addEventListener('input', (e) => renderList(e.target.value));

  await renderList();
  if (mode === 'new') createNewNote();
}

function escapeAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
