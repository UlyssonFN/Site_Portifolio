/* ==========================================================================
   Anne OS Kids — desktop.js
   Desktop (ícones/wallpaper), Taskbar, StartMenu, menu de contexto
   ========================================================================== */

const DESKTOP_ICONS = [
  { id: 'mycomputer', emoji: '💻', label: 'Meu Computador' },
  { id: 'paint', emoji: '🎨', label: 'Pintura' },
  { id: 'notes', emoji: '📝', label: 'Notas' },
  { id: 'calculator', emoji: '🧮', label: 'Calculadora' },
  { id: 'worldinho', emoji: '🌍', label: 'Worldinho' },
  { id: 'excelzinho', emoji: '📊', label: 'Excelzinho' },
  { id: 'wordzinho', emoji: '📝', label: 'Wordzinho' },
  { id: 'music', emoji: '🎵', label: 'Música' },
<<<<<<< HEAD
=======
  { id: 'bedtime', emoji: '🌙', label: 'Hora de Dormir' },
>>>>>>> 5914dff (Upgrade com a pagina infantil)
  { id: 'animals', emoji: '🐶', label: 'Mundo dos Animais' },
  { id: 'games', emoji: '🎮', label: 'Jogos' },
  { id: 'settings', emoji: '⚙️', label: 'Configurações' },
  { id: 'files', emoji: '🗂️', label: 'Meus Arquivos' },
  { id: 'browser', emoji: '🌐', label: 'Navegador' }
];

const START_APPS = [
  { id: 'paint', emoji: '🎨', label: 'Pintura' },
  { id: 'notes', emoji: '📝', label: 'Bloco de Notas' },
  { id: 'calculator', emoji: '🧮', label: 'Calculadora' },
  { id: 'music', emoji: '🎵', label: 'Música' },
<<<<<<< HEAD
=======
  { id: 'bedtime', emoji: '🌙', label: 'Hora de Dormir' },
>>>>>>> 5914dff (Upgrade com a pagina infantil)
  { id: 'animals', emoji: '🐾', label: 'Animais' },
  { id: 'games', emoji: '🎮', label: 'Jogos' },
  { id: 'settings', emoji: '⚙️', label: 'Configurações' }
];

const START_SYSTEM = [
  { id: 'profile', emoji: '👤', label: 'Perfil' },
  { id: 'files', emoji: '📁', label: 'Arquivos' },
  { id: 'achievements', emoji: '🏆', label: 'Conquistas' },
  { id: 'help', emoji: '❓', label: 'Ajuda' },
  { id: 'lock', emoji: '🔒', label: 'Bloquear tela' },
  { id: 'restart', emoji: '🔄', label: 'Reiniciar' },
  { id: 'shutdown', emoji: '🔴', label: 'Desligar', danger: true }
];

class DesktopManager {
  constructor() {
    this.taskbarEntries = new Map(); // winId -> {btn, title}
    this.clockInterval = null;
  }

  init() {
    windowManager.init();
    this._renderDesktopIcons();
    this._renderStartMenu();
    this._bindTaskbar();
    this._bindContextMenu();
    this._startClock();
  }

  _renderDesktopIcons() {
    const wrap = document.getElementById('desktop-icons');
    wrap.innerHTML = '';
    DESKTOP_ICONS.forEach(icon => {
      const div = document.createElement('div');
      div.className = 'desktop-icon';
      div.tabIndex = 0;
      div.innerHTML = `<span class="di-emoji">${icon.emoji}</span><span class="di-label">${icon.label}</span>`;
      div.addEventListener('click', () => {
        wrap.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
        div.classList.add('selected');
      });
      div.addEventListener('dblclick', () => { soundManager.click(); appLauncher.launch(icon.id); });
      let touchTimer = null;
      div.addEventListener('touchend', () => {
        if (touchTimer) { clearTimeout(touchTimer); touchTimer = null; soundManager.click(); appLauncher.launch(icon.id); }
        else { touchTimer = setTimeout(() => touchTimer = null, 400); }
      });
      wrap.appendChild(div);
    });
  }

