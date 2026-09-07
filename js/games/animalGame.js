/* ==========================================================================
   Anne OS Kids — games/animalGame.js
  🐾 Mundo dos Animais: Que animal é esse? / Memória
   ========================================================================== */

const ANIMALS = [
  { name: 'Elefante', emoji: '🐘', curiosity: 'O elefante é o maior animal terrestre do mundo!', sound: [120, 90, 150] },
  { name: 'Cachorro', emoji: '🐶', curiosity: 'Cachorros conseguem sentir até 100 mil cheiros diferentes!', sound: [300, 500] },
  { name: 'Leão', emoji: '🦁', curiosity: 'O rugido do leão pode ser ouvido a 8 km de distância!', sound: [140, 220, 160] },
  { name: 'Gato', emoji: '🐱', curiosity: 'Gatos dormem em média 15 horas por dia.', sound: [600, 750] },
  { name: 'Vaca', emoji: '🐮', curiosity: 'Vacas têm melhores amigas e ficam tristes quando separadas!', sound: [180, 260] },
  { name: 'Pato', emoji: '🦆', curiosity: 'O som do pato não faz eco — é um mistério da natureza!', sound: [700, 550, 700] },
  { name: 'Cavalo', emoji: '🐴', curiosity: 'Cavalos conseguem dormir em pé.', sound: [400, 300, 400, 300] },
  { name: 'Ovelha', emoji: '🐑', curiosity: 'Ovelhas reconhecem rostos, até de outras ovelhas!', sound: [350, 420] },
  { name: 'Macaco', emoji: '🐵', curiosity: 'Macacos usam gravetos como ferramentas!', sound: [900, 700, 900] },
  { name: 'Urso', emoji: '🐻', curiosity: 'Ursos podem correr tão rápido quanto um cavalo!', sound: [100, 80] },
  { name: 'Tigre', emoji: '🐯', curiosity: 'Cada tigre tem listras únicas, como impressões digitais!', sound: [150, 240, 150] },
  { name: 'Panda', emoji: '🐼', curiosity: 'Pandas comem bambu quase o dia todo!', sound: [400, 500] },
  { name: 'Sapo', emoji: '🐸', curiosity: 'Alguns sapos conseguem pular 20 vezes o tamanho do próprio corpo!', sound: [500, 300, 500] },
  { name: 'Coelho', emoji: '🐰', curiosity: 'Coelhos podem girar as orelhas 180 graus.', sound: [800, 900] },
  { name: 'Pinguim', emoji: '🐧', curiosity: 'Pinguins não voam, mas nadam muito bem!', sound: [650, 500] },
  { name: 'Raposa', emoji: '🦊', curiosity: 'Raposas usam o campo magnético da Terra para caçar!', sound: [450, 600, 450] }
];

function shuffleArr(arr) { return [...arr].sort(() => Math.random() - 0.5); }

/* ---------- Jogo 1: Que animal é esse? ---------- */
function openAnimalGuessGame() {
  const panel = document.createElement('div');
  panel.className = 'app-panel';
  panel.style.position = 'relative';
  panel.innerHTML = `<div class="quiz-score" id="ag-score">⭐ 0</div><div class="quiz-box" id="ag-box"></div>`;
  setTimeout(() => runAnimalQuiz(panel, 'visual'), 0);
  return panel;
}

