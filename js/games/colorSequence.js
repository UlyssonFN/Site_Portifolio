/* ==========================================================================
   Anne OS Kids — games/colorSequence.js
   🎨 Sequência de Cores — jogo de memória tipo "Simon" com cores
   ========================================================================== */

const SIMON_COLORS = [
  { id: 'red', label: '🟥', bg: '#ff6f6f', freq: 261.63 },
  { id: 'blue', label: '🟦', bg: '#4fc3f7', freq: 329.63 },
  { id: 'green', label: '🟩', bg: '#6fdc8c', freq: 392.0 },
  { id: 'yellow', label: '🟨', bg: '#ffd166', freq: 493.88 }
];

function openColorSequenceGame() {
  const panel = document.createElement('div');
  panel.className = 'app-panel';
  panel.style.position = 'relative';
  panel.innerHTML = `
    <div class="quiz-score" id="cs-score">⭐ 0</div>
    <h2 style="text-align:center;">🎨 Sequência de Cores</h2>
    <p style="text-align:center;color:#888;font-size:.85rem;" id="cs-status">Observe e repita a sequência!</p>
    <div class="simon-grid" id="simon-grid"></div>
    <div style="text-align:center;margin-top:.7rem;"><button class="music-btn" id="cs-start">▶️ Começar</button></div>
  `;
  setTimeout(() => initColorSequence(panel), 0);
  return panel;
}

function initColorSequence(panel) {
  const grid = panel.querySelector('#simon-grid');
  const statusEl = panel.querySelector('#cs-status');
  const scoreEl = panel.querySelector('#cs-score');
  const startBtn = panel.querySelector('#cs-start');
  let sequence = [], userIndex = 0, score = 0, accepting = false;

  SIMON_COLORS.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'simon-btn';
    btn.dataset.id = c.id;
    btn.style.background = c.bg;
    btn.addEventListener('click', () => handlePress(c));
    grid.appendChild(btn);
  });

  function flash(color, duration = 400) {
    return new Promise(resolve => {
      const btn = grid.querySelector(`[data-id="${color.id}"]`);
      btn.classList.add('lit');
      soundManager.tone(color.freq, duration / 1000, 'sine', 0.5);
      setTimeout(() => { btn.classList.remove('lit'); resolve(); }, duration);
    });
  }

  async function playSequence() {
    accepting = false;
    statusEl.textContent = '👀 Observe...';
    for (const colorId of sequence) {
      const color = SIMON_COLORS.find(c => c.id === colorId);
      await flash(color);
      await new Promise(r => setTimeout(r, 180));
    }
    userIndex = 0;
    accepting = true;
    statusEl.textContent = '🖱️ Sua vez! Repita a sequência.';
  }

  function nextLevel() {
    sequence.push(SIMON_COLORS[Math.floor(Math.random() * SIMON_COLORS.length)].id);
    setTimeout(playSequence, 600);
  }

  async function handlePress(color) {
    if (!accepting) return;
    const btn = grid.querySelector(`[data-id="${color.id}"]`);
    btn.classList.add('lit');
    soundManager.tone(color.freq, 0.25, 'sine', 0.5);
    setTimeout(() => btn.classList.remove('lit'), 220);

    if (color.id === sequence[userIndex]) {
      userIndex++;
      if (userIndex === sequence.length) {
        score += sequence.length * 2;
        scoreEl.textContent = '⭐ ' + score;
        accepting = false;
        statusEl.textContent = `🎉 Nível ${sequence.length} completo!`;
        await userManager.addStars(1);
        nextLevel();
      }
    } else {
      accepting = false;
      soundManager.error();
      await finish();
    }
  }

  async function finish() {
    statusEl.textContent = `🏁 Fim de jogo! Você chegou ao nível ${sequence.length}.`;
    startBtn.textContent = '🔁 Jogar novamente';
    startBtn.style.display = 'block';
    if (userManager.currentUser) {
      const best = await userManager.getBestScore('sequencia-cores');
      await db.add('games', { usuario_id: userManager.currentUser.id, jogo: 'sequencia-cores', pontuacao: score, data: new Date().toISOString() });
      await userManager.incGamesPlayed();
      await userManager.addScore(score);
      if (score > best) { notificationManager.record(); await userManager.addStars(10); }
      await achievementManager.checkAndUnlock();
    }
  }

  startBtn.addEventListener('click', () => {
    soundManager.click();
    sequence = []; userIndex = 0; score = 0;
    scoreEl.textContent = '⭐ 0';
    startBtn.style.display = 'none';
    nextLevel();
  });
}
