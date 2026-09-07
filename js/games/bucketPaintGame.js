/* ==========================================================================
   Anne OS Kids — bucketPaintGame.js
   Balde de Tinta: desenhos prontos para colorir com balde (flood fill)
   ========================================================================== */

const BUCKET_SCENES = [
  { id: 'sol', label: '☀️ Sol e Flor', draw: drawBucketSunFlower },
  { id: 'casa', label: '🏠 Casinha', draw: drawBucketHouse },
  { id: 'borboleta', label: '🦋 Borboleta', draw: drawBucketButterfly },
  { id: 'peixe', label: '🐟 Peixinho', draw: drawBucketFish }
];

const BUCKET_COLORS = ['#ff6f6f', '#ff9f6f', '#ffd166', '#6fdc8c', '#4fc3f7', '#8c6fff', '#ff6fa5', '#7a4a2b', '#000000'];

function drawBucketSunFlower(ctx, w, h) {
  ctx.lineWidth = 5; ctx.strokeStyle = '#000';
  ctx.beginPath(); ctx.arc(w * 0.25, h * 0.22, w * 0.11, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.25 + Math.cos(a) * w * 0.14, h * 0.22 + Math.sin(a) * w * 0.14);
    ctx.lineTo(w * 0.25 + Math.cos(a) * w * 0.2, h * 0.22 + Math.sin(a) * w * 0.2);
    ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(w * 0.6, h * 0.55); ctx.lineTo(w * 0.6, h * 0.9); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.75, w * 0.06, w * 0.03, -0.5, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(w * 0.7, h * 0.8, w * 0.06, w * 0.03, 0.5, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(w * 0.6 + Math.cos(a) * w * 0.11, h * 0.5 + Math.sin(a) * w * 0.11, w * 0.08, w * 0.045, a, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(w * 0.6, h * 0.5, w * 0.07, 0, Math.PI * 2); ctx.stroke();
}
function drawBucketHouse(ctx, w, h) {
  ctx.lineWidth = 5; ctx.strokeStyle = '#000';
  ctx.strokeRect(w * 0.2, h * 0.45, w * 0.6, h * 0.42);
  ctx.beginPath(); ctx.moveTo(w * 0.14, h * 0.45); ctx.lineTo(w * 0.5, h * 0.15); ctx.lineTo(w * 0.86, h * 0.45); ctx.closePath(); ctx.stroke();
  ctx.strokeRect(w * 0.44, h * 0.62, w * 0.13, h * 0.25);
  ctx.strokeRect(w * 0.28, h * 0.53, w * 0.1, h * 0.1);
  ctx.strokeRect(w * 0.62, h * 0.53, w * 0.1, h * 0.1);
  ctx.strokeRect(w * 0.68, h * 0.2, w * 0.06, h * 0.12);
}
function drawBucketButterfly(ctx, w, h) {
  ctx.lineWidth = 5; ctx.strokeStyle = '#000';
  ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.5, w * 0.035, h * 0.28, 0, 0, Math.PI * 2); ctx.stroke();
  const wings = [[0.32, 0.32, 0.16, 0.13], [0.68, 0.32, 0.16, 0.13], [0.32, 0.68, 0.13, 0.11], [0.68, 0.68, 0.13, 0.11]];
  wings.forEach(([cx, cy, rx, ry]) => { ctx.beginPath(); ctx.ellipse(w * cx, h * cy, w * rx, h * ry, 0, 0, Math.PI * 2); ctx.stroke(); });
  ctx.beginPath(); ctx.moveTo(w * 0.48, h * 0.24); ctx.lineTo(w * 0.4, h * 0.12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w * 0.52, h * 0.24); ctx.lineTo(w * 0.6, h * 0.12); ctx.stroke();
}
function drawBucketFish(ctx, w, h) {
  ctx.lineWidth = 5; ctx.strokeStyle = '#000';
  ctx.beginPath(); ctx.ellipse(w * 0.45, h * 0.5, w * 0.28, h * 0.18, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w * 0.17, h * 0.5); ctx.lineTo(w * 0.02, h * 0.34); ctx.lineTo(w * 0.02, h * 0.66); ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.arc(w * 0.62, h * 0.44, w * 0.03, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w * 0.4, h * 0.34); ctx.quadraticCurveTo(w * 0.5, h * 0.18, w * 0.6, h * 0.3); ctx.stroke();
}

function openBucketPaintApp() {
  const panel = document.createElement('div');
  panel.className = 'app-panel bp-panel';
  panel.innerHTML = `
    <h2>🪣 Balde de Tinta</h2>
    <div class="bp-toolbar">
      <div class="bp-scenes" id="bp-scenes"></div>
      <button id="bp-clear" class="btn-secondary">🧽 Limpar</button>
      <button id="bp-save" class="btn-secondary">💾 Salvar imagem</button>
    </div>
    <div class="bp-status"><span id="bp-score">Pontos: 0</span><span id="bp-filled">Áreas: 0</span></div>
    <div class="bp-palette" id="bp-palette"></div>
    <div class="bp-canvas-wrap">
      <canvas id="bp-canvas" width="380" height="360"></canvas>
    </div>
  `;
  setTimeout(() => initBucketPaintApp(panel), 0);
  return panel;
}

function initBucketPaintApp(panel) {
  const canvas = panel.querySelector('#bp-canvas');
  const ctx = canvas.getContext('2d');
  const palette = panel.querySelector('#bp-palette');
  const scenesWrap = panel.querySelector('#bp-scenes');
  let sceneIdx = 0;
  let currentColor = BUCKET_COLORS[0];
  let filledCount = 0;
  let score = 0;
  let rewarded = false;

  BUCKET_COLORS.forEach((c, i) => {
    const b = document.createElement('button');
    b.className = 'bp-color' + (i === 0 ? ' selected' : '');
    b.style.background = c;
    b.addEventListener('click', () => {
      soundManager.click();
      currentColor = c;
      palette.querySelectorAll('.bp-color').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
    });
    palette.appendChild(b);
  });

  BUCKET_SCENES.forEach((sc, i) => {
    const b = document.createElement('button');
    b.className = 'pz-scene-btn' + (i === 0 ? ' selected' : '');
    b.textContent = sc.label;
    b.addEventListener('click', () => {
      soundManager.click();
      sceneIdx = i;
      scenesWrap.querySelectorAll('.pz-scene-btn').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      resetCanvas();
    });
    scenesWrap.appendChild(b);
  });

  panel.querySelector('#bp-clear').addEventListener('click', () => { soundManager.click(); resetCanvas(); });
  panel.querySelector('#bp-save').addEventListener('click', saveImage);

  function resetCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    BUCKET_SCENES[sceneIdx].draw(ctx, canvas.width, canvas.height);
    filledCount = 0;
    score = 0;
    rewarded = false;
    panel.querySelector('#bp-score').textContent = 'Pontos: 0';
    panel.querySelector('#bp-filled').textContent = 'Áreas: 0';
  }

  function colorAt(data, i) { return [data[i], data[i + 1], data[i + 2], data[i + 3]]; }
  function colorsMatch(a, b, tol) {
    return Math.abs(a[0] - b[0]) <= tol && Math.abs(a[1] - b[1]) <= tol && Math.abs(a[2] - b[2]) <= tol && Math.abs(a[3] - b[3]) <= tol;
  }
  function hexToRgba(hex) {
    const v = parseInt(hex.slice(1), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255, 255];
  }

  async function floodFill(x, y, fillColor) {
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
    const w = canvas.width, h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const startIdx = (y * w + x) * 4;
    const target = colorAt(data, startIdx);
    const fill = hexToRgba(fillColor);
    if (colorsMatch(target, fill, 10)) return;
    const stack = [[x, y]];
    const tol = 60;
    let painted = 0;
    while (stack.length) {
      const [cx, cy] = stack.pop();
      if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue;
      const idx = (cy * w + cx) * 4;
      if (!colorsMatch(colorAt(data, idx), target, tol)) continue;
      data[idx] = fill[0]; data[idx + 1] = fill[1]; data[idx + 2] = fill[2]; data[idx + 3] = 255;
      painted++;
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    ctx.putImageData(imgData, 0, 0);
    if (painted > 30) {
      filledCount++;
      score = filledCount * 10;
      panel.querySelector('#bp-score').textContent = 'Pontos: ' + score;
      panel.querySelector('#bp-filled').textContent = 'Áreas: ' + filledCount;
      soundManager.click();
      if (filledCount >= 4 && !rewarded && userManager && userManager.currentUser) {
        rewarded = true;
        await userManager.saveGameResult('balde-tinta', filledCount * 10);
        await userManager.addStars(4);
        await achievementManager.checkAndUnlock();
      }
    }
  }

  async function saveImage() {
    soundManager.click();
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'balde-de-tinta.png';
    link.click();
    if (userManager && userManager.currentUser) {
      await db.add('drawings', {
        usuario_id: userManager.currentUser.id,
        nome: 'Balde de Tinta ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        imagem: dataUrl,
        data: new Date().toISOString()
      });
      notificationManager.show('Imagem salva em Meus Arquivos! 🎨', '💾');
      await userManager.addStars(2);
      await achievementManager.checkAndUnlock();
    }
  }

  function handleClick(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const point = e.touches ? e.touches[0] : e;
    const x = Math.floor((point.clientX - rect.left) * scaleX);
    const y = Math.floor((point.clientY - rect.top) * scaleY);
    floodFill(x, y, currentColor);
  }

  canvas.addEventListener('click', handleClick);
  canvas.addEventListener('touchstart', handleClick, { passive: false });

  resetCanvas();
  panel._cleanup = () => {};
}
