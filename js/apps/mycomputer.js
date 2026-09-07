/* ==========================================================================
   Anne OS Kids — apps/mycomputer.js
   💻 Meu Computador, 👤 Perfil, 🏆 Conquistas, ❓ Ajuda
   ========================================================================== */

function openMyComputerApp(section) {
  const panel = document.createElement('div');
  panel.className = 'app-panel';
  panel.innerHTML = `
    <div class="context-tabs" style="display:flex;gap:.5rem;margin-bottom:1rem;flex-wrap:wrap;">
      <button class="theme-choice mc-tab" data-t="info">💻 Sistema</button>
      <button class="theme-choice mc-tab" data-t="profile">👤 Perfil</button>
      <button class="theme-choice mc-tab" data-t="achievements">🏆 Conquistas</button>
      <button class="theme-choice mc-tab" data-t="help">❓ Ajuda</button>
    </div>
    <div id="mc-content"></div>
  `;
  const initial = section || 'info';
  setTimeout(() => {
    panel.querySelectorAll('.mc-tab').forEach(b => {
      b.classList.toggle('selected', b.dataset.t === initial);
      b.addEventListener('click', () => {
        panel.querySelectorAll('.mc-tab').forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        soundManager.click();
        renderMcSection(panel, b.dataset.t);
      });
    });
    renderMcSection(panel, initial);
  }, 0);
  return panel;
}

async function renderMcSection(panel, section) {
  const content = panel.querySelector('#mc-content');
  const user = userManager.currentUser;

  if (section === 'info') {
    const usage = await db.estimateUsage();
    const usageMB = usage.usage ? (usage.usage / (1024 * 1024)).toFixed(2) : '0.00';
    content.innerHTML = `
      <h2>💻 Sobre o Anne OS Kids</h2>
      <div class="stat-grid">
        <div class="stat-card"><div class="sc-value">1.0</div><div class="sc-label">Versão</div></div>
        <div class="stat-card"><div class="sc-value">${usageMB} MB</div><div class="sc-label">Armazenamento usado</div></div>
        <div class="stat-card"><div class="sc-value">${user ? user.jogosRealizados || 0 : 0}</div><div class="sc-label">Jogos realizados</div></div>
        <div class="stat-card"><div class="sc-value">${user ? user.estrelas || 0 : 0} ⭐</div><div class="sc-label">Estrelas</div></div>
      </div>
      <p style="color:#888;margin-top:1rem;font-size:.85rem;">Anne OS Kids roda 100% no seu navegador, sem internet — seus dados ficam salvos com segurança no seu dispositivo.</p>
    `;
  } else if (section === 'profile') {
    if (!user) { content.innerHTML = '<p>Nenhum perfil ativo.</p>'; return; }
    const drawings = await db.getByIndex('drawings', 'usuario_id', user.id);
    const notes = await db.getByIndex('notes', 'usuario_id', user.id);
    content.innerHTML = `
      <h2>${user.avatar} ${user.nome}</h2>
      <div class="stat-grid">
        <div class="stat-card"><div class="sc-value">${user.estrelas || 0} ⭐</div><div class="sc-label">Estrelas</div></div>
        <div class="stat-card"><div class="sc-value">${user.pontuacao || 0}</div><div class="sc-label">Pontuação total</div></div>
        <div class="stat-card"><div class="sc-value">${user.jogosRealizados || 0}</div><div class="sc-label">Jogos realizados</div></div>
        <div class="stat-card"><div class="sc-value">${drawings.length}</div><div class="sc-label">Desenhos salvos</div></div>
        <div class="stat-card"><div class="sc-value">${notes.length}</div><div class="sc-label">Notas escritas</div></div>
      </div>
    `;
  } else if (section === 'achievements') {
    const list = await achievementManager.getAllForDisplay();
    content.innerHTML = `<h2>🏆 Minhas Conquistas</h2><div class="ach-grid">${
      list.map(a => `
        <div class="ach-card ${a.unlocked ? 'unlocked' : ''}">
          <span class="ac-emoji">${a.unlocked ? a.emoji : '🔒'}</span>
          <div><div class="ac-name">${a.name}</div><div class="ac-desc">${a.desc}</div></div>
        </div>
      `).join('')
    }</div>`;
  } else if (section === 'help') {
    content.innerHTML = `
      <h2>❓ Como usar o Anne OS Kids</h2>
      <p>🖱️ Clique duas vezes nos ícones da área de trabalho para abrir os aplicativos.</p>
      <p>🪟 Arraste o topo das janelas para movê-las, e o cantinho para redimensionar.</p>
      <p>🌈 Use o botão Iniciar para encontrar todos os aplicativos e jogos.</p>
      <p>⭐ Ganhe estrelas jogando e completando desafios!</p>
      <p>🏆 Desbloqueie conquistas ao explorar o sistema.</p>
      ${supportQrMarkup()}
    `;
  }
}