function runAnimalQuiz(panel, mode) {
  let score = 0, round = 1, acertos = 0, perguntas = 0;
  const box = panel.querySelector('#ag-box');
  const scoreEl = panel.querySelector('#ag-score');
  const jogoKey = mode === 'sound' ? 'animais-som' : 'animais-quiz';

  function nextRound() {
    const options = shuffleArr(ANIMALS).slice(0, 4);
    const answer = options[Math.floor(Math.random() * options.length)];
    box.innerHTML = `
      ${mode === 'visual'
        ? `<div class="quiz-question">Que animal é esse?</div><div class="quiz-emoji-big">${answer.emoji}</div>`
        : `<div class="quiz-question">Qual animal faz esse som?</div><button class="quiz-option" id="ag-play-sound" style="font-size:2rem;">🔊 Ouvir</button>`}
      <div class="quiz-options" id="ag-options"></div>
      <div class="quiz-feedback" id="ag-feedback"></div>
      <div class="quiz-fact" id="ag-fact"></div>
      <div class="game-progress">Rodada ${round} de 8</div>
    `;
    if (mode === 'sound') {
      const playBtn = box.querySelector('#ag-play-sound');
      playBtn.addEventListener('click', () => playAnimalSound(answer));
      playAnimalSound(answer);
    }
    const optionsEl = box.querySelector('#ag-options');
    shuffleArr(options).forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = `${opt.emoji} ${opt.name}`;
      btn.addEventListener('click', () => handleAnswer(btn, opt, answer));
      optionsEl.appendChild(btn);
    });
  }

  async function handleAnswer(btn, chosen, answer) {
    box.querySelectorAll('.quiz-option').forEach(b => b.disabled = true);
    perguntas++;
    const feedback = box.querySelector('#ag-feedback');
    const fact = box.querySelector('#ag-fact');
    if (chosen.name === answer.name) {
      btn.classList.add('correct');
      score += 10; acertos++;
      feedback.textContent = `🎉 Acertou! É o ${answer.emoji} ${answer.name}`;
      soundManager.success();
      await userManager.addStars(1);
    } else {
      btn.classList.add('wrong');
      feedback.textContent = `😅 Era o ${answer.emoji} ${answer.name}`;
      soundManager.error();
    }
    fact.textContent = '💡 ' + answer.curiosity;
    scoreEl.textContent = '⭐ ' + score;
    round++;
    setTimeout(async () => {
      if (round > 8) { await finish(); return; }
      nextRound();
    }, 1900);
  }

  async function finish() {
    if (userManager.currentUser) {
      const best = await userManager.getBestScore(jogoKey);
      await db.add('games', { usuario_id: userManager.currentUser.id, jogo: jogoKey, pontuacao: score, acertos, perguntas, data: new Date().toISOString() });
      await userManager.incGamesPlayed();
      await userManager.addScore(score);
      if (score > best) { notificationManager.record(); await userManager.addStars(10); }
      await achievementManager.checkAndUnlock();
    }
    box.innerHTML = `
      <div class="quiz-question">🏁 Fim de jogo!</div>
      <div class="quiz-emoji-big">🐾</div>
      <p style="font-size:1.2rem;font-weight:700;color:#3a2a55;">Você acertou ${acertos} de ${perguntas}!</p>
      <button class="quiz-option" id="ag-restart">🔁 Jogar novamente</button>
    `;
    box.querySelector('#ag-restart').addEventListener('click', () => { score = 0; round = 1; acertos = 0; perguntas = 0; scoreEl.textContent = '⭐ 0'; nextRound(); });
  }

  nextRound();
}

/* ---------- Jogo 3: Memória dos Animais ---------- */
function openAnimalMemoryGame() {
  const panel = document.createElement('div');
  panel.className = 'app-panel';
  panel.innerHTML = `
    <h2 style="text-align:center;">🧠 Memória dos Animais</h2>
    <div class="memory-grid" id="memory-grid"></div>
    <div class="memory-stats">
      <span id="mem-attempts">Tentativas: 0</span>
      <span id="mem-time">Tempo: 0s</span>
    </div>
  `;
  setTimeout(() => initMemoryGame(panel), 0);
  return panel;
}

function initMemoryGame(panel) {
  const pairs = shuffleArr(ANIMALS).slice(0, 6);
  let cards = shuffleArr([...pairs, ...pairs].map((a, i) => ({ ...a, uid: i })));
  const grid = panel.querySelector('#memory-grid');
  const attemptsEl = panel.querySelector('#mem-attempts');
  const timeEl = panel.querySelector('#mem-time');
  let flipped = [], matched = 0, attempts = 0, seconds = 0, started = false;
  let timer = setInterval(() => { if (started) { seconds++; timeEl.textContent = 'Tempo: ' + seconds + 's'; } }, 1000);

  grid.innerHTML = '';
  cards.forEach(card => {
    const div = document.createElement('div');
    div.className = 'memory-card';
    div.dataset.name = card.name;
    div.dataset.uid = card.uid;
    div.textContent = '❓';
    div.addEventListener('click', () => handleFlip(div, card));
    grid.appendChild(div);
  });

  function handleFlip(div, card) {
    if (!started) started = true;
    if (div.classList.contains('flipped') || div.classList.contains('matched') || flipped.length === 2) return;
    div.classList.add('flipped');
    div.textContent = card.emoji;
    soundManager.click();
    flipped.push({ div, card });
    if (flipped.length === 2) {
      attempts++;
      attemptsEl.textContent = 'Tentativas: ' + attempts;
      if (flipped[0].card.name === flipped[1].card.name) {
        flipped.forEach(f => f.div.classList.add('matched'));
        matched++;
        soundManager.success();
        flipped = [];
        if (matched === pairs.length) finishMemory();
      } else {
        setTimeout(() => {
          flipped.forEach(f => { f.div.classList.remove('flipped'); f.div.textContent = '❓'; });
          flipped = [];
        }, 800);
      }
    }
  }

  async function finishMemory() {
    clearInterval(timer);
    const score = Math.max(10, 100 - attempts * 5 - seconds);
    if (userManager.currentUser) {
      const best = await userManager.getBestScore('memoria-animais');
      await db.add('games', { usuario_id: userManager.currentUser.id, jogo: 'memoria-animais', pontuacao: score, acertos: pairs.length, perguntas: attempts, data: new Date().toISOString() });
      await userManager.incGamesPlayed();
      await userManager.addScore(score);
      await userManager.addStars(5);
      if (score > best) notificationManager.record();
      await achievementManager.checkAndUnlock();
    }
    setTimeout(() => notificationManager.show(`Memória concluída em ${attempts} tentativas e ${seconds}s! 🎉`, '🧠', 4000), 300);
  }
}
