/* ==========================================================================
   Anne OS Kids — typingGame.js
   Chuva de Palavras: digite a palavra inteira antes que ela caia!
   ========================================================================== */

const TYPING_WORDS = [
  'gato', 'casa', 'bola', 'sol', 'lua', 'flor', 'pato', 'peixe', 'livro',
  'arvore', 'nuvem', 'carro', 'porta', 'janela', 'estrela', 'coelho', 'sapo',
  'urso', 'vaca', 'doce', 'balão', 'chuva', 'praia', 'noite', 'amigo'
];

function openTypingApp() {
  const panel = document.createElement('div');
  panel.className = 'app-panel typ-panel';
  panel.innerHTML = `
    <h2>⌨️ Chuva de Palavras</h2>
    <div class="typ-stats">
      <span id="typ-score">Pontos: 0</span>
      <span id="typ-lives">❤️❤️❤️</span>
      <button id="typ-start" class="btn-primary">▶️ Começar</button>
    </div>
    <div id="typ-field" class="typ-field"></div>
    <div class="typ-input-display" id="typ-input-display">&nbsp;</div>
    <p id="typ-gameover" class="typ-gameover" style="display:none;"></p>
  `;
  setTimeout(() => initTypingApp(panel), 0);
  return panel;
}

function initTypingApp(panel) {
  const field = panel.querySelector('#typ-field');
  const scoreEl = panel.querySelector('#typ-score');
  const livesEl = panel.querySelector('#typ-lives');
  const inputDisplay = panel.querySelector('#typ-input-display');
  const gameoverEl = panel.querySelector('#typ-gameover');
  const startBtn = panel.querySelector('#typ-start');

  let running = false, score = 0, lives = 3, buffer = '', words = [];
  let rafId = null, spawnTimer = null, lastTime = 0;

  function spawnWord() {
    if (!running) return;
    const text = TYPING_WORDS[Math.floor(Math.random() * TYPING_WORDS.length)];
    const el = document.createElement('div');
    el.className = 'typ-word';
    el.textContent = text;
    field.appendChild(el);
    const maxLeft = Math.max(field.clientWidth - el.offsetWidth - 10, 10);
    el.style.left = Math.floor(Math.random() * maxLeft) + 'px';
    el.style.top = '-34px';
    words.push({ el, text, y: -34 });
    spawnTimer = setTimeout(spawnWord, Math.max(1900 - score * 12, 750));
  }

  function loop(t) {
    if (!running) return;
    const dt = lastTime ? t - lastTime : 16;
    lastTime = t;
    const fh = field.clientHeight;
    const speed = 0.045 + score * 0.0006;
    for (let i = words.length - 1; i >= 0; i--) {
      const w = words[i];
      w.y += speed * dt;
      w.el.style.top = w.y + 'px';
      if (w.y > fh - 30) {
        loseLife();
        w.el.remove();
        words.splice(i, 1);
      }
    }
    rafId = requestAnimationFrame(loop);
  }

  function loseLife() {
    lives--;
    try { soundManager.error(); } catch (e) {}
    buffer = '';
    inputDisplay.innerHTML = '&nbsp;';
    updateHud();
    if (lives <= 0) endGame();
  }

  function updateHud() {
    scoreEl.textContent = 'Pontos: ' + score;
    livesEl.textContent = '❤️'.repeat(Math.max(lives, 0)) + '🖤'.repeat(3 - Math.max(lives, 0));
  }

  function onKey(e) {
    if (!running || !isPanelActiveWindow(panel)) return;
    if (e.key === 'Backspace') { buffer = buffer.slice(0, -1); }
    else if (e.key.length === 1 && /[a-zA-Zà-úÀ-Ú]/.test(e.key)) { buffer += e.key.toLowerCase(); }
    else return;

    const idx = words.findIndex(w => w.text === buffer);
    if (idx >= 0) {
      const w = words[idx];
      w.el.classList.add('typ-word-hit');
      soundManager.success();
      score += w.text.length;
      buffer = '';
      updateHud();
      setTimeout(() => w.el.remove(), 150);
      words.splice(idx, 1);
    } else if (buffer && !words.some(w => w.text.startsWith(buffer))) {
      buffer = buffer.slice(-1);
    }
    inputDisplay.textContent = buffer || '\u00A0';
  }

  async function endGame() {
    running = false;
    cancelAnimationFrame(rafId);
    clearTimeout(spawnTimer);
    words.forEach(w => w.el.remove());
    words = [];
    gameoverEl.style.display = 'block';
    gameoverEl.textContent = `Fim de jogo! Você fez ${score} pontos. 🎉`;
    startBtn.textContent = '🔄 Jogar de novo';
    startBtn.disabled = false;
    if (window.userManager && userManager.currentUser) {
      await userManager.saveGameResult('digitacao', score);
      if (score >= 30) await userManager.addStars(5);
      if (window.achievementManager) await achievementManager.checkAndUnlock();
    }
  }

  function startGame() {
    score = 0; lives = 3; buffer = ''; words = []; lastTime = 0;
    field.innerHTML = '';
    inputDisplay.innerHTML = '&nbsp;';
    gameoverEl.style.display = 'none';
    updateHud();
    running = true;
    startBtn.disabled = true;
    startBtn.textContent = '🎮 Jogando...';
    spawnWord();
    rafId = requestAnimationFrame(loop);
  }

  startBtn.addEventListener('click', () => { soundManager.click(); startGame(); });
  document.addEventListener('keydown', onKey);
  updateHud();

  panel._cleanup = () => {
    running = false;
    cancelAnimationFrame(rafId);
    clearTimeout(spawnTimer);
    document.removeEventListener('keydown', onKey);
  };
}
