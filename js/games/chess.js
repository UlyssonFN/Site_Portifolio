/* ==========================================================================
   Anne OS Kids — games/chess.js
  ♟️ Xadrez — regras completas (sem roque/en passant)
   ========================================================================== */

const CHESS_SYMBOLS = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
};

function chessInitialBoard() {
  return [
    ['r','n','b','q','k','b','n','r'],
    ['p','p','p','p','p','p','p','p'],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    ['P','P','P','P','P','P','P','P'],
    ['R','N','B','Q','K','B','N','R']
  ];
}

function chessColorOf(p) { return p ? (p === p.toUpperCase() ? 'w' : 'b') : null; }
function chessInBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

function chessPseudoMoves(board, r, c) {
  const piece = board[r][c];
  if (!piece) return [];
  const color = chessColorOf(piece);
  const type = piece.toUpperCase();
  const moves = [];
  const addSliding = (dirs) => {
    dirs.forEach(([dr, dc]) => {
      let nr = r + dr, nc = c + dc;
      while (chessInBounds(nr, nc)) {
        if (!board[nr][nc]) { moves.push({ r: nr, c: nc }); }
        else { if (chessColorOf(board[nr][nc]) !== color && board[nr][nc].toUpperCase() !== 'K') moves.push({ r: nr, c: nc }); break; }
        nr += dr; nc += dc;
      }
    });
  };
  if (type === 'P') {
    const dir = color === 'w' ? -1 : 1;
    const startRow = color === 'w' ? 6 : 1;
    if (chessInBounds(r + dir, c) && !board[r + dir][c]) {
      moves.push({ r: r + dir, c });
      if (r === startRow && !board[r + dir * 2][c]) moves.push({ r: r + dir * 2, c });
    }
    [[dir, -1], [dir, 1]].forEach(([dr, dc]) => {
      const nr = r + dr, nc = c + dc;
      if (chessInBounds(nr, nc) && board[nr][nc] && chessColorOf(board[nr][nc]) !== color && board[nr][nc].toUpperCase() !== 'K') moves.push({ r: nr, c: nc });
    });
  } else if (type === 'N') {
    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr, dc]) => {
      const nr = r + dr, nc = c + dc;
      if (chessInBounds(nr, nc) && (!board[nr][nc] || (chessColorOf(board[nr][nc]) !== color && board[nr][nc].toUpperCase() !== 'K'))) moves.push({ r: nr, c: nc });
    });
  } else if (type === 'B') {
    addSliding([[-1,-1],[-1,1],[1,-1],[1,1]]);
  } else if (type === 'R') {
    addSliding([[-1,0],[1,0],[0,-1],[0,1]]);
  } else if (type === 'Q') {
    addSliding([[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]);
  } else if (type === 'K') {
    [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr, dc]) => {
      const nr = r + dr, nc = c + dc;
      if (chessInBounds(nr, nc) && (!board[nr][nc] || (chessColorOf(board[nr][nc]) !== color && board[nr][nc].toUpperCase() !== 'K'))) moves.push({ r: nr, c: nc });
    });
  }
  return moves;
}

function chessIsAttacked(board, r, c, byColor) {
  // Cavalo
  const knightOffsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  for (const [dr, dc] of knightOffsets) {
    const nr = r + dr, nc = c + dc;
    if (chessInBounds(nr, nc) && board[nr][nc] && board[nr][nc].toUpperCase() === 'N' && chessColorOf(board[nr][nc]) === byColor) return true;
  }
  // Rei adjacente
  for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
    const nr = r + dr, nc = c + dc;
    if (chessInBounds(nr, nc) && board[nr][nc] && board[nr][nc].toUpperCase() === 'K' && chessColorOf(board[nr][nc]) === byColor) return true;
  }
  // Peão
  const pawnDir = byColor === 'w' ? 1 : -1;
  for (const dc of [-1, 1]) {
    const nr = r + pawnDir, nc = c + dc;
    if (chessInBounds(nr, nc) && board[nr][nc] && board[nr][nc].toUpperCase() === 'P' && chessColorOf(board[nr][nc]) === byColor) return true;
  }
  // Linhas retas (torre/rainha)
  for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    let nr = r + dr, nc = c + dc;
    while (chessInBounds(nr, nc)) {
      if (board[nr][nc]) {
        const t = board[nr][nc].toUpperCase();
        if (chessColorOf(board[nr][nc]) === byColor && (t === 'R' || t === 'Q')) return true;
        break;
      }
      nr += dr; nc += dc;
    }
  }
  // Diagonais (bispo/rainha)
  for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
    let nr = r + dr, nc = c + dc;
    while (chessInBounds(nr, nc)) {
      if (board[nr][nc]) {
        const t = board[nr][nc].toUpperCase();
        if (chessColorOf(board[nr][nc]) === byColor && (t === 'B' || t === 'Q')) return true;
        break;
      }
      nr += dr; nc += dc;
    }
  }
  return false;
}

