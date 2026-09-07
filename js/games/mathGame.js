/* ==========================================================================
   Anne OS Kids — games/mathGame.js
   🧮 Matemática: soma, subtração, multiplicação, divisão (dificuldade adaptativa)
   ========================================================================== */

function openMathGame() {
  const panel = document.createElement('div');
  panel.className = 'app-panel';
  panel.style.position = 'relative';
  panel.innerHTML = `<div class="quiz-score" id="mg-score">⭐ 0</div><div class="quiz-box" id="mg-box"></div>`;
  setTimeout(() => initMathGame(panel), 0);
  return panel;
}

function genMathQuestion(level) {
  const ops = ['+', '-', '×', '÷'];
  const op = ops[Math.floor(Math.random() * (level > 2 ? ops.length : 2))];
  const maxN = 5 + level * 3;
  let a = Math.floor(Math.random() * maxN) + 1;
  let b = Math.floor(Math.random() * maxN) + 1;
  let answer;
  if (op === '+') answer = a + b;
  else if (op === '-') { if (b > a) [a, b] = [b, a]; answer = a - b; }
  else if (op === '×') { a = Math.floor(Math.random() * (4 + level)) + 1; b = Math.floor(Math.random() * (4 + level)) + 1; answer = a * b; }
  else { b = Math.floor(Math.random() * 8) + 1; answer = Math.floor(Math.random() * 8) + 1; a = b * answer; }
  return { text: `${a} ${op} ${b} = ?`, answer };
}

function initMathGame(panel) {
  let score = 0, round = 1, level = 1, acertos = 0, perguntas = 0;
  const box = panel.querySelector('#mg-box');
  const scoreEl = panel.querySelector('#mg-score');

  function nextRound() {
    const q = genMathQuestion(level);
    const options = new Set([q.answer]);
    // Mesma trava de segurança do jogo dos Números: limite de tentativas +
    // preenchimento garantido, para nunca travar mesmo se a resposta certa
    // for um número pequeno com poucas variações possíveis (ex.: 0).
    let attempts = 0;
    while (options.size < 4 && attempts < 30) {
      attempts++;
      const delta = Math.floor(Math.random() * 8) - 4;
      const val = q.answer + delta;
      if (val >= 0 && val !== q.answer) options.add(val);
    }
    let filler = q.answer + 1;
    while (options.size < 4) {
      if (!options.has(filler)) options.add(filler);
      filler++;
    }
    box.innerHTML = `
      <div class="quiz-question">${q.text}</div>
      <div class="quiz-options" id="mg-options"></div>
      <div class="quiz-feedback" id="mg-feedback"></div>
      <div class="game-progress">Rodada ${round} de 10 — nível ${level}</div>
    `;
    const optionsEl = box.querySelector('#mg-options');
    shuffleArr([...options]).forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = opt;
      btn.addEventListener('click', () => handleAnswer(btn, opt, q.answer));
      optionsEl.appendChild(btn);
    });
  }

  async function handleAnswer(btn, chosen, answer) {
    box.querySelectorAll('.quiz-option').forEach(b => b.disabled = true);
    perguntas++;
    const feedback = box.querySelector('#mg-feedback');
    if (chosen === answer) {
      btn.classList.add('correct');
      score += 10; acertos++;
      feedback.textContent = '🎉 Correto!';
      soundManager.success();
      if (acertos % 3 === 0) level = Math.min(5, level + 1);
      await userManager.addStars(1);
    } else {
      btn.classList.add('wrong');
      feedback.textContent = `😅 A resposta era ${answer}`;
      soundManager.error();
      level = Math.max(1, level - 1);
    }
    scoreEl.textContent = '⭐ ' + score;
    round++;
    setTimeout(async () => { if (round > 10) { await finish(); return; } nextRound(); }, 1100);
  }

  async function finish() {
    if (userManager.currentUser) {
      const best = await userManager.getBestScore('matematica');
      await db.add('games', { usuario_id: userManager.currentUser.id, jogo: 'matematica', pontuacao: score, acertos, perguntas, data: new Date().toISOString() });
      await userManager.incGamesPlayed();
      await userManager.addScore(score);
      if (score > best) { notificationManager.record(); await userManager.addStars(10); }
      await achievementManager.checkAndUnlock();
    }
    box.innerHTML = `
      <div class="quiz-question">🏁 Fim de jogo!</div>
      <div class="quiz-emoji-big">🧮</div>
      <p style="font-size:1.2rem;font-weight:700;color:#3a2a55;">Você acertou ${acertos} de ${perguntas}!</p>
      <button class="quiz-option" id="mg-restart">🔁 Jogar novamente</button>
    `;
    box.querySelector('#mg-restart').addEventListener('click', () => { score = 0; round = 1; level = 1; acertos = 0; perguntas = 0; scoreEl.textContent = '⭐ 0'; nextRound(); });
  }

  nextRound();
}
