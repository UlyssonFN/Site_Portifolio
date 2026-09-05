/* ==========================================================================
   Anne OS Kids — windows.js
   WindowManager: cria, arrasta, redimensiona, minimiza/maximiza/fecha janelas
   ========================================================================== */

class WindowManager {
  constructor() {
    this.windows = new Map(); // winId -> {el, appId, title, minimized, maximized, prevRect}
    this.zCounter = 10;
    this.winCounter = 1;
    this.layer = null;
    this.colorPairs = [
      ['#8c6fff', '#ff6fa5'], ['#4fc3f7', '#8c6fff'], ['#6fdc8c', '#4fc3f7'],
      ['#ffd166', '#ff9f6f'], ['#ff6f6f', '#ffd166'], ['#ff9f6f', '#8c6fff']
    ];
  }

  init() { this.layer = document.getElementById('windows-layer'); }

  open({ appId, title, icon, contentEl, width = 480, height = 420, resizable = true, singleton = true }) {
    if (singleton) {
      for (const [id, w] of this.windows) {
        if (w.appId === appId) {
          if (contentEl) {
            const body = w.el.querySelector('.lw-body');
            const oldContent = body.firstElementChild;
            if (oldContent && typeof oldContent._cleanup === 'function') { try { oldContent._cleanup(); } catch (e) {} }
            body.innerHTML = '';
            body.appendChild(contentEl);
          }
          this.restore(id);
          this.focus(id);
          return id;
        }
      }
    }
    const winId = 'win-' + (this.winCounter++);
    const el = document.createElement('div');
    el.className = 'Anne-window';
    el.dataset.winId = winId;

    const isMobile = window.innerWidth < 640;
    const w = isMobile ? window.innerWidth * 0.94 : Math.min(width, window.innerWidth - 40);
    const h = isMobile ? window.innerHeight * 0.62 : Math.min(height, window.innerHeight - 140);
    const offset = (this.windows.size % 6) * 24;
    const left = isMobile ? window.innerWidth * 0.03 : 60 + offset;
    const top = isMobile ? 40 : 40 + offset;

    el.style.width = w + 'px';
    el.style.height = h + 'px';
    el.style.left = left + 'px';
    el.style.top = top + 'px';

    const colors = this.colorPairs[this.windows.size % this.colorPairs.length];
    el.style.setProperty('--win-color1', colors[0]);
    el.style.setProperty('--win-color2', colors[1]);

    el.innerHTML = `
      <div class="lw-titlebar">
        <span class="lw-icon">${icon || '🪟'}</span>
        <span class="lw-title">${title}</span>
        <div class="lw-controls">
          <button class="lw-btn lw-min" title="Minimizar">–</button>
          <button class="lw-btn lw-max" title="Maximizar">□</button>
          <button class="lw-btn lw-close" title="Fechar">✕</button>
        </div>
      </div>
      <div class="lw-body"></div>
      <div class="lw-resizer"></div>
    `;
    const body = el.querySelector('.lw-body');
    if (contentEl) body.appendChild(contentEl);

    this.layer.appendChild(el);
    this.windows.set(winId, { el, appId, title, minimized: false, maximized: false, prevRect: null });

    this._attachEvents(winId);
    this.focus(winId);
    try { soundManager.open(); } catch (e) {}

    if (window.desktopManager) window.desktopManager.addTaskbarApp(winId, title, icon);
    return winId;
  }