function chessFindKing(board, color) {
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (board[r][c] && board[r][c].toUpperCase() === 'K' && chessColorOf(board[r][c]) === color) return { r, c };
  }
  return null;
}

function chessLegalMoves(board, r, c) {
  const piece = board[r][c];
  if (!piece) return [];
  const color = chessColorOf(piece);
  const pseudo = chessPseudoMoves(board, r, c);
  return pseudo.filter(m => {
    const copy = board.map(row => [...row]);
    copy[m.r][m.c] = copy[r][c];
    copy[r][c] = null;
    const kingPos = chessFindKing(copy, color);
    if (!kingPos) return false;
    return !chessIsAttacked(copy, kingPos.r, kingPos.c, color === 'w' ? 'b' : 'w');
  });
}

function chessAllLegalMoves(board, color) {
  const list = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (board[r][c] && chessColorOf(board[r][c]) === color) {
      chessLegalMoves(board, r, c).forEach(m => list.push({ from: { r, c }, to: m }));
    }
  }
  return list;
}

function openChessGame() {
  const panel = document.createElement('div');
  panel.className = 'app-panel';
  panel.innerHTML = `
    <h2 style="text-align:center;">♟️ Xadrez</h2>
    <p style="text-align:center;color:#888;font-size:.82rem;">Sem roque ou en passant.</p>
    <div style="display:flex;justify-content:center;gap:.4rem;margin:.5rem 0;">
      <button class="music-btn" id="chs-cpu">🤖 Vs computador</button>
      <button class="music-btn" id="chs-two">👥 2 jogadores</button>
    </div>
    <div class="game-header"><span id="chs-turn">Vez das Brancas ♔</span><span class="gh-score" id="chs-status"></span></div>
    <div class="board-grid chs-grid" id="chs-grid"></div>
    <div class="quiz-feedback" id="chs-feedback" style="text-align:center;"></div>
    <div style="text-align:center;margin-top:.6rem;"><button class="music-btn" id="chs-restart">🔁 Novo jogo</button></div>
  `;
  setTimeout(() => initChess(panel), 0);
  return panel;
}

