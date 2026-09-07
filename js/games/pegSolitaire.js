/* ==========================================================================
   Anne OS Kids — games/pegSolitaire.js
   🕳️ Resta Um (Peg Solitaire) — tabuleiro em cruz, 33 casas
   ========================================================================== */

function pegSolitaireInitialBoard() {
  // null = fora do tabuleiro, 0 = buraco vazio, 1 = pino
  const board = Array.from({ length: 7 }, () => Array(7).fill(null));
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const outCorner = (r < 2 || r > 4) && (c < 2 || c > 4);
      if (!outCorner) board[r][c] = 1;
    }
  }
  board[3][3] = 0; // buraco central inicial
  return board;
}

function openPegSolitaireGame() {
  const panel = document.createElement('div');
  panel.className = 'app-panel';
  panel.innerHTML = `
    <h2 style="text-align:center;">🕳️ Resta Um</h2>
    <p style="text-align:center;color:#888;font-size:.82rem;">Pule um pino sobre outro para uma casa vazia. O pino do meio é removido. Tente deixar só 1!</p>
    <div class="game-header"><span id="peg-count">Pinos: 32</span><span class="gh-score" id="peg-moves">Jogadas: 0</span></div>
    <div class="board-grid peg-grid" id="peg-grid"></div>
    <div class="quiz-feedback" id="peg-feedback" style="text-align:center;"></div>
    <div style="text-align:center;margin-top:.6rem;"><button class="music-btn" id="peg-restart">🔁 Novo jogo</button></div>
  `;
  setTimeout(() => initPegSolitaire(panel), 0);
  return panel;
}

function initPegSolitaire(panel) {
  let board = pegSolitaireInitialBoard();
  let selected = null;
  let moves = 0;
  let over = false;

  const grid = panel.querySelector('#peg-grid');
  const countEl = panel.querySelector('#peg-count');
  const movesEl = panel.querySelector('#peg-moves');
  const feedbackEl = panel.querySelector('#peg-feedback');

  function pegCount() {
    let n = 0;
    board.forEach(row => row.forEach(v => { if (v === 1) n++; }));
    return n;
  }

  function legalJumpsFrom(r, c) {
    if (board[r][c] !== 1) return [];
    const jumps = [];
    [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr, dc]) => {
      const mr = r + dr, mc = c + dc, tr = r + dr * 2, tc = c + dc * 2;
      if (tr >= 0 && tr < 7 && tc >= 0 && tc < 7 && board[mr] && board[mr][mc] === 1 && board[tr] && board[tr][tc] === 0) {
        jumps.push({ r: tr, c: tc, midR: mr, midC: mc });
      }
    });
    return jumps;
  }

  function anyMovesLeft() {
    for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
      if (board[r][c] === 1 && legalJumpsFrom(r, c).length) return true;
    }
    return false;
  }

  function render() {
    grid.innerHTML = '';
    const targets = selected ? legalJumpsFrom(selected.r, selected.c) : [];
    const targetKeys = targets.map(t => t.r + ',' + t.c);
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const cell = document.createElement('div');
        const v = board[r][c];
        if (v === null) { cell.className = 'board-cell peg-cell peg-void'; grid.appendChild(cell); continue; }
        cell.className = 'board-cell peg-cell ' + (v === 1 ? 'peg-filled' : 'peg-empty');
        cell.textContent = v === 1 ? '🔵' : '';
        if (selected && selected.r === r && selected.c === c) cell.classList.add('selected-cell');
        if (targetKeys.includes(r + ',' + c)) cell.classList.add('legal-target');
        cell.addEventListener('click', () => handleClick(r, c));
        grid.appendChild(cell);
      }
    }
    countEl.textContent = 'Pinos: ' + pegCount();
    movesEl.textContent = 'Jogadas: ' + moves;
  }

  function handleClick(r, c) {
    if (over) return;
    if (board[r][c] === 1) {
      selected = { r, c };
      soundManager.click();
      render();
      return;
    }
    if (board[r][c] === 0 && selected) {
      const jump = legalJumpsFrom(selected.r, selected.c).find(j => j.r === r && j.c === c);
      if (jump) {
        board[selected.r][selected.c] = 0;
        board[jump.midR][jump.midC] = 0;
        board[r][c] = 1;
        moves++;
        soundManager.success();
        selected = null;
        render();
        checkFinish();
        return;
      }
    }
    selected = null;
    render();
  }

  async function checkFinish() {
    const remaining = pegCount();
    if (remaining === 1) {
      over = true;
      feedbackEl.textContent = '🏆 Perfeito! Você resolveu o Resta Um com só 1 pino!';
      soundManager.success();
      if (userManager.currentUser) {
        await db.add('games', { usuario_id: userManager.currentUser.id, jogo: 'resta-um', pontuacao: 50, data: new Date().toISOString() });
        await userManager.incGamesPlayed();
        await userManager.addStars(10);
        await achievementManager.checkAndUnlock();
      }
    } else if (!anyMovesLeft()) {
      over = true;
      feedbackEl.textContent = `🏁 Fim de jogo! Restaram ${remaining} pinos.`;
      if (userManager.currentUser) {
        await db.add('games', { usuario_id: userManager.currentUser.id, jogo: 'resta-um', pontuacao: Math.max(0, 33 - remaining), data: new Date().toISOString() });
        await userManager.incGamesPlayed();
        await userManager.addStars(2);
        await achievementManager.checkAndUnlock();
      }
    }
  }

  function reset() {
    board = pegSolitaireInitialBoard();
    selected = null; moves = 0; over = false;
    feedbackEl.textContent = '';
    render();
  }

  panel.querySelector('#peg-restart').addEventListener('click', () => { soundManager.click(); reset(); });
  render();
}
