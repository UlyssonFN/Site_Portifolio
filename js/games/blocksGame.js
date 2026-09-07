/* ==========================================================================
   Anne OS Kids — blocksGame.js
   Blocos Criativos: construção de blocos estilo "Minecraft" (modo criativo)
   Edição por camadas (visão de cima) + pré-visualização isométrica em SVG.
   ========================================================================== */

const BLOCK_TYPES = [
  { id: 'grama', label: 'Grama', color: '#6fdc8c' },
  { id: 'terra', label: 'Terra', color: '#a97452' },
  { id: 'pedra', label: 'Pedra', color: '#b9b9c8' },
  { id: 'madeira', label: 'Madeira', color: '#c98b4a' },
  { id: 'agua', label: 'Água', color: '#4fc3f7' },
  { id: 'areia', label: 'Areia', color: '#f2dca0' },
  { id: 'folha', label: 'Folha', color: '#3d9c5c' },
  { id: 'neve', label: 'Neve', color: '#ffffff' }
];
const BLK_GRID = 6;
const BLK_LAYERS = 5;

function shadeColor(hex, percent) {
  const v = parseInt(hex.slice(1), 16);
  let r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
  const adj = (c) => Math.max(0, Math.min(255, Math.round(c + (percent < 0 ? c : 255 - c) * percent)));
  return `rgb(${adj(r)},${adj(g)},${adj(b)})`;
}

function openBlocksApp() {
  const panel = document.createElement('div');
  panel.className = 'app-panel blk-panel';
  panel.innerHTML = `
    <h2>🧱 Blocos Criativos</h2>
    <div class="blk-toolbar">
      <div class="blk-layers" id="blk-layers"></div>
      <button id="blk-eraser" class="blk-tool-btn">🧹 Apagar</button>
      <button id="blk-clear" class="btn-secondary">🗑️ Limpar tudo</button>
    </div>
    <div class="blk-palette" id="blk-palette"></div>
    <div class="blk-main">
      <div class="blk-edit-wrap">
        <p class="blk-hint">👇 Clique para construir na camada selecionada</p>
        <div class="blk-grid" id="blk-grid"></div>
      </div>
      <div class="blk-preview-wrap">
        <p class="blk-hint">🔭 Sua construção — arraste ou use as setas para girar</p>
        <div class="blk-rotate-row">
          <button id="blk-rotate-left" class="blk-tool-btn">⟲ Girar</button>
          <button id="blk-rotate-right" class="blk-tool-btn">Girar ⟳</button>
        </div>
        <div id="blk-preview"></div>
      </div>
    </div>
    <div class="blk-status"><span id="blk-score">Pontos: 0</span><span id="blk-count">Blocos: 0</span><button id="blk-save" class="btn-secondary">💾 Salvar imagem</button></div>
  `;
  setTimeout(() => initBlocksApp(panel), 0);
  return panel;
}

