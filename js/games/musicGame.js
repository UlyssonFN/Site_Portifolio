/* ==========================================================================
   Anne OS Kids — games/musicGame.js
   🎵 Anne Music: Teclado Musical / Repita a Música / Acerte a Nota
   ========================================================================== */

const MUSIC_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C2'];
const KEY_MAP = { a: 'C', s: 'D', d: 'E', f: 'F', g: 'G', h: 'A', j: 'B', k: 'C2' };

/* ---------- Teclado Musical ---------- */
function openPianoApp() {
  const panel = document.createElement('div');
  panel.className = 'app-panel';
  panel.innerHTML = `
    <h2 style="text-align:center;">🎹 Teclado Musical</h2>
    <p style="text-align:center;color:#888;font-size:.85rem;">Toque com o mouse, o dedo ou o teclado (A S D F G H J K)</p>
    <div class="piano" id="piano"></div>
  `;
  const piano = panel.querySelector('#piano');
  MUSIC_NOTES.forEach(note => {
    const key = document.createElement('div');
    key.className = 'piano-key';
    key.dataset.note = note;
    key.textContent = note.replace('2', "'");
    const play = () => {
      soundManager.playNote(note);
      key.classList.add('playing');
      setTimeout(() => key.classList.remove('playing'), 180);
      window.__pianoPlays = (window.__pianoPlays || 0) + 1;
      if (window.__pianoPlays % 5 === 0) achievementManager.checkAndUnlock();
    };
    key.addEventListener('mousedown', play);
    key.addEventListener('touchstart', (e) => { e.preventDefault(); play(); }, { passive: false });
    piano.appendChild(key);
  });

  const keyHandler = (e) => {
    if (!isPanelActiveWindow(panel)) return;
    const note = KEY_MAP[e.key.toLowerCase()];
    if (note) {
      const keyEl = piano.querySelector(`[data-note="${note}"]`);
      if (keyEl) { soundManager.playNote(note); keyEl.classList.add('playing'); setTimeout(() => keyEl.classList.remove('playing'), 180); }
    }
  };
  document.addEventListener('keydown', keyHandler);
  panel._cleanup = () => document.removeEventListener('keydown', keyHandler);
  return panel;
}

/* ---------- Repita a Música (Simon) ---------- */
function openMusicRepeatGame() {
  const panel = document.createElement('div');
  panel.className = 'app-panel';
  panel.style.position = 'relative';
  panel.innerHTML = `
    <div class="quiz-score" id="mr-score">⭐ 0</div>
    <h2 style="text-align:center;">🎵 Repita a Música</h2>
    <div class="music-sequence-display" id="mr-display">🎧</div>
    <div class="piano" id="mr-piano"></div>
    <div class="music-controls"><button class="music-btn" id="mr-play">▶️ Ouvir sequência</button></div>
    <div class="quiz-feedback" id="mr-feedback" style="text-align:center;"></div>
  `;
  setTimeout(() => initMusicRepeat(panel), 0);
  return panel;
}

function initMusicRepeat(panel) {
  let sequence = [], userIndex = 0, level = 1, score = 0;
  const piano = panel.querySelector('#mr-piano');
  const display = panel.querySelector('#mr-display');
  const feedback = panel.querySelector('#mr-feedback');
  const scoreEl = panel.querySelector('#mr-score');
  let accepting = false;

  MUSIC_NOTES.slice(0, 6).forEach(note => {
    const key = document.createElement('div');
    key.className = 'piano-key';
    key.dataset.note = note;
    key.textContent = note.replace('2', "'");
    key.addEventListener('click', () => handlePress(note, key));
    piano.appendChild(key);
  });

  function newLevel() {
    sequence.push(MUSIC_NOTES[Math.floor(Math.random() * 6)]);
    userIndex = 0;
    display.textContent = '🎧 Nível ' + level;
    feedback.textContent = '';
    accepting = false;
    setTimeout(playSequence, 700);
  }

  function playSequence() {
    accepting = false;
    sequence.forEach((note, i) => {
      setTimeout(() => {
        soundManager.playNote(note, 0.4);
        const k = piano.querySelector(`[data-note="${note}"]`);
        if (k) { k.classList.add('playing'); setTimeout(() => k.classList.remove('playing'), 300); }
        if (i === sequence.length - 1) setTimeout(() => { accepting = true; feedback.textContent = 'Sua vez! 🎼'; }, 400);
      }, i * 600);
    });
  }

  async function handlePress(note, keyEl) {
    if (!accepting) return;
    soundManager.playNote(note);
    keyEl.classList.add('playing');
    setTimeout(() => keyEl.classList.remove('playing'), 180);
    window.__pianoPlays = (window.__pianoPlays || 0) + 1;

    if (note === sequence[userIndex]) {
      userIndex++;
      if (userIndex === sequence.length) {
        accepting = false;
        score += level * 5;
        scoreEl.textContent = '⭐ ' + score;
        feedback.textContent = '⭐ Certo! Próximo nível...';
        soundManager.success();
        level++;
        setTimeout(newLevel, 1000);
      }
    } else {
      accepting = false;
      feedback.textContent = '❌ Ops! Vamos tentar de novo.';
      soundManager.error();
      await finish();
    }
  }

  async function finish() {
    if (userManager.currentUser) {
      const best = await userManager.getBestScore('musica-repita');
      await db.add('games', { usuario_id: userManager.currentUser.id, jogo: 'musica-repita', pontuacao: score, data: new Date().toISOString() });
      await userManager.incGamesPlayed();
      await userManager.addScore(score);
      await userManager.addStars(Math.max(1, Math.floor(score / 10)));
      if (score > best) notificationManager.record();
      await achievementManager.checkAndUnlock();
    }
    setTimeout(() => {
      display.innerHTML = `Pontuação final: ${score} ⭐ <br><button class="music-btn" id="mr-restart">🔁 Jogar novamente</button>`;
      panel.querySelector('#mr-restart').addEventListener('click', () => { sequence = []; level = 1; score = 0; scoreEl.textContent = '⭐ 0'; newLevel(); });
    }, 1200);
  }

  panel.querySelector('#mr-play').addEventListener('click', () => { if (sequence.length) playSequence(); });
  newLevel();
}

