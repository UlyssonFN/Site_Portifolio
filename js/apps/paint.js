/* ==========================================================================
   Anne OS Kids — apps/paint.js
   🎨 Anne Paint: pintura com pincel, formas, balde, galeria
   ========================================================================== */

const PAINT_COLORS = ['#000000', '#ffffff', '#ff6f6f', '#ff9f6f', '#ffd166', '#6fdc8c', '#4fc3f7', '#8c6fff', '#ff6fa5', '#8b5a2b', '#888888'];

function openPaintApp(mode) {
  const panel = document.createElement('div');
  panel.className = 'paint-layout';
  panel.innerHTML = `
    <div class="paint-toolbar">
      <button class="paint-tool active" data-tool="brush" title="Pincel">🖌️</button>
      <button class="paint-tool" data-tool="pencil" title="Lápis">✏️</button>
      <button class="paint-tool" data-tool="eraser" title="Borracha">🧽</button>
      <button class="paint-tool" data-tool="bucket" title="Balde de tinta">🪣</button>
      <button class="paint-tool" data-tool="line" title="Linha">📏</button>
      <button class="paint-tool" data-tool="circle" title="Círculo">⭕</button>
      <button class="paint-tool" data-tool="rect" title="Retângulo">▭</button>
      <input type="range" class="paint-range" id="paint-size" min="1" max="40" value="6" title="Espessura">
      <div class="paint-colors" id="paint-colors"></div>
      <input type="color" id="paint-custom-color" value="#222222" title="Cor personalizada">
      <button class="paint-tool" data-action="undo" title="Desfazer">↩️</button>
      <button class="paint-tool" data-action="redo" title="Refazer">↪️</button>
      <button class="paint-tool" data-action="clear" title="Limpar tela">🗑️</button>
      <button class="paint-tool" data-action="save" title="Salvar desenho">💾</button>
      <button class="paint-tool" data-action="gallery" title="Meus desenhos">🖼️</button>
    </div>
    <div class="paint-canvas-wrap">
      <canvas id="paint-canvas"></canvas>
      <div class="paint-gallery" id="paint-gallery" style="display:none;"></div>
    </div>
  `;

  const colorsWrap = panel.querySelector('#paint-colors');
  PAINT_COLORS.forEach((c, i) => {
    const sw = document.createElement('div');
    sw.className = 'paint-color' + (i === 0 ? ' selected' : '');
    sw.style.background = c;
    sw.dataset.color = c;
    colorsWrap.appendChild(sw);
  });

  setTimeout(() => initPaintCanvas(panel), 0);
  return panel;
}

