/* ==========================================================================
   Anne OS Kids — games/lettersGame.js
   🔤 Letras: qual palavra começa com a letra mostrada?
   ========================================================================== */

const LETTER_WORDS = {
  A: [{ w: 'Abelha', e: '🐝' }, { w: 'Avião', e: '✈️' }, { w: 'Anel', e: '💍' }],
  B: [{ w: 'Bola', e: '⚽' }, { w: 'Borboleta', e: '🦋' }, { w: 'Balão', e: '🎈' }],
  C: [{ w: 'Casa', e: '🏠' }, { w: 'Cachorro', e: '🐶' }, { w: 'Chave', e: '🔑' }],
  D: [{ w: 'Dado', e: '🎲' }, { w: 'Dinossauro', e: '🦖' }, { w: 'Doce', e: '🍬' }],
  E: [{ w: 'Elefante', e: '🐘' }, { w: 'Estrela', e: '⭐' }, { w: 'Escola', e: '🏫' }],
  F: [{ w: 'Flor', e: '🌸' }, { w: 'Foguete', e: '🚀' }, { w: 'Formiga', e: '🐜' }],
  G: [{ w: 'Gato', e: '🐱' }, { w: 'Girafa', e: '🦒' }, { w: 'Guarda-chuva', e: '☂️' }],
  L: [{ w: 'Lua', e: '🌙' }, { w: 'Leão', e: '🦁' }, { w: 'Livro', e: '📕' }],
  M: [{ w: 'Maçã', e: '🍎' }, { w: 'Macaco', e: '🐵' }, { w: 'Mochila', e: '🎒' }],
  P: [{ w: 'Pato', e: '🦆' }, { w: 'Panda', e: '🐼' }, { w: 'Peixe', e: '🐟' }],
  S: [{ w: 'Sol', e: '☀️' }, { w: 'Sapo', e: '🐸' }, { w: 'Sorvete', e: '🍦' }],
  T: [{ w: 'Tartaruga', e: '🐢' }, { w: 'Tigre', e: '🐯' }, { w: 'Trem', e: '🚂' }]
};
const LETTER_KEYS = Object.keys(LETTER_WORDS);

function openLettersGame() {
  const panel = document.createElement('div');
  panel.className = 'app-panel';
  panel.style.position = 'relative';
  panel.innerHTML = `<div class="quiz-score" id="lg-score">⭐ 0</div><div class="quiz-box" id="lg-box"></div>`;
  setTimeout(() => initLettersGame(panel), 0);
  return panel;
}

function initLettersGame(panel) {
  let score = 0, round = 1, acertos = 0, perguntas = 0;
  const box = panel.querySelector('#lg-box');
  const scoreEl = panel.querySelector('#lg-score');

  function nextRound() {
    const letter = LETTER_KEYS[Math.floor(Math.random() * LETTER_KEYS.length)];
    const correctWord = LETTER_WORDS[letter][Math.floor(Math.random() * LETTER_WORDS[letter].length)];
    let wrongLetters = shuffleArr(LETTER_KEYS.filter(l => l !== letter)).slice(0, 3);
    let wrongWords = wrongLetters.map(l => LETTER_WORDS[l][0]);
    const options = shuffleArr([correctWord, ...wrongWords]);

    box.innerHTML = `
      <div class="quiz-question">Qual palavra começa com a letra...</div>
      <div class="quiz-emoji-big" style="font-size:4rem;font-weight:800;color:var(--Anne-purple);">${letter}</div>
      <div class="quiz-options" id="lg-options"></div>
      <div class="quiz-feedback" id="lg-feedback"></div>
      <div class="game-progress">Rodada ${round} de 8</div>
    `;
    const optionsEl = box.querySelector('#lg-options');
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = `${opt.e} ${opt.w}`;
      btn.addEventListener('click', () => handleAnswer(btn, opt, correctWord));
      optionsEl.appendChild(btn);
    });
  }

  async function handleAnswer(btn, chosen, answer) {
    box.querySelectorAll('.quiz-option').forEach(b => b.disabled = true);
    perguntas++;
    const feedback = box.querySelector('#lg-feedback');
    if (chosen.w === answer.w) {
      btn.classList.add('correct');
      score += 10; acertos++;
      feedback.textContent = '🎉 Muito bem!';
      soundManager.success();
      await userManager.addStars(1);
    } else {
      btn.classList.add('wrong');
      feedback.textContent = `😅 Era ${answer.e} ${answer.w}`;
      soundManager.error();
    }
    scoreEl.textContent = '⭐ ' + score;
    round++;
    setTimeout(async () => { if (round > 8) { await finish(); return; } nextRound(); }, 1300);
  }

  async function finish() {
    if (userManager.currentUser) {
      const best = await userManager.getBestScore('letras');
      await db.add('games', { usuario_id: userManager.currentUser.id, jogo: 'letras', pontuacao: score, acertos, perguntas, data: new Date().toISOString() });
      await userManager.incGamesPlayed();
      await userManager.addScore(score);
      if (score > best) { notificationManager.record(); await userManager.addStars(10); }
      await achievementManager.checkAndUnlock();
    }
    box.innerHTML = `
      <div class="quiz-question">🏁 Fim de jogo!</div>
      <div class="quiz-emoji-big">🔤</div>
      <p style="font-size:1.2rem;font-weight:700;color:#3a2a55;">Você acertou ${acertos} de ${perguntas}!</p>
      <button class="quiz-option" id="lg-restart">🔁 Jogar novamente</button>
    `;
    box.querySelector('#lg-restart').addEventListener('click', () => { score = 0; round = 1; acertos = 0; perguntas = 0; scoreEl.textContent = '⭐ 0'; nextRound(); });
  }

  nextRound();
}