/* ---------- Acerte a Nota ---------- */
function openMusicNoteGame() {
  const panel = document.createElement('div');
  panel.className = 'app-panel';
  panel.style.position = 'relative';
  panel.innerHTML = `<div class="quiz-score" id="mn-score">⭐ 0</div><div class="quiz-box" id="mn-box"></div>`;
  setTimeout(() => initMusicNoteGame(panel), 0);
  return panel;
}

function initMusicNoteGame(panel) {
  let score = 0, round = 1, acertos = 0, perguntas = 0;
  const box = panel.querySelector('#mn-box');
  const scoreEl = panel.querySelector('#mn-score');

  function nextRound() {
    const options = shuffleArr(MUSIC_NOTES.slice(0, 7)).slice(0, 4);
    const answer = options[Math.floor(Math.random() * options.length)];
    box.innerHTML = `
      <div class="quiz-question">🎵 Qual é essa nota?</div>
      <button class="quiz-option" id="mn-play" style="font-size:2rem;">🔊 Tocar nota</button>
      <div class="quiz-options" id="mn-options"></div>
      <div class="quiz-feedback" id="mn-feedback"></div>
      <div class="game-progress">Rodada ${round} de 8</div>
    `;
    box.querySelector('#mn-play').addEventListener('click', () => soundManager.playNote(answer, 0.6));
    soundManager.playNote(answer, 0.6);
    const optionsEl = box.querySelector('#mn-options');
    shuffleArr(options).forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = opt.replace('2', "'");
      btn.addEventListener('click', () => handleAnswer(btn, opt, answer));
      optionsEl.appendChild(btn);
    });
  }

  async function handleAnswer(btn, chosen, answer) {
    box.querySelectorAll('.quiz-option').forEach(b => b.disabled = true);
    perguntas++;
    const feedback = box.querySelector('#mn-feedback');
    if (chosen === answer) {
      btn.classList.add('correct');
      score += 10; acertos++;
      feedback.textContent = '🎉 Isso mesmo!';
      soundManager.success();
      await userManager.addStars(1);
    } else {
      btn.classList.add('wrong');
      feedback.textContent = `😅 Era a nota ${answer.replace('2', "'")}`;
      soundManager.error();
    }
    scoreEl.textContent = '⭐ ' + score;
    round++;
    setTimeout(async () => { if (round > 8) { await finish(); return; } nextRound(); }, 1300);
  }

  async function finish() {
    if (userManager.currentUser) {
      const best = await userManager.getBestScore('musica-nota');
      await db.add('games', { usuario_id: userManager.currentUser.id, jogo: 'musica-nota', pontuacao: score, acertos, perguntas, data: new Date().toISOString() });
      await userManager.incGamesPlayed();
      await userManager.addScore(score);
      if (score > best) { notificationManager.record(); await userManager.addStars(10); }
      await achievementManager.checkAndUnlock();
    }
    box.innerHTML = `
      <div class="quiz-question">🏁 Fim de jogo!</div>
      <p style="font-size:1.2rem;font-weight:700;color:#3a2a55;">Você acertou ${acertos} de ${perguntas}!</p>
      <button class="quiz-option" id="mn-restart">🔁 Jogar novamente</button>
    `;
    box.querySelector('#mn-restart').addEventListener('click', () => { score = 0; round = 1; acertos = 0; perguntas = 0; scoreEl.textContent = '⭐ 0'; nextRound(); });
  }

  nextRound();
}
