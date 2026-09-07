/* ==========================================================================
   Anne OS Kids — games/ticTacToe.js
   ❌ Jogo da Velha (Tic-Tac-Toe) — contra o computador ou 2 jogadores
   ========================================================================== */

function openTicTacToeGame() {
  const panel = document.createElement('div');
  panel.className = 'app-panel';
  panel.innerHTML = `
    <h2 style="text-align:center;">❌⭕ Jogo da Velha</h2>
    <div style="text-align:center;margin-bottom:.6rem;">
      <button class="theme-choice ttt-mode selected" data-m="cpu">🤖 Contra o computador</button>
      <button class="theme-choice ttt-mode" data-m="2p">👫 2 jogadores</button>
    </div>
    <div class="game-header"><span id="ttt-turn">Vez de ❌</span><span class="gh-score" id="ttt-score">❌ 0 · ⭕ 0 · 🤝 0</span></div>
    <div class="board-grid ttt-grid" id="ttt-grid"></div>
    <div class="quiz-feedback" id="ttt-feedback" style="text-align:center;"></div>
    <div style="text-align:center;margin-top:.6rem;"><button class="music-btn" id="ttt-restart">🔁 Novo jogo</button></div>
  `;
  setTimeout(() => initTicTacToe(panel), 0);
  return panel;
}

function ticTacToeWinner(b) {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a, c, d] of lines) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  }
  return b.every(x => x) ? 'empate' : null;
}

function ticTacToeMinimax(board, player) {
  const winner = ticTacToeWinner(board);
  if (winner === 'X') return { score: -10 };
  if (winner === 'O') return { score: 10 };
  if (winner === 'empate') return { score: 0 };

  const moves = [];
  board.forEach((v, i) => {
    if (!v) {
      const copy = [...board];
      copy[i] = player;
      const result = ticTacToeMinimax(copy, player === 'O' ? 'X' : 'O');
      moves.push({ index: i, score: result.score });
    }
  });

  if (player === 'O') {
    return moves.reduce((best, m) => (m.score > best.score ? m : best), { score: -Infinity });
  }
  return moves.reduce((best, m) => (m.score < best.score ? m : best), { score: Infinity });
}

function initTicTacToe(panel) {
  let board = Array(9).fill(null);
  let turn = 'X';
  let mode = 'cpu';
  let over = false;
  let wins = { X: 0, O: 0, empate: 0 };

  const grid = panel.querySelector('#ttt-grid');
  const turnEl = panel.querySelector('#ttt-turn');
  const scoreEl = panel.querySelector('#ttt-score');
  const feedbackEl = panel.querySelector('#ttt-feedback');

  panel.querySelectorAll('.ttt-mode').forEach(b => b.addEventListener('click', () => {
    panel.querySelectorAll('.ttt-mode').forEach(x => x.classList.remove('selected'));
    b.classList.add('selected');
    mode = b.dataset.m;
    soundManager.click();
    reset();
  }));

  function render() {
    grid.innerHTML = '';
    board.forEach((v, i) => {
      const cell = document.createElement('div');
      cell.className = 'board-cell ttt-cell';
      cell.textContent = v === 'X' ? '❌' : v === 'O' ? '⭕' : '';
      cell.addEventListener('click', () => handleMove(i));
      grid.appendChild(cell);
    });
    turnEl.textContent = over ? '' : `Vez de ${turn === 'X' ? '❌' : '⭕'}`;
  }

  async function handleMove(i) {
    if (over || board[i] || (mode === 'cpu' && turn === 'O')) return;
    board[i] = turn;
    soundManager.click();
    render();
    const result = ticTacToeWinner(board);
    if (result) { await finish(result); return; }
    turn = turn === 'X' ? 'O' : 'X';
    render();
    if (mode === 'cpu' && turn === 'O' && !over) {
      setTimeout(cpuMove, 500);
    }
  }

  function cpuMove() {
    if (over) return;
    const best = ticTacToeMinimax(board, 'O');
    if (best && best.index !== undefined) {
      board[best.index] = 'O';
      soundManager.click();
    }
    render();
    const result = ticTacToeWinner(board);
    if (result) { finish(result); return; }
    turn = 'X';
    render();
  }

  async function finish(result) {
    over = true;
    if (result === 'empate') {
      wins.empate++;
      feedbackEl.textContent = '🤝 Empate!';
    } else {
      wins[result]++;
      feedbackEl.textContent = result === 'X' ? '🎉 ❌ venceu!' : (mode === 'cpu' ? '🤖 O computador venceu! Tente de novo.' : '🎉 ⭕ venceu!');
      soundManager[result === 'X' || mode === '2p' ? 'success' : 'error']();
    }
    scoreEl.textContent = `❌ ${wins.X} · ⭕ ${wins.O} · 🤝 ${wins.empate}`;
    if (userManager.currentUser && (result === 'X' || mode === '2p')) {
      await userManager.addStars(3);
    }
    if (userManager.currentUser) {
      await db.add('games', { usuario_id: userManager.currentUser.id, jogo: 'jogo-da-velha', pontuacao: result === 'X' ? 10 : result === 'O' ? 0 : 5, data: new Date().toISOString() });
      await userManager.incGamesPlayed();
      await achievementManager.checkAndUnlock();
    }
  }

  function reset() {
    board = Array(9).fill(null);
    turn = 'X';
    over = false;
    feedbackEl.textContent = '';
    render();
  }

  panel.querySelector('#ttt-restart').addEventListener('click', () => { soundManager.click(); reset(); });
  render();
}