  _renderStartMenu() {
    const appsWrap = document.getElementById('sm-apps');
    const sysWrap = document.getElementById('sm-system');
    appsWrap.innerHTML = '';
    sysWrap.innerHTML = '';

    START_APPS.forEach(a => {
      const btn = document.createElement('button');
      btn.className = 'sm-item';
      btn.dataset.label = a.label.toLowerCase();
      btn.innerHTML = `<span class="sm-emoji">${a.emoji}</span> ${a.label}`;
      btn.addEventListener('click', () => { soundManager.click(); appLauncher.launch(a.id); this.closeStartMenu(); });
      appsWrap.appendChild(btn);
    });

    START_SYSTEM.forEach(a => {
      const btn = document.createElement('button');
      btn.className = 'sm-item' + (a.danger ? ' sm-danger' : '');
      btn.dataset.label = a.label.toLowerCase();
      btn.innerHTML = `<span class="sm-emoji">${a.emoji}</span> ${a.label}`;
      btn.addEventListener('click', () => { soundManager.click(); this.closeStartMenu(); this._handleSystemAction(a.id); });
      sysWrap.appendChild(btn);
    });

    document.getElementById('sm-search').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.sm-item').forEach(item => {
        item.style.display = item.dataset.label.includes(q) ? '' : 'none';
      });
    });
  }

  _handleSystemAction(id) {
    if (id === 'profile') appLauncher.launch('mycomputer', 'profile');
    else if (id === 'files') appLauncher.launch('files');
    else if (id === 'achievements') appLauncher.launch('mycomputer', 'achievements');
    else if (id === 'help') appLauncher.launch('mycomputer', 'help');
    else if (id === 'lock') anneOS.lockScreen();
    else if (id === 'restart') anneOS.restart();
    else if (id === 'shutdown') anneOS.shutdown();
  }

  _bindTaskbar() {
    const startBtn = document.getElementById('start-btn');
    startBtn.addEventListener('click', () => this.toggleStartMenu());
    const supportWidget = document.getElementById('support-qrcode-widget');
    supportWidget.addEventListener('click', () => {
      soundManager.click();
      appLauncher.launch('mycomputer', 'help');
    });
    document.addEventListener('click', (e) => {
      const sm = document.getElementById('start-menu');
      if (sm.classList.contains('open') && !sm.contains(e.target) && e.target !== startBtn) {
        this.closeStartMenu();
      }
    });
  }

  toggleStartMenu() {
    const sm = document.getElementById('start-menu');
    const btn = document.getElementById('start-btn');
    const opening = !sm.classList.contains('open');
    sm.classList.toggle('open');
    btn.classList.toggle('active', opening);
    if (opening) { soundManager.click(); document.getElementById('sm-search').value = ''; document.querySelectorAll('.sm-item').forEach(i => i.style.display = ''); }
  }

  closeStartMenu() {
    document.getElementById('start-menu').classList.remove('open');
    document.getElementById('start-btn').classList.remove('active');
  }

  updateProfileHeader(user) {
    document.getElementById('sm-avatar').textContent = user.avatar;
    document.getElementById('sm-username').textContent = user.nome;
    updateStarDisplay(user.estrelas || 0);
  }

  addTaskbarApp(winId, title, icon) {
    const wrap = document.getElementById('taskbar-apps');
    const btn = document.createElement('button');
    btn.className = 'taskbar-app active';
    btn.dataset.winId = winId;
    btn.innerHTML = `<span>${icon || '🪟'}</span><span>${title}</span>`;
    btn.addEventListener('click', () => {
      soundManager.click();
      windowManager.toggleMinimizeRestore(winId);
      windowManager.focus(winId);
    });
    wrap.appendChild(btn);
    this.taskbarEntries.set(winId, btn);
    this.setActiveTaskbarApp(winId);
  }

  removeTaskbarApp(winId) {
    const btn = this.taskbarEntries.get(winId);
    if (btn) btn.remove();
    this.taskbarEntries.delete(winId);
  }

  updateTaskbarState(winId, minimized) {
    const btn = this.taskbarEntries.get(winId);
    if (btn) btn.classList.toggle('minimized', minimized);
  }

  setActiveTaskbarApp(winId) {
    for (const [id, btn] of this.taskbarEntries) btn.classList.toggle('active', id === winId);
  }

  _bindContextMenu() {
    const desktop = document.getElementById('desktop');
    const menu = document.getElementById('context-menu');

    desktop.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this._openContextMenu(e.clientX, e.clientY);
    });

    let pressTimer = null;
    desktop.addEventListener('touchstart', (e) => {
      if (e.target.closest('.desktop-icon') || e.target.closest('.Anne-window')) return;
      const t = e.touches[0];
      pressTimer = setTimeout(() => this._openContextMenu(t.clientX, t.clientY), 550);
    }, { passive: true });
    desktop.addEventListener('touchend', () => clearTimeout(pressTimer));
    desktop.addEventListener('touchmove', () => clearTimeout(pressTimer));

    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target)) menu.classList.remove('open');
    });
  }

  _openContextMenu(x, y) {
    const menu = document.getElementById('context-menu');
    menu.innerHTML = `
      <button data-a="refresh">🔄 Atualizar área de trabalho</button>
      <button data-a="wallpaper">🖼️ Alterar papel de parede</button>
      <button data-a="settings">⚙️ Configurações</button>
      <hr>
      <button data-a="new-note">📝 Nova nota rápida</button>
    `;
    menu.style.left = Math.min(x, window.innerWidth - 220) + 'px';
    menu.style.top = Math.min(y, window.innerHeight - 200) + 'px';
    menu.classList.add('open');
    menu.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      menu.classList.remove('open');
      const a = b.dataset.a;
      soundManager.click();
      if (a === 'refresh') this._renderDesktopIcons();
      else if (a === 'wallpaper' || a === 'settings') appLauncher.launch('settings');
      else if (a === 'new-note') appLauncher.launch('notes', 'new');
    }));
  }

  _startClock() {
    const update = () => {
      const now = new Date();
      const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const date = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const fullDate = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
      const t1 = document.getElementById('tray-time'); if (t1) t1.textContent = time;
      const t2 = document.getElementById('tray-date'); if (t2) t2.textContent = date;
      const lc = document.getElementById('lock-clock'); if (lc) lc.textContent = time;
      const ld = document.getElementById('lock-date'); if (ld) ld.textContent = fullDate;
    };
    update();
    this.clockInterval = setInterval(update, 1000);
  }
}

const desktopManager = new DesktopManager();
window.desktopManager = desktopManager;
