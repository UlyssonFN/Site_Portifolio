/* Anne OS Kids - Snake e Tetris */

function arcadeGamePanel(title, subtitle) {
  const panel = document.createElement('div');
  panel.className = 'app-panel arcade-game-panel';
  panel.innerHTML = `<h2>${title}</h2><p class="arcade-subtitle">${subtitle}</p><div class="arcade-score"></div><div class="arcade-next"></div><div class="arcade-board"></div><div class="arcade-controls"></div><div class="quiz-feedback arcade-feedback"></div><button class="music-btn arcade-restart">🔁 Novo jogo</button>`;
  return panel;
}

async function finishArcadeGame(game, score) {
  const stars = arcadeStarsForScore(score);
  if (!stars || !userManager.currentUser) return;
  await userManager.addScore(score);
  await userManager.addStars(stars);
  soundManager.starGain();
  await db.add('games', { usuario_id: userManager.currentUser.id, jogo: game, pontuacao: score, estrelas: stars, data: new Date().toISOString() });
  await achievementManager.checkAndUnlock();
}

function arcadeStarsForScore(score) { return score >= 60 ? 3 : score >= 20 ? 2 : score > 0 ? 1 : 0; }

function openSnakeGame() {
  const panel = arcadeGamePanel('🐍 Snake', 'Use as setas ou WASD para comer as frutas.');
  const boardEl = panel.querySelector('.arcade-board');
  const scoreEl = panel.querySelector('.arcade-score');
  const feedbackEl = panel.querySelector('.arcade-feedback');
  const controlsEl = panel.querySelector('.arcade-controls');
  const size = 16;
  let snake, fruit, direction, nextDirection, score, timer, over, rewarded;
  const cellEls = [];

  boardEl.className += ' snake-board';
  for (let i = 0; i < size * size; i++) { const cell = document.createElement('div'); boardEl.appendChild(cell); cellEls.push(cell); }
  controlsEl.innerHTML = '<button data-dir="up">⬆️</button><div><button data-dir="left">⬅️</button><button data-dir="down">⬇️</button><button data-dir="right">➡️</button></div>';
  const vectors = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };

  function spawnFruit() {
    const free = [];
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!snake.some(part => part.x === x && part.y === y)) free.push({ x, y });
    return free[Math.floor(Math.random() * free.length)] || { x: 0, y: 0 };
  }
  function render() {
    cellEls.forEach(cell => cell.className = '');
    snake.forEach((part, index) => { cellEls[part.y * size + part.x].className = index === 0 ? 'snake-head' : 'snake-body'; });
    cellEls[fruit.y * size + fruit.x].className = 'snake-fruit';
    scoreEl.textContent = `Pontos: ${score}`;
  }
  function setDirection(name) {
    const next = vectors[name];
    if (!next || (next.x === -direction.x && next.y === -direction.y)) return;
    nextDirection = next;
  }
  function tick() {
    direction = nextDirection;
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    if (head.x < 0 || head.y < 0 || head.x >= size || head.y >= size || snake.some(part => part.x === head.x && part.y === head.y)) {
      over = true; clearInterval(timer); soundManager.error(); feedbackEl.textContent = `Fim de jogo! Você fez ${score} pontos e ganhou ${arcadeStarsForScore(score)} estrelinha(s).`; render(); finishArcadeGame('snake', score); return;
    }
    snake.unshift(head);
    if (head.x === fruit.x && head.y === fruit.y) { score += 10; soundManager.success(); fruit = spawnFruit(); } else { soundManager.tone(220, 0.035, 'square', 0.08); snake.pop(); }
    render();
  }
  function keydown(event) {
    if (!isPanelActiveWindow(panel)) return;
    const keys = { ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right' };
    const name = keys[event.key]; if (name) { event.preventDefault(); setDirection(name); }
  }
  function reset() {
    clearInterval(timer); snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }]; direction = vectors.right; nextDirection = vectors.right; score = 0; over = false; rewarded = false; feedbackEl.textContent = ''; fruit = spawnFruit(); soundManager.click(); render(); timer = setInterval(() => { if (!over) tick(); }, 170);
  }
  panel.querySelectorAll('.arcade-controls button').forEach(button => button.addEventListener('click', () => setDirection(button.dataset.dir)));
  panel.querySelector('.arcade-restart').addEventListener('click', reset);
  document.addEventListener('keydown', keydown);
  panel._cleanup = () => { clearInterval(timer); document.removeEventListener('keydown', keydown); };
  reset();
  return panel;
}

const TETROMINOES = [
  [[1, 1, 1, 1]], [[1, 1], [1, 1]], [[0, 1, 0], [1, 1, 1]], [[1, 0, 0], [1, 1, 1]], [[0, 0, 1], [1, 1, 1]], [[1, 1, 0], [0, 1, 1]], [[0, 1, 1], [1, 1, 0]]
];

