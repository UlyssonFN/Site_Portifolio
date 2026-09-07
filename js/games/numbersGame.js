/* ==========================================================================
   Anne OS Kids — games/numbersGame.js
   🔢 Números: quantos objetos existem?
   ========================================================================== */

const NUMBER_EMOJIS = ['🐶', '🐱', '🍎', '⭐', '🎈', '🦋', '🌸', '🐸', '🚗', '⚽'];

function openNumbersGame() {
  const panel = document.createElement('div');
  panel.className = 'app-panel';
  panel.style.position = 'relative';
  panel.innerHTML = `<div class="quiz-score" id="ng-score">⭐ 0</div><div class="quiz-box" id="ng-box"></div>`;
  setTimeout(() => initNumbersGame(panel), 0);
  return panel;
}

function initNumbersGame(panel) {
  let score = 0, round = 1, acertos = 0, perguntas = 0;
  const box = panel.querySelector('#ng-box');
  const scoreEl = panel.querySelector('#ng-score');

  function nextRound() {
    const maxCount = Math.min(4 + round, 12);
    const count = Math.floor(Math.random() * maxCount) + 1;
    const emoji = NUMBER_EMOJIS[Math.floor(Math.random() * NUMBER_EMOJIS.length)];
    const options = new Set([count]);
    // Tenta valores "próximos" primeiro (mais desafiador), com um limite de
    // tentativas — para números pequenos (ex.: count=1) nem sempre existem
    // 3 vizinhos válidos, então sem esse limite o laço giraria para sempre
    // e travava o sistema inteiro (bug reportado: jogo dos números travando).
    let attempts = 0;
    while (options.size < 4 && attempts < 30) {
      attempts++;
      const delta = Math.floor(Math.random() * 5) - 2;
      const val = count + delta;
      if (val >= 1 && val !== count) options.add(val);
    }
    // Garantia de término: completa com números maiores e ainda não usados —
    // sempre existem infinitos, então isso nunca deixa de terminar.
    let filler = count + 1;
    while (options.size < 4) {
      if (!options.has(filler)) options.add(filler);
      filler++;
    }
    box.innerHTML = `
      <div class="quiz-question">Quantos existem?</div>
      <div class="quiz-emoji-big" style="font-size:2.2rem;letter-spacing:.3rem;">${emoji.repeat(count)}</div>
      <div class="quiz-options" id="ng-options"></div>
      <div class="quiz-feedback" id="ng-feedback"></div>
      <div class="game-progress">Rodada ${round} de 8</div>
    `;
    const optionsEl = box.querySelector('#ng-options');
    shuffleArr([...options]).forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = opt;
      btn.addEventListener('click', () => handleAnswer(btn, opt, count));
      optionsEl.appendChild(btn);
    });
  }

  async function handleAnswer(btn, chosen, answer) {
    box.querySelectorAll('.quiz-option').forEach(b => b.disabled = true);
    perguntas++;
    const feedback = box.querySelector('#ng-feedback');
    if (chosen === answer) {
      btn.classList.add('correct');
      score += 10; acertos++;
      feedback.textContent = '🎉 Contou certinho!';
      soundManager.success();
      await userManager.addStars(1);
    } else {
      btn.classList.add('wrong');
      feedback.textContent = `😅 Eram ${answer}`;
      soundManager.error();
    }
    scoreEl.textContent = '⭐ ' + score;
    round++;
    setTimeout(async () => { if (round > 8) { await finish(); return; } nextRound(); }, 1200);
  }

  async function finish() {
    if (userManager.currentUser) {
      const best = await userManager.getBestScore('numeros');
      await db.add('games', { usuario_id: userManager.currentUser.id, jogo: 'numeros', pontuacao: score, acertos, perguntas, data: new Date().toISOString() });
      await userManager.incGamesPlayed();
      await userManager.addScore(score);
      if (score > best) { notificationManager.record(); await userManager.addStars(10); }
      await achievementManager.checkAndUnlock();
    }
    box.innerHTML = `
      <div class="quiz-question">🏁 Fim de jogo!</div>
      <div class="quiz-emoji-big">🔢</div>
      <p style="font-size:1.2rem;font-weight:700;color:#3a2a55;">Você acertou ${acertos} de ${perguntas}!</p>
      <button class="quiz-option" id="ng-restart">🔁 Jogar novamente</button>
    `;
    box.querySelector('#ng-restart').addEventListener('click', () => { score = 0; round = 1; acertos = 0; perguntas = 0; scoreEl.textContent = '⭐ 0'; nextRound(); });
  }

  nextRound();
}
