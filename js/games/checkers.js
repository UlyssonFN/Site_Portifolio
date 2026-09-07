/* ==========================================================================
   Anne OS Kids — games/checkers.js
   ⚫ Dama (Checkers) — 8x8, damas, capturas, computador ou 2 jogadores
   ========================================================================== */

function openCheckersGame() {
  const panel = document.createElement('div');
  panel.className = 'app-panel';
  panel.innerHTML = `
    <h2 style="text-align:center;">⚫🔴 Dama</h2>
    <div style="text-align:center;margin-bottom:.6rem;">
      <button class="theme-choice chk-mode selected" data-m="cpu">🤖 Contra o computador</button>
      <button class="theme-choice chk-mode" data-m="2p">👫 2 jogadores</button>
    </div>
    <div class="game-header"><span id="chk-turn">Vez de 🔴</span><span class="gh-score" id="chk-score">🔴 12 · ⚫ 12</span></div>
    <div class="board-grid chk-grid" id="chk-grid"></div>
    <div class="quiz-feedback" id="chk-feedback" style="text-align:center;"></div>
    <div style="text-align:center;margin-top:.6rem;"><button class="music-btn" id="chk-restart">🔁 Novo jogo</button></div>
  `;
  setTimeout(() => initCheckers(panel), 0);
  return panel;
}

function checkersInitialBoard() {
  // 0 = vazio, 'r'/'R' = vermelho (peça/dama), 'b'/'B' = preto (peça/dama)
  const board = Array.from({ length: 8 }, () => Array(8).fill(0));
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) board[row][col] = 'b';
    }
  }
  for (let row = 5; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) board[row][col] = 'r';
    }
  }
  return board;
}

function checkersPieceOwner(p) { return p ? (p.toLowerCase() === 'r' ? 'r' : 'b') : null; }
function checkersIsKing(p) { return p === 'R' || p === 'B'; }

function checkersMovesFor(board, row, col) {
  const piece = board[row][col];
  if (!piece) return { steps: [], jumps: [] };
  const owner = checkersPieceOwner(piece);
  const king = checkersIsKing(piece);
  const dirs = king ? [[-1,-1],[-1,1],[1,-1],[1,1]] : owner === 'r' ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]];
  const steps = [], jumps = [];
  dirs.forEach(([dr, dc]) => {
    const r1 = row + dr, c1 = col + dc;
    if (r1 >= 0 && r1 < 8 && c1 >= 0 && c1 < 8) {
      if (!board[r1][c1]) steps.push({ r: r1, c: c1 });
      else if (checkersPieceOwner(board[r1][c1]) !== owner) {
        const r2 = row + dr * 2, c2 = col + dc * 2;
        if (r2 >= 0 && r2 < 8 && c2 >= 0 && c2 < 8 && !board[r2][c2]) {
          jumps.push({ r: r2, c: c2, capR: r1, capC: c1 });
        }
      }
    }
  });
  return { steps, jumps };
}

function checkersAllMoves(board, owner) {
  let anyJump = false;
  const list = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] && checkersPieceOwner(board[r][c]) === owner) {
        const { steps, jumps } = checkersMovesFor(board, r, c);
        if (jumps.length) anyJump = true;
        jumps.forEach(j => list.push({ from: { r, c }, to: { r: j.r, c: j.c }, cap: { r: j.capR, c: j.capC } }));
        steps.forEach(s => list.push({ from: { r, c }, to: s }));
      }
    }
  }
  return anyJump ? list.filter(m => m.cap) : list;
}