function openTetrisGame() {
  const panel = arcadeGamePanel('🧱 Tetris', 'Mova e gire as peças para completar linhas.');
  const boardEl = panel.querySelector('.arcade-board');
  const scoreEl = panel.querySelector('.arcade-score');
  const nextEl = panel.querySelector('.arcade-next');
  const feedbackEl = panel.querySelector('.arcade-feedback');
  const controlsEl = panel.querySelector('.arcade-controls');
  const width = 10, height = 18;
  let board, piece, nextPiece, x, y, score, timer, over;
  const cellEls = [];
  boardEl.className += ' tetris-board';
  for (let i = 0; i < width * height; i++) { const cell = document.createElement('div'); boardEl.appendChild(cell); cellEls.push(cell); }
  controlsEl.innerHTML = '<button data-act="left">⬅️</button><button data-act="rotate">🔄</button><button data-act="right">➡️</button><button data-act="down">⬇️</button>';

  function randomPiece() { return TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)].map(row => [...row]); }
  function newPiece() {
    piece = nextPiece || randomPiece();
    nextPiece = randomPiece();
    x = 3; y = 0;
    if (collides(piece, x, y)) { over = true; clearInterval(timer); soundManager.error(); feedbackEl.textContent = `Fim de jogo! Pontos: ${score}. Você ganhou ${arcadeStarsForScore(score)} estrelinha(s).`; finishArcadeGame('tetris', score); }
  }
  function collides(shape, px, py) { return shape.some((row, dy) => row.some((value, dx) => value && (px + dx < 0 || px + dx >= width || py + dy >= height || (py + dy >= 0 && board[py + dy][px + dx])))); }
  function rotate(shape) { return shape[0].map((_, index) => shape.map(row => row[index]).reverse()); }
  function colorFor() { return '#8c6fff'; }
  function render() {
    cellEls.forEach(cell => { cell.className = ''; cell.style.background = ''; });
    board.forEach((row, rowIndex) => row.forEach((value, colIndex) => { if (value) { cellEls[rowIndex * width + colIndex].className = 'tetris-filled'; cellEls[rowIndex * width + colIndex].style.background = colorFor(value); } }));
    piece.forEach((row, dy) => row.forEach((value, dx) => { if (value && y + dy >= 0) { const cell = cellEls[(y + dy) * width + x + dx]; cell.className = 'tetris-filled'; cell.style.background = colorFor(value); } }));
    nextEl.innerHTML = `<span>Próxima peça</span><div class="tetris-preview" style="grid-template-columns: repeat(${nextPiece[0].length}, 16px);">${nextPiece.flat().map(value => `<i class="${value ? 'preview-filled' : ''}"></i>`).join('')}</div>`;
    scoreEl.textContent = `Pontos: ${score}`;
  }
  function lockPiece() {
    piece.forEach((row, dy) => row.forEach((value, dx) => { if (value && y + dy >= 0) board[y + dy][x + dx] = value + 1; }));
    const completeRows = board.filter(row => row.every(Boolean));
    const remaining = board.filter(row => !completeRows.includes(row));
    const cleared = completeRows.length;
    while (remaining.length < height) remaining.unshift(Array(width).fill(0));
    board = remaining; score += cleared * 10; soundManager.success(); newPiece(); render();
  }
  function drop() { if (over) return; if (!collides(piece, x, y + 1)) y++; else lockPiece(); render(); }
  function act(name) {
    if (over) return;
    if (name === 'left' && !collides(piece, x - 1, y)) { x--; soundManager.click(); }
    if (name === 'right' && !collides(piece, x + 1, y)) { x++; soundManager.click(); }
    if (name === 'down') drop();
    if (name === 'rotate') { const turned = rotate(piece); if (!collides(turned, x, y)) { piece = turned; soundManager.tone(520, 0.07, 'triangle', 0.2); } }
    render();
  }
  function keydown(event) {
    if (!isPanelActiveWindow(panel)) return;
    const keys = { ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'down', ArrowUp: 'rotate' };
    if (keys[event.key]) { event.preventDefault(); act(keys[event.key]); }
  }
  function reset() { clearInterval(timer); board = Array.from({ length: height }, () => Array(width).fill(0)); score = 0; over = false; feedbackEl.textContent = ''; nextPiece = randomPiece(); soundManager.click(); newPiece(); render(); timer = setInterval(drop, 650); }
  controlsEl.querySelectorAll('button').forEach(button => button.addEventListener('click', () => act(button.dataset.act)));
  panel.querySelector('.arcade-restart').addEventListener('click', reset); document.addEventListener('keydown', keydown); panel._cleanup = () => { clearInterval(timer); document.removeEventListener('keydown', keydown); }; reset(); return panel;
}
