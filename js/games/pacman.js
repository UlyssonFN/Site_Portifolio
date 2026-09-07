/* ==========================================================================
   Anne OS Kids — games/pacman.js
   👻 Come-Come (Pac-Man simplificado) — labirinto com fantasmas
   Reutiliza o gerador de labirinto de dogMaze.js
   ========================================================================== */

function openPacmanGame() {
  const panel = document.createElement('div');
  panel.className = 'app-panel';
  panel.innerHTML = `
    <h2 style="text-align:center;">👻 Come-Come</h2>
    <div class="game-header"><span id="pac-lives">❤️❤️❤️</span><span class="gh-score" id="pac-score">Pontos: 0</span></div>
    <div class="maze-wrap"><div class="maze-grid pac-grid" id="pac-grid"></div></div>
    <div class="dpad" id="pac-dpad">
      <button data-d="up">⬆️</button>
      <div><button data-d="left">⬅️</button><button data-d="down">⬇️</button><button data-d="right">➡️</button></div>
    </div>
    <div class="quiz-feedback" id="pac-feedback" style="text-align:center;"></div>
  `;
  setTimeout(() => initPacman(panel), 0);
  return panel;
}

function initPacman(panel) {
  const size = 8;
  let cells, pos, dir, ghosts, ghostDirs, dots, score, lives, over, tickTimer;

  const grid = panel.querySelector('#pac-grid');
  const scoreEl = panel.querySelector('#pac-score');
  const livesEl = panel.querySelector('#pac-lives');
  const feedbackEl = panel.querySelector('#pac-feedback');

  function neighborsOf(r, c) {
    const cell = cells[r][c];
    const list = [];
    if (!cell.top && r > 0) list.push({ r: r - 1, c, d: 'up' });
    if (!cell.bottom && r < size - 1) list.push({ r: r + 1, c, d: 'down' });
    if (!cell.left && c > 0) list.push({ r, c: c - 1, d: 'left' });
    if (!cell.right && c < size - 1) list.push({ r, c: c + 1, d: 'right' });
    return list;
  }

  function setupLevel() {
    cells = dogMazeGenerate(size, size);
    pos = { r: 0, c: 0 };
    dir = null;
    ghosts = [{ r: size - 1, c: size - 1 }, { r: 0, c: size - 1 }];
    ghostDirs = [null, null];
    dots = new Set();
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
      if (!(r === 0 && c === 0)) dots.add(r + ',' + c);
    }
    score = 0; lives = 3; over = false;
    feedbackEl.textContent = '';
    render();
  }

  function render() {
    grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    grid.innerHTML = '';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = cells[r][c];
        const div = document.createElement('div');
        div.className = 'maze-cell pac-cell';
        if (cell.top) div.style.borderTop = '3px solid #2b2350';
        if (cell.right) div.style.borderRight = '3px solid #2b2350';
        if (cell.bottom) div.style.borderBottom = '3px solid #2b2350';
        if (cell.left) div.style.borderLeft = '3px solid #2b2350';
        const isGhost = ghosts.some(g => g.r === r && g.c === c);
        if (r === pos.r && c === pos.c) div.textContent = '🟡';
        else if (isGhost) div.textContent = '👻';
        else if (dots.has(r + ',' + c)) div.innerHTML = '<span class="pac-dot">•</span>';
        grid.appendChild(div);
      }
    }
    scoreEl.textContent = 'Pontos: ' + score;
    livesEl.textContent = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives);
  }

  function tryMove(direction) {
    const options = neighborsOf(pos.r, pos.c);
    const target = options.find(o => o.d === direction);
    if (!target) return false;
    pos = { r: target.r, c: target.c };
    return true;
  }

  async function tick() {
    if (over) return;
    if (dir) tryMove(dir);

    if (dots.has(pos.r + ',' + pos.c)) { dots.delete(pos.r + ',' + pos.c); score += 10; soundManager.tone(700, 0.06, 'square', 0.25); }

    ghosts = ghosts.map((g, i) => {
      const options = neighborsOf(g.r, g.c);
      if (!options.length) return g;
      const reverseOf = { up: 'down', down: 'up', left: 'right', right: 'left' };
      let choices = options;
      if (options.length > 1 && ghostDirs[i]) {
        const filtered = options.filter(o => o.d !== reverseOf[ghostDirs[i]]);
        if (filtered.length) choices = filtered;
      }
      const pick = choices[Math.floor(Math.random() * choices.length)];
      ghostDirs[i] = pick.d;
      return { r: pick.r, c: pick.c };
    });

    render();

    if (ghosts.some(g => g.r === pos.r && g.c === pos.c)) {
      await handleCaught();
    } else if (dots.size === 0) {
      await handleWin();
    }
  }

  async function handleCaught() {
    lives--;
    soundManager.error();
    if (lives <= 0) { await finish(false); return; }
    feedbackEl.textContent = '👻 Um fantasma te pegou!';
    pos = { r: 0, c: 0 }; dir = null;
    ghosts = [{ r: size - 1, c: size - 1 }, { r: 0, c: size - 1 }];
    render();
  }

  async function handleWin() {
    await finish(true);
  }

  async function finish(won) {
    over = true;
    clearInterval(tickTimer);
    feedbackEl.textContent = won ? `🏆 Você comeu todos os pontinhos! Pontuação: ${score}` : `🏁 Fim de jogo! Pontuação: ${score}`;
    soundManager[won ? 'success' : 'error']();
    if (userManager.currentUser) {
      await db.add('games', { usuario_id: userManager.currentUser.id, jogo: 'come-come', pontuacao: score, data: new Date().toISOString() });
      await userManager.incGamesPlayed();
      if (won) await userManager.addStars(8); else await userManager.addStars(1);
      await achievementManager.checkAndUnlock();
    }
  }

  panel.querySelector('#pac-dpad').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (btn) { dir = btn.dataset.d; soundManager.hover(); }
  });

  const keyHandler = (e) => {
    if (!isPanelActiveWindow(panel)) return;
    const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
    if (map[e.key]) { e.preventDefault(); dir = map[e.key]; }
  };
  document.addEventListener('keydown', keyHandler);
  panel._cleanup = () => { document.removeEventListener('keydown', keyHandler); clearInterval(tickTimer); };

  setupLevel();
  tickTimer = setInterval(tick, 380);
}
