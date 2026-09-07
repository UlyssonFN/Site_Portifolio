/* ==========================================================================
   Anne OS Kids — games/colorGame.js
   🌈 Acerte a Cor
   ========================================================================== */

const COLOR_GAME_COLORS = [
  { name: 'Vermelho', hex: '#ff6f6f', emoji: '🟥' },
  { name: 'Azul', hex: '#4fc3f7', emoji: '🟦' },
  { name: 'Verde', hex: '#6fdc8c', emoji: '🟩' },
  { name: 'Amarelo', hex: '#ffd166', emoji: '🟨' },
  { name: 'Roxo', hex: '#8c6fff', emoji: '🟪' },
  { name: 'Laranja', hex: '#ff9f6f', emoji: '🟧' },
  { name: 'Rosa', hex: '#ff6fa5', emoji: '🌸' },
  { name: 'Marrom', hex: '#8b5a2b', emoji: '🟫' }
];

function openColorGame() {
  const panel = document.createElement('div');
  panel.className = 'app-panel';
  panel.style.position = 'relative';
  panel.innerHTML = `
    <div class="quiz-score" id="cg-score">⭐ 0</div>
    <div class="quiz-box">
      <div class="quiz-question">Qual é a cor?</div>
      <div class="quiz-emoji-big" id="cg-emoji">🟥</div>
      <div class="quiz-options" id="cg-options"></div>
      <div class="quiz-feedback" id="cg-feedback"></div>
      <div class="game-progress" id="cg-progress">Rodada 1</div>
    </div>
  `;
  setTimeout(() => initColorGame(panel), 0);
  return panel;
}

function initColorGame(panel) {
  let score = 0, round = 1, numOptions = 3, acertos = 0, perguntas = 0;
  const scoreEl = panel.querySelector('#cg-score');
  const emojiEl = panel.querySelector('#cg-emoji');
  const optionsEl = panel.querySelector('#cg-options');
  const feedbackEl = panel.querySelector('#cg-feedback');
  const progressEl = panel.querySelector('#cg-progress');

  function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

  function nextRound() {
    feedbackEl.textContent = '';
    numOptions = Math.min(4 + Math.floor(round / 4), COLOR_GAME_COLORS.length);
    const options = shuffle(COLOR_GAME_COLORS).slice(0, Math.max(3, Math.min(numOptions, 6)));
    const answer = options[Math.floor(Math.random() * options.length)];
    emojiEl.textContent = answer.emoji;
    emojiEl.style.color = answer.hex;
    optionsEl.innerHTML = '';
    shuffle(options).forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = opt.emoji + ' ' + opt.name;
      btn.addEventListener('click', () => handleAnswer(btn, opt, answer));
      optionsEl.appendChild(btn);
    });
    progressEl.textContent = `Rodada ${round}`;
  }

  async function handleAnswer(btn, chosen, answer) {
    optionsEl.querySelectorAll('button').forEach(b => b.disabled = true);
    perguntas++;
    if (chosen.hex === answer.hex) {
      btn.classList.add('correct');
      score += 10; acertos++;
      feedbackEl.textContent = '🎉 Isso mesmo! Muito bem!';
      soundManager.success();
      await userManager.addStars(1);
    } else {
      btn.classList.add('wrong');
      score = Math.max(0, score - 2);
      feedbackEl.textContent = `😅 Quase! Era ${answer.emoji} ${answer.name}.`;
      soundManager.error();
    }
    scoreEl.textContent = '⭐ ' + score;
    round++;
    setTimeout(async () => {
      if (round > 10) { await finishGame(score, acertos, perguntas); return; }
      nextRound();
    }, 1200);
  }

  async function finishGame(finalScore, acertos, perguntas) {
    if (userManager.currentUser) {
      const best = await userManager.getBestScore('acerte-a-cor');
      await db.add('games', { usuario_id: userManager.currentUser.id, jogo: 'acerte-a-cor', pontuacao: finalScore, acertos, perguntas, data: new Date().toISOString() });
      await userManager.incGamesPlayed();
      await userManager.addScore(finalScore);
      if (finalScore > best) { notificationManager.record(); await userManager.addStars(10); }
      await achievementManager.checkAndUnlock();
    }
    panel.querySelector('.quiz-box').innerHTML = `
      <div class="quiz-question">🏁 Fim de jogo!</div>
      <div class="quiz-emoji-big">🌈</div>
      <p style="font-size:1.2rem;font-weight:700;color:#3a2a55;">Pontuação final: ${finalScore} ⭐</p>
      <button class="quiz-option" id="cg-restart">🔁 Jogar novamente</button>
    `;
    panel.querySelector('#cg-restart').addEventListener('click', () => { score = 0; round = 1; acertos = 0; perguntas = 0; scoreEl.textContent = '⭐ 0';
      panel.querySelector('.quiz-box').innerHTML = `
        <div class="quiz-question">Qual é a cor?</div>
        <div class="quiz-emoji-big" id="cg-emoji">🟥</div>
        <div class="quiz-options" id="cg-options"></div>
        <div class="quiz-feedback" id="cg-feedback"></div>
        <div class="game-progress" id="cg-progress">Rodada 1</div>`;
      Object.assign(panel, {});
      initColorGame(panel);
    });
  }

  nextRound();
}