function initBlocksApp(panel) {
  const blocks = new Map(); // "x,y,z" -> cor hex
  let currentLayer = 0;
  let currentColor = BLOCK_TYPES[0].color;
  let eraser = false;
  let rewarded = false;
  let score = 0;
  let lastSvg = '';
  let rotation = -Math.PI / 4; // ângulo de visão 3D (rad) — gira ao redor do eixo vertical

  const layersWrap = panel.querySelector('#blk-layers');
  for (let y = 0; y < BLK_LAYERS; y++) {
    const b = document.createElement('button');
    b.className = 'blk-layer-btn' + (y === 0 ? ' selected' : '');
    b.textContent = 'Camada ' + (y + 1);
    b.addEventListener('click', () => {
      soundManager.click();
      currentLayer = y;
      layersWrap.querySelectorAll('.blk-layer-btn').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      renderEditGrid();
    });
    layersWrap.appendChild(b);
  }

  const palette = panel.querySelector('#blk-palette');
  BLOCK_TYPES.forEach((bt, i) => {
    const b = document.createElement('button');
    b.className = 'blk-color' + (i === 0 ? ' selected' : '');
    b.style.background = bt.color;
    b.title = bt.label;
    b.addEventListener('click', () => {
      soundManager.click();
      currentColor = bt.color;
      eraser = false;
      panel.querySelector('#blk-eraser').classList.remove('selected');
      palette.querySelectorAll('.blk-color').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
    });
    palette.appendChild(b);
  });

  const eraserBtn = panel.querySelector('#blk-eraser');
  eraserBtn.addEventListener('click', () => {
    soundManager.click();
    eraser = !eraser;
    eraserBtn.classList.toggle('selected', eraser);
  });

  panel.querySelector('#blk-clear').addEventListener('click', () => {
    if (!confirm('Apagar toda a construção?')) return;
    soundManager.click();
    blocks.clear();
    rewarded = false;
    score = 0;
    updateScore();
    renderEditGrid();
    renderPreview();
  });
  panel.querySelector('#blk-save').addEventListener('click', saveImage);

  const previewWrap = panel.querySelector('#blk-preview');
  panel.querySelector('#blk-rotate-left').addEventListener('click', () => { soundManager.click(); rotation -= Math.PI / 6; renderPreview(); });
  panel.querySelector('#blk-rotate-right').addEventListener('click', () => { soundManager.click(); rotation += Math.PI / 6; renderPreview(); });

  let dragRotating = false, dragStartX = 0, dragStartRotation = 0;
  previewWrap.addEventListener('pointerdown', (e) => {
    dragRotating = true; dragStartX = e.clientX; dragStartRotation = rotation;
    previewWrap.setPointerCapture(e.pointerId);
  });
  previewWrap.addEventListener('pointermove', (e) => {
    if (!dragRotating) return;
    rotation = dragStartRotation + (e.clientX - dragStartX) * 0.012;
    renderPreview();
  });
  previewWrap.addEventListener('pointerup', () => { dragRotating = false; });

  function key(x, y, z) { return x + ',' + y + ',' + z; }

  function renderEditGrid() {
    const grid = panel.querySelector('#blk-grid');
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${BLK_GRID}, 1fr)`;
    for (let z = 0; z < BLK_GRID; z++) {
      for (let x = 0; x < BLK_GRID; x++) {
        const cell = document.createElement('div');
        cell.className = 'blk-cell';
        const c = blocks.get(key(x, currentLayer, z));
        if (c) { cell.style.background = c; cell.classList.add('has-block'); }
        else if (currentLayer > 0 && blocks.get(key(x, currentLayer - 1, z))) {
          cell.classList.add('has-support');
        }
        cell.addEventListener('click', () => {
          soundManager.click();
          if (eraser) blocks.delete(key(x, currentLayer, z));
          else blocks.set(key(x, currentLayer, z), currentColor);
          renderEditGrid();
          renderPreview();
          updateScore();
          maybeReward();
        });
        grid.appendChild(cell);
      }
    }
  }

  async function maybeReward() {
    if (!rewarded && blocks.size >= 15 && window.userManager && userManager.currentUser) {
      rewarded = true;
      await userManager.saveGameResult('blocos-criativos', blocks.size);
      await userManager.addStars(5);
      notificationManager.show('Que construção incrível! 🏗️', '🧱', 3000);
      if (window.achievementManager) await achievementManager.checkAndUnlock();
    }
  }

  function renderPreview() {
    const wrap = previewWrap;
    const S = 16, H = 20;
    const svgW = 420, svgH = 340;
    const originX = svgW / 2, originY = 170;
    const c0 = (BLK_GRID - 1) / 2;
    const items = [];
    blocks.forEach((color, k) => {
      const [x, y, z] = k.split(',').map(Number);
      items.push({ x, y, z, color });
    });
    if (!items.length) { lastSvg = ''; wrap.innerHTML = '<p class="blk-empty">Comece a construir! 🧱</p>'; return; }

    const cosR = Math.cos(rotation), sinR = Math.sin(rotation);
    items.forEach(it => {
      const dx = it.x - c0, dz = it.z - c0;
      it.rx = dx * cosR - dz * sinR;
      it.rz = dx * sinR + dz * cosR;
    });
    items.sort((a, b) => (a.rx + a.rz + a.y) - (b.rx + b.rz + b.y));

    const pts = (arr) => arr.map(p => p.join(',')).join(' ');
    let svg = `<svg viewBox="0 0 ${svgW} ${svgH}" width="100%" height="100%">`;
    items.forEach(({ rx, rz, y, color }) => {
      const cx = originX + (rx - rz) * S;
      const cy = originY + (rx + rz) * (S / 2) - y * H;
      const top = [[cx, cy - S], [cx + S, cy - S / 2], [cx, cy], [cx - S, cy - S / 2]];
      const left = [[cx - S, cy - S / 2], [cx, cy], [cx, cy + H], [cx - S, cy + H - S / 2]];
      const right = [[cx + S, cy - S / 2], [cx, cy], [cx, cy + H], [cx + S, cy + H - S / 2]];
      svg += `<polygon points="${pts(top)}" fill="${shadeColor(color, 0.25)}"/>`;
      svg += `<polygon points="${pts(left)}" fill="${shadeColor(color, -0.25)}"/>`;
      svg += `<polygon points="${pts(right)}" fill="${shadeColor(color, -0.45)}"/>`;
    });
    svg += `</svg>`;
    lastSvg = svg;
    wrap.innerHTML = svg;
  }

  function updateScore() {
    score = blocks.size;
    panel.querySelector('#blk-score').textContent = 'Pontos: ' + score;
    panel.querySelector('#blk-count').textContent = 'Blocos: ' + blocks.size;
  }

  async function saveImage() {
    if (!lastSvg) return;
    soundManager.click();
    const svgData = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(lastSvg);
    const link = document.createElement('a');
    link.href = svgData;
    link.download = 'blocos-criativos.svg';
    link.click();
    if (window.userManager && userManager.currentUser) {
      await db.add('drawings', {
        usuario_id: userManager.currentUser.id,
        nome: 'Blocos Criativos ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        imagem: svgData,
        data: new Date().toISOString()
      });
      notificationManager.show('Construção salva em Meus Arquivos! 🧱', '💾');
      await userManager.addStars(2);
      await achievementManager.checkAndUnlock();
    }
  }

  renderEditGrid();
  updateScore();
  renderPreview();
  panel._cleanup = () => {};
}
