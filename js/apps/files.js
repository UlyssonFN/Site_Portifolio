/* ==========================================================================
   Anne OS Kids — apps/files.js
   📁 Meus Arquivos: gerenciador de arquivos simulado
   ========================================================================== */

const FILE_FOLDERS = [
  { id: 'desenhos', emoji: '📁', label: 'Meus Desenhos' },
  { id: 'musicas', emoji: '📁', label: 'Minhas Músicas' },
  { id: 'jogos', emoji: '📁', label: 'Jogos' },
  { id: 'documentos', emoji: '📁', label: 'Documentos' },
  { id: 'certificados', emoji: '📜', label: 'Meus Certificados' },
  { id: 'favoritos', emoji: '📁', label: 'Favoritos' }
];

function openFilesApp() {
  const panel = document.createElement('div');
  panel.className = 'app-panel';
  panel.style.padding = '0';
  panel.innerHTML = `
    <div class="files-breadcrumb" id="files-breadcrumb">🗂️ Meus Arquivos</div>
    <div class="files-grid" id="files-grid"></div>
  `;
  setTimeout(() => renderFolders(panel), 0);
  return panel;
}

function renderFolders(panel) {
  const grid = panel.querySelector('#files-grid');
  const crumb = panel.querySelector('#files-breadcrumb');
  crumb.textContent = '🗂️ Meus Arquivos';
  grid.innerHTML = '';
  FILE_FOLDERS.forEach(f => {
    const div = document.createElement('div');
    div.className = 'file-folder';
    div.innerHTML = `<div class="fi-emoji">${f.emoji}</div><div class="fi-name">${f.label}</div>`;
    div.addEventListener('click', () => { soundManager.click(); openFolder(panel, f); });
    grid.appendChild(div);
  });
}

async function openFolder(panel, folder) {
  const grid = panel.querySelector('#files-grid');
  const crumb = panel.querySelector('#files-breadcrumb');
  crumb.innerHTML = `<span style="cursor:pointer;" id="back-to-root">🗂️ Meus Arquivos</span> › ${folder.label}`;
  crumb.querySelector('#back-to-root').addEventListener('click', () => renderFolders(panel));
  grid.innerHTML = '<div class="files-empty">Carregando...</div>';

  const uid = userManager.currentUser ? userManager.currentUser.id : null;
  let items = [];
  if (folder.id === 'desenhos' && uid) {
    const drawings = await db.getByIndex('drawings', 'usuario_id', uid);
    items = drawings.filter(d => d.tipo !== 'certificado').map(d => ({ type: 'image', name: d.nome, data: d.imagem }));
  } else if (folder.id === 'documentos' && uid) {
    const notes = await db.getByIndex('notes', 'usuario_id', uid);
    items = notes.map(n => ({ type: 'note', name: n.titulo, data: n.conteudo }));
  } else if (folder.id === 'certificados' && uid) {
    const drawings = await db.getByIndex('drawings', 'usuario_id', uid);
    items = drawings.filter(d => d.tipo === 'certificado').map(d => ({ type: 'image', name: d.nome, data: d.imagem }));
  } else if (folder.id === 'musicas' && uid) {
    const games = await db.getByIndex('games', 'usuario_id', uid);
    items = games.filter(g => g.jogo && g.jogo.startsWith('musica')).map(g => ({ type: 'score', name: `Música — pontuação ${g.pontuacao}`, data: g.data }));
  } else if (folder.id === 'jogos' && uid) {
    const games = await db.getByIndex('games', 'usuario_id', uid);
    items = games.filter(g => g.jogo && !g.jogo.startsWith('musica') && g.jogo !== 'calculadora').map(g => ({ type: 'score', name: `${g.jogo} — ${g.pontuacao} pts`, data: g.data }));
  } else if (folder.id === 'favoritos') {
    items = [];
  }

  grid.innerHTML = '';
  if (!items.length) {
    grid.innerHTML = '<div class="files-empty">📭 Nada por aqui ainda. Explore os aplicativos para criar arquivos!</div>';
    return;
  }
  items.slice().reverse().forEach(it => {
    const div = document.createElement('div');
    div.className = 'file-item';
    if (it.type === 'image') {
      div.innerHTML = `<img src="${it.data}" alt="${it.name}"><div class="fi-name">${it.name}</div>`;
      div.addEventListener('click', () => openFileImageViewer(panel, it));
    } else if (it.type === 'note') {
      div.innerHTML = `<div class="fi-emoji">📝</div><div class="fi-name">${it.name}</div>`;
    } else {
      div.innerHTML = `<div class="fi-emoji">🏆</div><div class="fi-name">${it.name}</div>`;
    }
    grid.appendChild(div);
  });
}

function openFileImageViewer(panel, item) {
  const existing = panel.querySelector('.file-image-viewer');
  if (existing) existing.remove();
  const viewer = document.createElement('div');
  viewer.className = 'file-image-viewer';
  viewer.innerHTML = `
    <div class="file-image-dialog">
      <button class="file-image-close" title="Fechar">✕</button>
      <img src="${item.data}" alt="${item.name}">
      <div class="file-image-title">${item.name}</div>
      <a class="btn-secondary file-image-download" download="${item.name}.svg" href="${item.data}">💾 Baixar certificado</a>
    </div>
  `;
  viewer.addEventListener('click', event => { if (event.target === viewer) viewer.remove(); });
  viewer.querySelector('.file-image-close').addEventListener('click', () => viewer.remove());
  panel.appendChild(viewer);
}