function initPaintCanvas(panel) {
  const canvas = panel.querySelector('#paint-canvas');
  const wrap = panel.querySelector('.paint-canvas-wrap');
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    const img = ctx.getImageData ? safeGetImage(canvas, ctx) : null;
    canvas.width = wrap.clientWidth;
    canvas.height = wrap.clientHeight;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (img) ctx.putImageData(img, 0, 0);
  }
  function safeGetImage(c, cx) {
    try { return cx.getImageData(0, 0, c.width, c.height); } catch (e) { return null; }
  }
  resizeCanvas();
  const ro = new ResizeObserver(() => resizeCanvas());
  ro.observe(wrap);

  let tool = 'brush', color = '#000000', size = 6;
  let drawing = false, startX = 0, startY = 0, snapshot = null;
  const undoStack = [], redoStack = [];

  function pushUndo() {
    undoStack.push(canvas.toDataURL());
    if (undoStack.length > 25) undoStack.shift();
    redoStack.length = 0;
  }
  function restoreFromData(data) {
    const img = new Image();
    img.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0); };
    img.src = data;
  }

  panel.querySelectorAll('.paint-tool[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => {
      panel.querySelectorAll('.paint-tool[data-tool]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      tool = btn.dataset.tool;
    });
  });
  panel.querySelectorAll('.paint-color').forEach(sw => {
    sw.addEventListener('click', () => {
      panel.querySelectorAll('.paint-color').forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
      color = sw.dataset.color;
    });
  });
  panel.querySelector('#paint-custom-color').addEventListener('input', (e) => { color = e.target.value; });
  panel.querySelector('#paint-size').addEventListener('input', (e) => { size = +e.target.value; });

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - rect.left, y: cy - rect.top };
  }

  function floodFill(x, y, fillColor) {
    const w = canvas.width, h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const idx = (Math.floor(y) * w + Math.floor(x)) * 4;
    const target = [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
    const fillRgb = hexToRgb(fillColor);
    if (target[0] === fillRgb[0] && target[1] === fillRgb[1] && target[2] === fillRgb[2]) return;
    const stack = [[Math.floor(x), Math.floor(y)]];
    const matches = (i) => Math.abs(data[i] - target[0]) < 20 && Math.abs(data[i + 1] - target[1]) < 20 && Math.abs(data[i + 2] - target[2]) < 20;
    let iterations = 0;
    while (stack.length && iterations < 400000) {
      iterations++;
      const [cx, cy] = stack.pop();
      if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue;
      const i = (cy * w + cx) * 4;
      if (!matches(i)) continue;
      data[i] = fillRgb[0]; data[i + 1] = fillRgb[1]; data[i + 2] = fillRgb[2]; data[i + 3] = 255;
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    ctx.putImageData(imgData, 0, 0);
  }
  function hexToRgb(hex) {
    if (hex.length === 4) hex = '#' + [...hex.slice(1)].map(c => c + c).join('');
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function pointerDown(e) {
    e.preventDefault();
    const p = getPos(e);
    if (tool === 'bucket') { pushUndo(); floodFill(p.x, p.y, color); return; }
    drawing = true; startX = p.x; startY = p.y;
    pushUndo();
    if (tool === 'brush' || tool === 'pencil' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    } else {
      snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
  }
  function pointerMove(e) {
    if (!drawing) return;
    e.preventDefault();
    const p = getPos(e);
    if (tool === 'brush' || tool === 'pencil' || tool === 'eraser') {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      ctx.lineWidth = tool === 'pencil' ? Math.max(1, size / 3) : size;
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    } else if (['line', 'circle', 'rect'].includes(tool)) {
      ctx.putImageData(snapshot, 0, 0);
      ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = 'round';
      ctx.beginPath();
      if (tool === 'line') { ctx.moveTo(startX, startY); ctx.lineTo(p.x, p.y); }
      else if (tool === 'rect') { ctx.rect(startX, startY, p.x - startX, p.y - startY); }
      else if (tool === 'circle') {
        const r = Math.hypot(p.x - startX, p.y - startY);
        ctx.arc(startX, startY, r, 0, Math.PI * 2);
      }
      ctx.stroke();
    }
  }
  function pointerUp() { drawing = false; }

  canvas.addEventListener('mousedown', pointerDown);
  canvas.addEventListener('mousemove', pointerMove);
  window.addEventListener('mouseup', pointerUp);
  canvas.addEventListener('touchstart', pointerDown, { passive: false });
  canvas.addEventListener('touchmove', pointerMove, { passive: false });
  canvas.addEventListener('touchend', pointerUp);

  panel.querySelectorAll('.paint-tool[data-action]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      soundManager.click();
      if (action === 'undo') {
        if (!undoStack.length) return;
        redoStack.push(canvas.toDataURL());
        restoreFromData(undoStack.pop());
      } else if (action === 'redo') {
        if (!redoStack.length) return;
        pushUndoSilent();
        restoreFromData(redoStack.pop());
      } else if (action === 'clear') {
        pushUndo();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (action === 'save') {
        await saveDrawing(canvas);
      } else if (action === 'gallery') {
        toggleGallery(panel, canvas, ctx);
      }
    });
  });
  function pushUndoSilent() { undoStack.push(canvas.toDataURL()); }

  // Evita vazar o listener global de mouseup e o ResizeObserver toda vez que a
  // Pintura é reaberta (o app é singleton, então sem isso cada reabertura
  // empilhava mais um observador/listener nunca removido).
  panel._cleanup = () => {
    window.removeEventListener('mouseup', pointerUp);
    ro.disconnect();
  };
}

async function saveDrawing(canvas) {
  if (!userManager.currentUser) return;
  const dataUrl = canvas.toDataURL('image/png');
  const nome = 'Desenho ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  await db.add('drawings', {
    usuario_id: userManager.currentUser.id,
    nome,
    imagem: dataUrl,
    data: new Date().toISOString()
  });
  notificationManager.show('Desenho salvo em Meus Arquivos! 🎨', '💾');
  await userManager.addStars(2);
  await achievementManager.checkAndUnlock();
}

async function toggleGallery(panel, canvas, ctx) {
  const gallery = panel.querySelector('#paint-gallery');
  const wrap = panel.querySelector('.paint-canvas-wrap');
  if (gallery.style.display === 'none') {
    const drawings = userManager.currentUser ? await db.getByIndex('drawings', 'usuario_id', userManager.currentUser.id) : [];
    gallery.innerHTML = drawings.length ? '' : '<p style="padding:1rem;color:#999;">Nenhum desenho salvo ainda.</p>';
    drawings.slice().reverse().forEach(d => {
      const div = document.createElement('div');
      div.className = 'pg-item';
      div.innerHTML = `<img src="${d.imagem}" alt="${d.nome}"><div>${d.nome}</div>`;
      div.querySelector('img').addEventListener('click', () => {
        const img = new Image();
        img.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); };
        img.src = d.imagem;
        gallery.style.display = 'none';
        canvas.style.display = 'block';
      });
      gallery.appendChild(div);
    });
    gallery.style.display = 'grid';
    canvas.style.display = 'none';
  } else {
    gallery.style.display = 'none';
    canvas.style.display = 'block';
  }
}