function initCheckers(panel) {
  let board = checkersInitialBoard();
  let turn = 'r';
  let mode = 'cpu';
  let selected = null;
  let legalForSelected = [];
  let over = false;

  const grid = panel.querySelector('#chk-grid');
  const turnEl = panel.querySelector('#chk-turn');
  const scoreEl = panel.querySelector('#chk-score');
  const feedbackEl = panel.querySelector('#chk-feedback');

  panel.querySelectorAll('.chk-mode').forEach(b => b.addEventListener('click', () => {
    panel.querySelectorAll('.chk-mode').forEach(x => x.classList.remove('selected'));
    b.classList.add('selected');
    mode = b.dataset.m;
    soundManager.click();
    reset();
  }));

  function countPieces() {
    let r = 0, b = 0;
    board.forEach(row => row.forEach(p => { if (p) { if (checkersPieceOwner(p) === 'r') r++; else b++; } }));
    return { r, b };
  }

  function render() {
    grid.innerHTML = '';
    const legalTargets = legalForSelected.map(m => m.to.r + ',' + m.to.c);
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = document.createElement('div');
        cell.className = 'board-cell chk-cell ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
        const piece = board[r][c];
        if (piece) {
          const span = document.createElement('span');
          span.className = 'chk-piece ' + (checkersPieceOwner(piece) === 'r' ? 'chk-red' : 'chk-black') + (checkersIsKing(piece) ? ' chk-king' : '');
          span.textContent = checkersPieceOwner(piece) === 'r' ? (checkersIsKing(piece) ? '🔴👑' : '🔴') : (checkersIsKing(piece) ? '⚫👑' : '⚫');
          cell.appendChild(span);
        }
        if (selected && selected.r === r && selected.c === c) cell.classList.add('selected-cell');
        if (legalTargets.includes(r + ',' + c)) cell.classList.add('legal-target');
        cell.addEventListener('click', () => handleCellClick(r, c));
        grid.appendChild(cell);
      }
    }
    const counts = countPieces();
    scoreEl.textContent = `🔴 ${counts.r} · ⚫ ${counts.b}`;
    turnEl.textContent = over ? '' : `Vez de ${turn === 'r' ? '🔴' : '⚫'}`;
  }

  function handleCellClick(r, c) {
    if (over || (mode === 'cpu' && turn === 'b')) return;
    const piece = board[r][c];
    if (piece && checkersPieceOwner(piece) === turn) {
      selected = { r, c };
      const all = checkersAllMoves(board, turn);
      legalForSelected = all.filter(m => m.from.r === r && m.from.c === c);
      soundManager.click();
      render();
      return;
    }
    if (selected) {
      const move = legalForSelected.find(m => m.to.r === r && m.to.c === c);
      if (move) { applyMove(move); return; }
    }
    selected = null; legalForSelected = [];
    render();
  }

  async function applyMove(move) {
    const piece = board[move.from.r][move.from.c];
    board[move.from.r][move.from.c] = 0;
    let newPiece = piece;
    if ((checkersPieceOwner(piece) === 'r' && move.to.r === 0) || (checkersPieceOwner(piece) === 'b' && move.to.r === 7)) {
      newPiece = checkersPieceOwner(piece) === 'r' ? 'R' : 'B';
    }
    board[move.to.r][move.to.c] = newPiece;
    if (move.cap) board[move.cap.r][move.cap.c] = 0;
    soundManager[move.cap ? 'success' : 'click']();
    selected = null; legalForSelected = [];

    if (move.cap) {
      const { jumps } = checkersMovesFor(board, move.to.r, move.to.c);
      if (jumps.length) {
        if (mode === 'cpu' && turn === 'b') {
          render();
          setTimeout(() => cpuTurn({ r: move.to.r, c: move.to.c }), 350);
        } else {
          selected = { r: move.to.r, c: move.to.c };
          legalForSelected = jumps.map(j => ({ from: selected, to: { r: j.r, c: j.c }, cap: { r: j.capR, c: j.capC } }));
          render();
        }
        return;
      }
    }

    turn = turn === 'r' ? 'b' : 'r';
    render();
    await checkGameOver();
    if (!over && mode === 'cpu' && turn === 'b') setTimeout(cpuTurn, 600);
  }

  function cpuTurn(forcedFrom = null) {
    if (over) return;
    const moves = forcedFrom
      ? checkersMovesFor(board, forcedFrom.r, forcedFrom.c).jumps.map(j => ({
        from: forcedFrom,
        to: { r: j.r, c: j.c },
        cap: { r: j.capR, c: j.capC }
      }))
      : checkersAllMoves(board, 'b');
    if (!moves.length) return;
    const captures = moves.filter(m => m.cap);
    const pick = (captures.length ? captures : moves)[Math.floor(Math.random() * (captures.length ? captures.length : moves.length))];
    applyMove(pick);
  }

  async function checkGameOver() {
    const moves = checkersAllMoves(board, turn);
    const counts = countPieces();
    if (!moves.length || counts.r === 0 || counts.b === 0) {
      over = true;
      const winner = counts.r === 0 ? 'b' : counts.b === 0 ? 'r' : (turn === 'r' ? 'b' : 'r');
      feedbackEl.textContent = winner === 'r' ? '🎉 🔴 venceu a partida!' : (mode === 'cpu' ? '🤖 O computador venceu! Tente de novo.' : '🎉 ⚫ venceu a partida!');
      if (userManager.currentUser) {
        const won = winner === 'r' || mode === '2p';
        if (won) await userManager.addStars(8);
        await db.add('games', { usuario_id: userManager.currentUser.id, jogo: 'dama', pontuacao: won ? 20 : 0, data: new Date().toISOString() });
        await userManager.incGamesPlayed();
        await achievementManager.checkAndUnlock();
      }
      render();
    }
  }

  function reset() {
    board = checkersInitialBoard();
    turn = 'r'; selected = null; legalForSelected = []; over = false;
    feedbackEl.textContent = '';
    render();
  }

  panel.querySelector('#chk-restart').addEventListener('click', () => { soundManager.click(); reset(); });
  render();
}