  _attachEvents(winId) {
    const w = this.windows.get(winId);
    const el = w.el;
    const titlebar = el.querySelector('.lw-titlebar');
    const resizer = el.querySelector('.lw-resizer');

    el.addEventListener('mousedown', () => this.focus(winId));
    el.addEventListener('touchstart', () => this.focus(winId), { passive: true });

    // Drag — os listeners de mousemove/mouseup só existem em document ENQUANTO o
    // arraste está ativo, e são removidos ao soltar. Isso evita empilhar listeners
    // globais (um vazamento que deixava o sistema mais lento a cada janela aberta).
    let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
    const startDrag = (x, y) => {
      if (w.maximized) return;
      dragging = true; sx = x; sy = y;
      ox = el.offsetLeft; oy = el.offsetTop;
      this.focus(winId);
    };
    const moveDrag = (x, y) => {
      if (!dragging) return;
      const dx = x - sx, dy = y - sy;
      const desktop = document.getElementById('desktop');
      const maxX = desktop.clientWidth - 60;
      const maxY = desktop.clientHeight - 40;
      let nl = ox + dx, nt = oy + dy;
      nl = Math.max(-el.offsetWidth + 80, Math.min(nl, maxX));
      nt = Math.max(0, Math.min(nt, maxY));
      el.style.left = nl + 'px';
      el.style.top = nt + 'px';
    };
    const onDragMouseMove = (e) => moveDrag(e.clientX, e.clientY);
    const onDragMouseUp = () => {
      dragging = false;
      document.removeEventListener('mousemove', onDragMouseMove);
      document.removeEventListener('mouseup', onDragMouseUp);
    };

    titlebar.addEventListener('mousedown', (e) => {
      if (e.target.closest('.lw-btn')) return;
      startDrag(e.clientX, e.clientY);
      document.addEventListener('mousemove', onDragMouseMove);
      document.addEventListener('mouseup', onDragMouseUp);
    });
    titlebar.addEventListener('touchstart', (e) => { if (e.target.closest('.lw-btn')) return; const t = e.touches[0]; startDrag(t.clientX, t.clientY); }, { passive: true });
    titlebar.addEventListener('touchmove', (e) => { const t = e.touches[0]; moveDrag(t.clientX, t.clientY); }, { passive: true });
    titlebar.addEventListener('touchend', () => { dragging = false; });
    titlebar.addEventListener('dblclick', () => this.toggleMaximize(winId));

    // Resize — mesmo cuidado: listeners de document só ficam ativos durante o
    // redimensionamento. Também funciona por toque, para tablets e celulares.
    if (resizer) {
      let resizing = false, rsx = 0, rsy = 0, rw = 0, rh = 0;
      const startResize = (x, y) => { resizing = true; rsx = x; rsy = y; rw = el.offsetWidth; rh = el.offsetHeight; };
      const moveResize = (x, y) => {
        if (!resizing) return;
        el.style.width = Math.max(280, rw + (x - rsx)) + 'px';
        el.style.height = Math.max(220, rh + (y - rsy)) + 'px';
      };
      const onResizeMouseMove = (e) => moveResize(e.clientX, e.clientY);
      const onResizeMouseUp = () => {
        resizing = false;
        document.removeEventListener('mousemove', onResizeMouseMove);
        document.removeEventListener('mouseup', onResizeMouseUp);
      };
      resizer.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        startResize(e.clientX, e.clientY);
        document.addEventListener('mousemove', onResizeMouseMove);
        document.addEventListener('mouseup', onResizeMouseUp);
      });
      resizer.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        const t = e.touches[0];
        startResize(t.clientX, t.clientY);
      }, { passive: true });
      resizer.addEventListener('touchmove', (e) => {
        const t = e.touches[0];
        moveResize(t.clientX, t.clientY);
      }, { passive: true });
      resizer.addEventListener('touchend', () => { resizing = false; });
    }

    el.querySelector('.lw-min').addEventListener('click', () => this.minimize(winId));
    el.querySelector('.lw-max').addEventListener('click', () => this.toggleMaximize(winId));
    el.querySelector('.lw-close').addEventListener('click', () => this.close(winId));
  }

  focus(winId) {
    const w = this.windows.get(winId);
    if (!w) return;
    this.zCounter++;
    w.el.style.zIndex = this.zCounter;
    for (const [id, ww] of this.windows) ww.el.classList.toggle('active', id === winId);
    if (window.desktopManager) window.desktopManager.setActiveTaskbarApp(winId);
  }

  minimize(winId) {
    const w = this.windows.get(winId);
    if (!w) return;
    w.minimized = true;
    w.el.classList.add('minimized');
    try { soundManager.minimize(); } catch (e) {}
    if (window.desktopManager) window.desktopManager.updateTaskbarState(winId, true);
  }

  restore(winId) {
    const w = this.windows.get(winId);
    if (!w) return;
    w.minimized = false;
    w.el.classList.remove('minimized');
    if (window.desktopManager) window.desktopManager.updateTaskbarState(winId, false);
  }

  toggleMinimizeRestore(winId) {
    const w = this.windows.get(winId);
    if (!w) return;
    if (w.minimized) { this.restore(winId); this.focus(winId); }
    else this.minimize(winId);
  }

  toggleMaximize(winId) {
    const w = this.windows.get(winId);
    if (!w) return;
    const desktop = document.getElementById('desktop');
    if (!w.maximized) {
      w.prevRect = { left: w.el.style.left, top: w.el.style.top, width: w.el.style.width, height: w.el.style.height };
      w.el.style.left = '0px'; w.el.style.top = '0px';
      w.el.style.width = desktop.clientWidth + 'px';
      w.el.style.height = desktop.clientHeight + 'px';
      w.el.classList.add('maximized');
      w.maximized = true;
    } else {
      if (w.prevRect) {
        w.el.style.left = w.prevRect.left; w.el.style.top = w.prevRect.top;
        w.el.style.width = w.prevRect.width; w.el.style.height = w.prevRect.height;
      }
      w.el.classList.remove('maximized');
      w.maximized = false;
    }
  }

  close(winId) {
    const w = this.windows.get(winId);
    if (!w) return;
    try {
      const content = w.el.querySelector('.lw-body')?.firstElementChild;
      if (content && typeof content._cleanup === 'function') content._cleanup();
    } catch (e) { /* ignore */ }
    w.el.classList.add('closing');
    try { soundManager.close(); } catch (e) {}
    setTimeout(() => {
      w.el.remove();
      this.windows.delete(winId);
      if (window.desktopManager) window.desktopManager.removeTaskbarApp(winId);
    }, 180);
  }

  closeAll() {
    for (const id of [...this.windows.keys()]) this.close(id);
  }
}

const windowManager = new WindowManager();

/**
 * Diz se a janela que contém `panel` é a janela ativa (em foco) do sistema, e se
 * o usuário não está digitando em um campo de texto de OUTRA janela no momento.
 * Usado por jogos que escutam o teclado (piano, labirinto, come-come, corrida)
 * para não "roubar" teclas quando estão minimizados, em segundo plano, ou quando
 * a criança está digitando em outro aplicativo (ex.: Notas).
 */
function isPanelActiveWindow(panel) {
  const win = panel.closest('.Anne-window');
  if (!win || !win.classList.contains('active') || win.classList.contains('minimized')) return false;
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return false;
  return true;
}
