/* ==========================================================================
   Anne OS Kids — games/dogMaze.js
   🐕 Leve o Cachorro pra Casinha — labirinto gerado aleatoriamente
   ========================================================================== */

function dogMazeGenerate(cols, rows) {
  // Cada célula guarda paredes: {top,right,bottom,left}
  const cells = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ top: true, right: true, bottom: true, left: true, visited: false })));
  const stack = [{ r: 0, c: 0 }];
  cells[0][0].visited = true;
  const dirs = [
    { dr: -1, dc: 0, wall: 'top', opp: 'bottom' },
    { dr: 0, dc: 1, wall: 'right', opp: 'left' },
    { dr: 1, dc: 0, wall: 'bottom', opp: 'top' },
    { dr: 0, dc: -1, wall: 'left', opp: 'right' }
  ];
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const options = dirs
      .map(d => ({ ...d, r: cur.r + d.dr, c: cur.c + d.dc }))
      .filter(d => d.r >= 0 && d.r < rows && d.c >= 0 && d.c < cols && !cells[d.r][d.c].visited);
    if (!options.length) { stack.pop(); continue; }
    const pick = options[Math.floor(Math.random() * options.length)];
    cells[cur.r][cur.c][pick.wall] = false;
    cells[pick.r][pick.c][pick.opp] = false;
    cells[pick.r][pick.c].visited = true;
    stack.push({ r: pick.r, c: pick.c });
  }
  return cells;
}

function openDogMazeGame() {
  const panel = document.createElement('div');
  panel.className = 'app-panel';
  panel.innerHTML = `
    <h2 style="text-align:center;">🐕 Leve o Cachorro pra Casinha</h2>
    <div class="game-header"><span id="dm-level">Fase 1</span><span class="gh-score" id="dm-moves">Passos: 0</span></div>
    <div class="maze-wrap"><div class="maze-grid" id="dm-grid"></div></div>
    <div class="dpad" id="dm-dpad">
      <button data-d="up">⬆️</button>
      <div><button data-d="left">⬅️</button><button data-d="down">⬇️</button><button data-d="right">➡️</button></div>
    </div>
    <div class="quiz-feedback" id="dm-feedback" style="text-align:center;"></div>
  `;
  setTimeout(() => initDogMaze(panel), 0);
  return panel;
}

function initDogMaze(panel) {
  let level = 1, cells, size, pos, moves = 0, over = false;
  const grid = panel.querySelector('#dm-grid');
  const levelEl = panel.querySelector('#dm-level');
  const movesEl = panel.querySelector('#dm-moves');
  const feedbackEl = panel.querySelector('#dm-feedback');

  function newLevel() {
    size = Math.min(4 + level, 9);
    cells = dogMazeGenerate(size, size);
    pos = { r: 0, c: 0 };
    moves = 0; over = false;
    feedbackEl.textContent = '';
    levelEl.textContent = 'Fase ' + level;
    render();
  }

  function render() {
    grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    grid.innerHTML = '';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = cells[r][c];
        const div = document.createElement('div');
        div.className = 'maze-cell';
        if (cell.top) div.style.borderTop = '3px solid #6a4fa8';
        if (cell.right) div.style.borderRight = '3px solid #6a4fa8';
        if (cell.bottom) div.style.borderBottom = '3px solid #6a4fa8';
        if (cell.left) div.style.borderLeft = '3px solid #6a4fa8';
        if (r === pos.r && c === pos.c) div.textContent = '🐶';
        else if (r === size - 1 && c === size - 1) div.textContent = '🏠';
        grid.appendChild(div);
      }
    }
    movesEl.textContent = 'Passos: ' + moves;
  }

  async function move(dir) {
    if (over) return;
    const cell = cells[pos.r][pos.c];
    let nr = pos.r, nc = pos.c;
    if (dir === 'up' && !cell.top) nr--;
    else if (dir === 'down' && !cell.bottom) nr++;
    else if (dir === 'left' && !cell.left) nc--;
    else if (dir === 'right' && !cell.right) nc++;
    else { soundManager.error(); return; }
    pos = { r: nr, c: nc };
    moves++;
    soundManager.click();
    render();
    if (pos.r === size - 1 && pos.c === size - 1) await finishLevel();
  }

  async function finishLevel() {
    over = true;
    feedbackEl.textContent = `🎉 O cachorro chegou em casa em ${moves} passos!`;
    soundManager.success();
    if (userManager.currentUser) {
      await db.add('games', { usuario_id: userManager.currentUser.id, jogo: 'cachorro-casinha', pontuacao: Math.max(5, 50 - moves), data: new Date().toISOString() });
      await userManager.incGamesPlayed();
      await userManager.addStars(4);
      await achievementManager.checkAndUnlock();
    }
    setTimeout(() => { level++; newLevel(); }, 1600);
  }

  panel.querySelector('#dm-dpad').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (btn) move(btn.dataset.d);
  });

  const keyHandler = (e) => {
    if (!isPanelActiveWindow(panel)) return;
    const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
    if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
  };
  document.addEventListener('keydown', keyHandler);
  panel._cleanup = () => document.removeEventListener('keydown', keyHandler);

  newLevel();
}
