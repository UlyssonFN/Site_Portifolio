/* ==========================================================================
   Anne OS Kids — puzzleGame.js
   Quebra-Cabeça: jogo de slide puzzle (estilo 15-puzzle) com imagens geradas
   ========================================================================== */

const PUZZLE_SCENES = [
  { id: 'casa', label: '🏠 Casa', draw: drawPuzzleHouse },
  { id: 'gato', label: '🐱 Gato', draw: drawPuzzleCat },
  { id: 'arcoiris', label: '🌈 Arco-íris', draw: drawPuzzleRainbow },
  { id: 'peixe', label: '🐟 Peixe', draw: drawPuzzleFish }
];

function drawPuzzleHouse(ctx, s) {
  ctx.fillStyle = '#aee4ff'; ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = '#6fdc8c'; ctx.fillRect(0, s * 0.75, s, s * 0.25);
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(s * 0.82, s * 0.18, s * 0.09, 0, 7); ctx.fill();
  ctx.fillStyle = '#ff9f6f'; ctx.fillRect(s * 0.28, s * 0.42, s * 0.44, s * 0.36);
  ctx.beginPath(); ctx.moveTo(s * 0.22, s * 0.42); ctx.lineTo(s * 0.5, s * 0.18); ctx.lineTo(s * 0.78, s * 0.42); ctx.closePath();
  ctx.fillStyle = '#ff6f6f'; ctx.fill();
  ctx.fillStyle = '#8c6fff'; ctx.fillRect(s * 0.46, s * 0.58, s * 0.1, s * 0.2);
  ctx.fillStyle = '#4fc3f7'; ctx.fillRect(s * 0.32, s * 0.48, s * 0.1, s * 0.1); ctx.fillRect(s * 0.6, s * 0.48, s * 0.1, s * 0.1);
}
function drawPuzzleCat(ctx, s) {
  ctx.fillStyle = '#ffe29f'; ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = '#ff9f6f';
  ctx.beginPath(); ctx.arc(s * 0.5, s * 0.55, s * 0.28, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(s * 0.28, s * 0.32); ctx.lineTo(s * 0.34, s * 0.1); ctx.lineTo(s * 0.42, s * 0.3); ctx.fill();
  ctx.beginPath(); ctx.moveTo(s * 0.72, s * 0.32); ctx.lineTo(s * 0.66, s * 0.1); ctx.lineTo(s * 0.58, s * 0.3); ctx.fill();
  ctx.fillStyle = '#3a2a55';
  ctx.beginPath(); ctx.arc(s * 0.42, s * 0.52, s * 0.025, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(s * 0.58, s * 0.52, s * 0.025, 0, 7); ctx.fill();
  ctx.fillStyle = '#ff6f6f'; ctx.beginPath(); ctx.arc(s * 0.5, s * 0.6, s * 0.02, 0, 7); ctx.fill();
}
function drawPuzzleRainbow(ctx, s) {
  ctx.fillStyle = '#eaf7ff'; ctx.fillRect(0, 0, s, s);
  const colors = ['#ff6f6f', '#ff9f6f', '#ffd166', '#6fdc8c', '#4fc3f7', '#8c6fff'];
  colors.forEach((c, i) => {
    ctx.strokeStyle = c; ctx.lineWidth = s * 0.045;
    ctx.beginPath(); ctx.arc(s * 0.5, s * 0.95, s * 0.42 - i * s * 0.045, Math.PI, 2 * Math.PI); ctx.stroke();
  });
}
function drawPuzzleFish(ctx, s) {
  ctx.fillStyle = '#bdeaff'; ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = '#ff9f6f';
  ctx.beginPath(); ctx.ellipse(s * 0.45, s * 0.5, s * 0.28, s * 0.18, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(s * 0.18, s * 0.5); ctx.lineTo(s * 0.05, s * 0.36); ctx.lineTo(s * 0.05, s * 0.64); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3a2a55'; ctx.beginPath(); ctx.arc(s * 0.62, s * 0.45, s * 0.02, 0, 7); ctx.fill();
}

function openPuzzleApp() {
  const panel = document.createElement('div');
  panel.className = 'app-panel puzzle-panel';
  panel.innerHTML = `
    <h2>🧩 Quebra-Cabeça</h2>
    <div class="pz-toolbar">
      <div class="pz-scenes" id="pz-scenes"></div>
      <div class="pz-sizes">
        <button class="pz-size-btn" data-n="3">Fácil 3x3</button>
        <button class="pz-size-btn" data-n="4">Médio 4x4</button>
      </div>
    </div>
    <div class="pz-status">
      <span id="pz-moves">Movimentos: 0</span>
      <span id="pz-score">Pontos: 0</span>
      <div class="pz-actions">
        <button id="pz-shuffle" class="btn-secondary">🔀 Embaralhar</button>
        <button id="pz-reset" class="btn-secondary">🔄 Novo jogo</button>
      </div>
    </div>
    <div id="pz-board" class="pz-board"></div>
    <p id="pz-win" class="pz-win" style="display:none;">🎉 Você completou o quebra-cabeça! 🎉</p>
  `;
  setTimeout(() => initPuzzleApp(panel), 0);
  return panel;
}

function initPuzzleApp(panel) {
  let sceneIdx = 0;
  let n = 3;
  let tiles = [];
  let moves = 0;
  let score = 0;
  let completed = false;
  let imgData = '';

  const scenesWrap = panel.querySelector('#pz-scenes');
  PUZZLE_SCENES.forEach((sc, i) => {
    const b = document.createElement('button');
    b.className = 'pz-scene-btn' + (i === 0 ? ' selected' : '');
    b.textContent = sc.label;
    b.addEventListener('click', () => {
      soundManager.click();
      sceneIdx = i;
      scenesWrap.querySelectorAll('.pz-scene-btn').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      newGame();
    });
    scenesWrap.appendChild(b);
  });

  panel.querySelectorAll('.pz-size-btn').forEach(b => {
    b.classList.toggle('selected', +b.dataset.n === n);
    b.addEventListener('click', () => {
      soundManager.click();
      n = +b.dataset.n;
      panel.querySelectorAll('.pz-size-btn').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      newGame();
    });
  });
  panel.querySelector('#pz-shuffle').addEventListener('click', () => { soundManager.click(); newGame(); });
  panel.querySelector('#pz-reset').addEventListener('click', () => { soundManager.click(); newGame(); });

  function genImage() {
    const c = document.createElement('canvas');
    c.width = 360; c.height = 360;
    const ctx = c.getContext('2d');
    PUZZLE_SCENES[sceneIdx].draw(ctx, 360);
    imgData = c.toDataURL();
  }

  function validMoves(blank, n) {
    const r = Math.floor(blank / n), c = blank % n;
    const res = [];
    if (r > 0) res.push(blank - n);
    if (r < n - 1) res.push(blank + n);
    if (c > 0) res.push(blank - 1);
    if (c < n - 1) res.push(blank + 1);
    return res;
  }

  function newGame() {
    genImage();
    moves = 0;
    score = 0;
    completed = false;
    panel.querySelector('#pz-moves').textContent = 'Movimentos: 0';
    panel.querySelector('#pz-score').textContent = 'Pontos: 0';
    panel.querySelector('#pz-win').style.display = 'none';
    tiles = Array.from({ length: n * n }, (_, i) => i);
    // Embaralha com trocas válidas a partir do estado resolvido — garante que
    // o quebra-cabeça sempre tenha solução possível.
    for (let k = 0; k < n * n * 40; k++) {
      const blank = tiles.indexOf(n * n - 1);
      const opts = validMoves(blank, n);
      const pick = opts[Math.floor(Math.random() * opts.length)];
      [tiles[blank], tiles[pick]] = [tiles[pick], tiles[blank]];
    }
    render();
  }

  function render() {
    const board = panel.querySelector('#pz-board');
    board.innerHTML = '';
    board.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    const blankVal = n * n - 1;
    tiles.forEach((val, pos) => {
      const div = document.createElement('div');
      div.className = 'pz-tile' + (val === blankVal ? ' pz-blank' : '');
      if (val !== blankVal) {
        const row = Math.floor(val / n), col = val % n;
        div.style.backgroundImage = `url(${imgData})`;
        div.style.backgroundSize = `${n * 100}% ${n * 100}%`;
        div.style.backgroundPosition = `${(col / (n - 1)) * 100}% ${(row / (n - 1)) * 100}%`;
        div.addEventListener('click', () => tryMove(pos));
      }
      board.appendChild(div);
    });
  }

  function tryMove(pos) {
    const blank = tiles.indexOf(n * n - 1);
    if (!validMoves(blank, n).includes(pos)) return;
    [tiles[blank], tiles[pos]] = [tiles[pos], tiles[blank]];
    moves++;
    soundManager.click();
    panel.querySelector('#pz-moves').textContent = 'Movimentos: ' + moves;
    render();
    if (tiles.every((v, i) => v === i) && !completed) onWin();
  }

  async function onWin() {
    completed = true;
    score = Math.max(1000 - moves * 10, 50);
    panel.querySelector('#pz-score').textContent = 'Pontos: ' + score;
    panel.querySelector('#pz-win').style.display = 'block';
    soundManager.success();
    if (window.userManager && userManager.currentUser) {
      await userManager.saveGameResult('quebra-cabeca', score);
      await userManager.addStars(5);
      if (window.achievementManager) await achievementManager.checkAndUnlock();
    }
  }

  newGame();
  panel._cleanup = () => {};
}