function initChess(panel) {
  let board = chessInitialBoard();
  let turn = 'w';
  let selected = null;
  let legalTargets = [];
  let over = false;
  let mode = 'cpu';
  let cpuTimer = null;

  const grid = panel.querySelector('#chs-grid');
  const turnEl = panel.querySelector('#chs-turn');
  const statusEl = panel.querySelector('#chs-status');
  const feedbackEl = panel.querySelector('#chs-feedback');

  function render() {
    grid.innerHTML = '';
    const targetKeys = legalTargets.map(t => t.r + ',' + t.c);
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = document.createElement('div');
        cell.className = 'board-cell chs-cell ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
        const piece = board[r][c];
        if (piece) {
          const span = document.createElement('span');
          span.className = 'chs-piece ' + (chessColorOf(piece) === 'w' ? 'chs-white' : 'chs-black');
          span.textContent = CHESS_SYMBOLS[piece];
          cell.appendChild(span);
        }
        if (selected && selected.r === r && selected.c === c) cell.classList.add('selected-cell');
        if (targetKeys.includes(r + ',' + c)) cell.classList.add('legal-target');
        cell.addEventListener('click', () => handleClick(r, c));
        grid.appendChild(cell);
      }
    }
    turnEl.textContent = over ? '' : `Vez das ${turn === 'w' ? 'Brancas ♔' : 'Pretas ♚'}`;
    const kingPos = chessFindKing(board, turn);
    if (!over && kingPos && chessIsAttacked(board, kingPos.r, kingPos.c, turn === 'w' ? 'b' : 'w')) {
      statusEl.textContent = '⚠️ Xeque!';
    } else statusEl.textContent = '';
  }

  function handleClick(r, c) {
    if (over || (mode === 'cpu' && turn === 'b')) return;
    const piece = board[r][c];
    if (piece && chessColorOf(piece) === turn) {
      selected = { r, c };
      legalTargets = chessLegalMoves(board, r, c);
      soundManager.click();
      render();
      return;
    }
    if (selected) {
      const target = legalTargets.find(t => t.r === r && t.c === c);
      if (target) { applyMove(selected, target); return; }
    }
    selected = null; legalTargets = [];
    render();
  }

  async function applyMove(from, to) {
    const piece = board[from.r][from.c];
    const captured = board[to.r][to.c];
    board[to.r][to.c] = piece;
    board[from.r][from.c] = null;
    if (piece.toUpperCase() === 'P' && (to.r === 0 || to.r === 7)) {
      board[to.r][to.c] = chessColorOf(piece) === 'w' ? 'Q' : 'q';
    }
    soundManager[captured ? 'success' : 'click']();
    selected = null; legalTargets = [];
    turn = turn === 'w' ? 'b' : 'w';
    render();
    await checkGameOver();
    if (!over && mode === 'cpu' && turn === 'b') scheduleCpuTurn();
  }

  function scheduleCpuTurn() {
    clearTimeout(cpuTimer);
    cpuTimer = setTimeout(cpuTurn, 450);
  }

  async function cpuTurn() {
    cpuTimer = null;
    if (over || mode !== 'cpu' || turn !== 'b') return;
    const moves = chessAllLegalMoves(board, 'b');
    if (!moves.length) return;
    const values = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 };
    const scoredMoves = moves.map(move => {
      const captured = board[move.to.r][move.to.c];
      const copy = board.map(row => [...row]);
      copy[move.to.r][move.to.c] = copy[move.from.r][move.from.c];
      copy[move.from.r][move.from.c] = null;
      const king = chessFindKing(copy, 'w');
      const givesCheck = king && chessIsAttacked(copy, king.r, king.c, 'b');
      const centerBonus = 4 - Math.abs(3.5 - move.to.r) - Math.abs(3.5 - move.to.c);
      const score = (captured ? values[captured.toUpperCase()] : 0) + (givesCheck ? 45 : 0) + centerBonus;
      return { move, score };
    });
    const bestScore = Math.max(...scoredMoves.map(item => item.score));
    const bestMoves = scoredMoves.filter(item => item.score === bestScore);
    const choice = bestMoves[Math.floor(Math.random() * bestMoves.length)].move;
    await applyMove(choice.from, choice.to);
  }

  async function checkGameOver() {
    const moves = chessAllLegalMoves(board, turn);
    if (!moves.length) {
      over = true;
      const kingPos = chessFindKing(board, turn);
      const inCheck = kingPos && chessIsAttacked(board, kingPos.r, kingPos.c, turn === 'w' ? 'b' : 'w');
      if (inCheck) {
        const winner = turn === 'w' ? 'Pretas ♚' : 'Brancas ♔';
        feedbackEl.textContent = `🏁 Xeque-mate! As ${winner} venceram!`;
      } else {
        feedbackEl.textContent = '🤝 Empate por afogamento (sem jogadas possíveis).';
      }
      soundManager.success();
      if (userManager.currentUser) {
        await db.add('games', { usuario_id: userManager.currentUser.id, jogo: 'xadrez', pontuacao: 15, data: new Date().toISOString() });
        await userManager.incGamesPlayed();
        await userManager.addStars(8);
        await achievementManager.checkAndUnlock();
      }
      render();
    }
  }

  function reset() {
    clearTimeout(cpuTimer);
    cpuTimer = null;
    board = chessInitialBoard();
    turn = 'w'; selected = null; legalTargets = []; over = false;
    feedbackEl.textContent = '';
    render();
  }

  panel.querySelector('#chs-cpu').addEventListener('click', () => {
    soundManager.click();
    mode = 'cpu';
    reset();
  });
  panel.querySelector('#chs-two').addEventListener('click', () => {
    soundManager.click();
    mode = 'two';
    reset();
  });
  panel.querySelector('#chs-restart').addEventListener('click', () => { soundManager.click(); reset(); });
  render();
}
