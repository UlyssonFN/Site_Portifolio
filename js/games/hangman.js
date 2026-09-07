/* Anne OS Kids - Jogo da Forca */

const HANGMAN_WORDS = [
  { word: 'GATO', hint: 'Um animal que mia' },
  { word: 'CASA', hint: 'Lugar onde moramos' },
  { word: 'BOLA', hint: 'Objeto usado em muitos jogos' },
  { word: 'FLOR', hint: 'Pode nascer no jardim' },
  { word: 'PEIXE', hint: 'Animal que vive na água' },
  { word: 'ESCOLA', hint: 'Lugar de aprender' },
  { word: 'AMIGO', hint: 'Pessoa querida' },
  { word: 'SORVETE', hint: 'Doce gelado' },
  { word: 'ARCOIRIS', hint: 'Aparece depois da chuva' },
  { word: 'BICICLETA', hint: 'Tem duas rodas e pedais' },
  { word: 'BORBOLETA', hint: 'Inseto com asas coloridas' },
  { word: 'DINOSSAURO', hint: 'Animal que viveu há muito tempo' }
];

function openHangmanGame() {
  const panel = document.createElement('div');
  panel.className = 'app-panel hangman-panel';
  panel.innerHTML = `
    <h2>🔤 Jogo da Forca</h2>
    <div class="hangman-hud">
      <span id="hm-score">Pontos: 0</span>
      <span id="hm-misses">Erros: 0/6</span>
      <button id="hm-new" class="btn-secondary">🔄 Novo jogo</button>
    </div>
    <div class="hangman-main">
      <div class="hangman-drawing" id="hm-drawing">🪵</div>
      <div class="hangman-content">
        <p id="hm-hint" class="hangman-hint"></p>
        <div id="hm-word" class="hangman-word"></div>
        <div id="hm-keyboard" class="hangman-keyboard"></div>
        <p id="hm-message" class="pz-win" style="display:none;"></p>
      </div>
    </div>
  `;
  setTimeout(() => initHangmanGame(panel), 0);
  return panel;
}

function initHangmanGame(panel) {
  const scoreEl = panel.querySelector('#hm-score');
  const missesEl = panel.querySelector('#hm-misses');
  const drawingEl = panel.querySelector('#hm-drawing');
  const hintEl = panel.querySelector('#hm-hint');
  const wordEl = panel.querySelector('#hm-word');
  const keyboardEl = panel.querySelector('#hm-keyboard');
  const messageEl = panel.querySelector('#hm-message');
  let current = null;
  let guessed = new Set();
  let misses = 0;
  let score = 0;
  let finished = false;

  function startGame() {
    current = HANGMAN_WORDS[Math.floor(Math.random() * HANGMAN_WORDS.length)];
    guessed = new Set();
    misses = 0;
    score = 0;
    finished = false;
    hintEl.textContent = 'Dica: ' + current.hint;
    messageEl.style.display = 'none';
    render();
  }

  function render() {
    const revealed = current.word.split('').map(letter => guessed.has(letter) ? letter : '_').join(' ');
    wordEl.textContent = revealed;
    scoreEl.textContent = 'Pontos: ' + score;
    missesEl.textContent = `Erros: ${misses}/6`;
    drawingEl.textContent = ['🪵', '🪵🙂', '🪵🙂〰️', '🪵😟〰️', '🪵😣〰️', '🪵😵〰️', '🪦'][misses];
    keyboardEl.innerHTML = '';
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(letter => {
      const button = document.createElement('button');
      button.className = 'hangman-key';
      button.textContent = letter;
      button.disabled = guessed.has(letter) || finished;
      if (guessed.has(letter)) button.classList.add(current.word.includes(letter) ? 'correct' : 'wrong');
      button.addEventListener('click', () => guess(letter));
      keyboardEl.appendChild(button);
    });
  }

  async function guess(letter) {
    if (finished || guessed.has(letter)) return;
    guessed.add(letter);
    if (current.word.includes(letter)) {
      score += 10;
      soundManager.success();
    } else {
      misses++;
      soundManager.error();
    }
    render();
    const solved = current.word.split('').every(letterInWord => guessed.has(letterInWord));
    if (solved || misses >= 6) await finish(solved);
  }

  async function finish(solved) {
    finished = true;
    if (solved) {
      score += Math.max(20, (6 - misses) * 5);
      messageEl.textContent = `🎉 Você acertou! A palavra era ${current.word}.`;
      messageEl.style.color = 'var(--Anne-green)';
      soundManager.success();
    } else {
      messageEl.textContent = `😅 A palavra era ${current.word}. Tente novamente!`;
      messageEl.style.color = 'var(--Anne-red)';
      soundManager.error();
    }
    messageEl.style.display = 'block';
    render();
    if (window.userManager && userManager.currentUser) {
      await userManager.saveGameResult('forca', solved ? score : 0);
      if (solved) {
        await userManager.addStars(5);
        if (window.achievementManager) await achievementManager.checkAndUnlock();
      }
    }
  }

  panel.querySelector('#hm-new').addEventListener('click', () => { soundManager.click(); startGame(); });
  startGame();
  panel._cleanup = () => {};
}
