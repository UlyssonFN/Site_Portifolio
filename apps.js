/* ==========================================================================
   Anne OS Kids — apps.js
   Registro central de aplicativos e AppLauncher (abre janelas via WindowManager)
   ========================================================================== */

function openSettingsApp() {
  const panel = document.createElement('div');
  panel.className = 'app-panel';
  panel.innerHTML = `
    <h2>⚙️ Configurações</h2>

    <div class="settings-section">
      <h3>🖼️ Personalização</h3>
      <div class="wallpaper-grid" id="set-wallpapers"></div>
      <div class="theme-choices" style="margin-top:.8rem;">
        <div class="theme-choice" data-theme="claro">☀️ Tema claro</div>
        <div class="theme-choice" data-theme="escuro">🌙 Tema escuro</div>
        <div class="theme-choice" data-theme="colorido">🌈 Tema colorido</div>
      </div>
    </div>

    <div class="settings-section">
      <h3>🔊 Som</h3>
      <div class="settings-row"><label>Volume geral</label><input type="range" id="set-volume" min="0" max="1" step="0.05"></div>
      <div class="settings-row"><label>Sons do sistema</label><input type="checkbox" id="set-som-sistema"></div>
    </div>

    <div class="settings-section">
      <h3>👤 Perfil</h3>
      <div class="settings-row"><label>Nome</label><input type="text" id="set-nome" maxlength="16"></div>
      <div class="settings-row"><label>Avatar</label><div class="avatar-picker" id="set-avatar-picker"></div></div>
    </div>

    <div class="settings-section">
      <h3>🖥️ Sistema</h3>
      <p style="color:#888;font-size:.85rem;">Anne OS Kids v1.0 — funciona 100% offline no seu navegador.</p>
      <button class="danger-btn" id="set-clear-data">🗑️ Limpar todos os dados</button>
    </div>
  `;
  setTimeout(() => initSettingsApp(panel), 0);
  return panel;
}

function initSettingsApp(panel) {
  const wpGrid = panel.querySelector('#set-wallpapers');
  WALLPAPERS.forEach(w => {
    const div = document.createElement('div');
    div.className = 'wallpaper-choice' + (settingsManager.current.wallpaper === w.id ? ' selected' : '');
    div.style.background = w.color;
    div.title = w.label;
    div.addEventListener('click', async () => {
      soundManager.click();
      await settingsManager.setWallpaper(w.id);
      wpGrid.querySelectorAll('.wallpaper-choice').forEach(x => x.classList.remove('selected'));
      div.classList.add('selected');
    });
    wpGrid.appendChild(div);
  });

  panel.querySelectorAll('.theme-choice').forEach(t => {
    t.classList.toggle('selected', settingsManager.current.tema === t.dataset.theme);
    t.addEventListener('click', async () => {
      soundManager.click();
      await settingsManager.setTheme(t.dataset.theme);
      panel.querySelectorAll('.theme-choice').forEach(x => x.classList.remove('selected'));
      t.classList.add('selected');
    });
  });

  const volumeEl = panel.querySelector('#set-volume');
  volumeEl.value = settingsManager.current.volume ?? 0.6;
  volumeEl.addEventListener('input', async (e) => { await settingsManager.setVolume(+e.target.value); soundManager.click(); });

  const somEl = panel.querySelector('#set-som-sistema');
  somEl.checked = settingsManager.current.somSistema !== false;
  somEl.addEventListener('change', async (e) => { await settingsManager.setSomSistema(e.target.checked); });

  const nomeEl = panel.querySelector('#set-nome');
  nomeEl.value = userManager.currentUser ? userManager.currentUser.nome : '';
  nomeEl.addEventListener('change', async () => {
    if (!userManager.currentUser) return;
    userManager.currentUser.nome = nomeEl.value.trim() || 'Criança';
    await db.put('users', userManager.currentUser);
    desktopManager.updateProfileHeader(userManager.currentUser);
    notificationManager.show('Nome atualizado!', '✅', 2000);
  });

  const avatarPicker = panel.querySelector('#set-avatar-picker');
  AVATAR_CHOICES.forEach(a => {
    const span = document.createElement('span');
    span.className = 'avatar-choice' + (userManager.currentUser && userManager.currentUser.avatar === a ? ' selected' : '');
    span.textContent = a;
    span.addEventListener('click', async () => {
      if (!userManager.currentUser) return;
      soundManager.click();
      userManager.currentUser.avatar = a;
      await db.put('users', userManager.currentUser);
      desktopManager.updateProfileHeader(userManager.currentUser);
      avatarPicker.querySelectorAll('.avatar-choice').forEach(x => x.classList.remove('selected'));
      span.classList.add('selected');
    });
    avatarPicker.appendChild(span);
  });

  panel.querySelector('#set-clear-data').addEventListener('click', async () => {
    if (!confirm('Isso vai apagar todos os perfis, desenhos, notas e pontuações. Deseja continuar?')) return;
    await db.clearAll();
    notificationManager.show('Dados apagados. Reiniciando...', '🗑️', 2000);
    setTimeout(() => location.reload(), 1500);
  });
}

/* ---------- Registro de aplicativos ---------- */
const APP_REGISTRY = {
  mycomputer: { title: 'Meu Computador', icon: '💻', build: (mode) => openMyComputerApp(mode), w: 560, h: 480 },
  paint: { title: 'Anne Paint', icon: '🎨', build: (mode) => openPaintApp(mode), w: 640, h: 500 },
  notes: { title: 'Anne Notes', icon: '📝', build: (mode) => openNotesApp(mode), w: 560, h: 440 },
  calculator: { title: 'Anne Calculator', icon: '🧮', build: () => openCalculatorApp(), w: 340, h: 520 },
  worldinho: { title: 'Worldinho', icon: '🌍', build: () => openWorldinhoApp(), w: 460, h: 480 },
  excelzinho: { title: 'Excelzinho', icon: '📊', build: () => openExcelzinhoApp(), w: 560, h: 500 },
  wordzinho: { title: 'Wordzinho', icon: '📝', build: () => openWordzinhoApp(), w: 620, h: 520 },
  music: { title: 'Anne Music', icon: '🎵', build: () => openMusicHub(), w: 520, h: 460 },
  animals: { title: 'Mundo dos Animais', icon: '🐾', build: () => openAnimalsHub(), w: 520, h: 460 },
  games: { title: 'Jogos', icon: '🎮', build: () => openGamesHub(), w: 560, h: 500 },
  settings: { title: 'Configurações', icon: '⚙️', build: () => openSettingsApp(), w: 520, h: 560 },
  files: { title: 'Meus Arquivos', icon: '🗂️', build: () => openFilesApp(), w: 560, h: 460 },
  browser: { title: 'Navegador', icon: '🌐', build: () => openBrowserApp(), w: 560, h: 480 }
};

class AppLauncher {
  launch(appId, mode) {
    const def = APP_REGISTRY[appId];
    if (!def) return;
    const contentEl = def.build(mode);
    windowManager.open({
      appId,
      title: def.title,
      icon: def.icon,
      contentEl,
      width: def.w,
      height: def.h,
      singleton: appId !== 'mycomputer'
    });
  }
}

const appLauncher = new AppLauncher();
window.appLauncher = appLauncher;
