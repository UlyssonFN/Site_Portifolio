/* ==========================================================================
   Anne OS Kids — games/gamesHub.js
   🎮 Jogos: hub central de todos os jogos, e 🎵 Anne Music hub
   ========================================================================== */

const GAMES_CATALOG = [
  { id: 'color-game', emoji: '🌈', title: 'Acerte a Cor', sub: 'Cores e atenção', open: openColorGame },
  { id: 'math-game', emoji: '🧮', title: 'Matemática', sub: 'Soma, subtração e mais', open: openMathGame },
  { id: 'letters-game', emoji: '🔤', title: 'Letras', sub: 'Alfabetização', open: openLettersGame },
  { id: 'numbers-game', emoji: '🔢', title: 'Números', sub: 'Contar objetos', open: openNumbersGame },
  { id: 'animal-guess', emoji: '🐘', title: 'Que Animal É Esse?', sub: 'Mundo dos Animais', open: openAnimalGuessGame },
  { id: 'animal-memory', emoji: '🧠', title: 'Memória dos Animais', sub: 'Mundo dos Animais', open: openAnimalMemoryGame },
  { id: 'piano', emoji: '🎹', title: 'Teclado Musical', sub: 'Anne Music', open: openPianoApp },
  { id: 'music-repeat', emoji: '🎵', title: 'Repita a Música', sub: 'Anne Music', open: openMusicRepeatGame },
  { id: 'music-note', emoji: '🎶', title: 'Acerte a Nota', sub: 'Anne Music', open: openMusicNoteGame },

  { id: 'tic-tac-toe', emoji: '❌', title: 'Jogo da Velha', sub: 'Clássicos de mesa', open: openTicTacToeGame, w: 420, h: 520 },
  { id: 'checkers', emoji: '⚫', title: 'Dama', sub: 'Clássicos de mesa', open: openCheckersGame, w: 520, h: 600 },
  { id: 'chess', emoji: '♟️', title: 'Xadrez', sub: 'Clássicos de mesa', open: openChessGame, w: 540, h: 620 },
  { id: 'peg-solitaire', emoji: '🕳️', title: 'Resta Um', sub: 'Clássicos de mesa', open: openPegSolitaireGame, w: 460, h: 560 },
  { id: 'domino', emoji: '🁫', title: 'Dominó', sub: 'Clássicos de mesa', open: openDominoGame, w: 620, h: 480 },
  { id: 'pickup-sticks', emoji: '🥢', title: 'Pega-Vareta', sub: 'Clássicos de mesa', open: openPickupSticksGame, w: 520, h: 520 },
  { id: 'color-sequence', emoji: '🎨', title: 'Sequência de Cores', sub: 'Cores e atenção', open: openColorSequenceGame, w: 460, h: 520 },
  { id: 'dog-maze', emoji: '🐕', title: 'Cachorro pra Casinha', sub: 'Labirinto', open: openDogMazeGame, w: 520, h: 580 },
  { id: 'pacman', emoji: '👻', title: 'Come-Come', sub: 'Arcade', open: openPacmanGame, w: 480, h: 560 },
  { id: 'snake', emoji: '🐍', title: 'Snake', sub: 'Arcade', open: openSnakeGame, w: 430, h: 600 },
  { id: 'tetris', emoji: '🧱', title: 'Tetris', sub: 'Arcade', open: openTetrisGame, w: 430, h: 650 },
  { id: 'car-race', emoji: '🏎️', title: 'Corrida de Carrinho', sub: 'Arcade', open: openCarRaceGame, w: 420, h: 600 },
  { id: 'doll-dressup', emoji: '👗', title: 'Vista a Boneca', sub: 'Criatividade', open: openDollDressUpGame, w: 520, h: 560 },

  { id: 'puzzle', emoji: '🧩', title: 'Quebra-Cabeça', sub: 'Quebra-cabeças', open: openPuzzleApp, w: 460, h: 600 },
  { id: 'puzzle-drag', emoji: '🧩', title: 'Quebra-Cabeça Fácil', sub: 'Arraste as peças', open: openDragPuzzleApp, w: 460, h: 620 },
  { id: 'typing-rain', emoji: '⌨️', title: 'Chuva de Palavras', sub: 'Digitação', open: openTypingApp, w: 480, h: 540 },
  { id: 'bucket-paint', emoji: '🪣', title: 'Balde de Tinta', sub: 'Criatividade', open: openBucketPaintApp, w: 460, h: 600 },
  { id: 'blocks-creative', emoji: '🧱', title: 'Blocos Criativos', sub: 'Criatividade', open: openBlocksApp, w: 660, h: 620 },
  { id: 'sinuca', emoji: '🎱', title: 'Sinuquinha', sub: 'Contra o computador', open: openPoolApp, w: 460, h: 460 },
  { id: 'solitaire', emoji: '🃏', title: 'Paciência de Baralho', sub: 'Clássico de cartas', open: openSolitaireGame, w: 760, h: 650 }
  ,{ id: 'hangman', emoji: '🔤', title: 'Jogo da Forca', sub: 'Palavras e dicas', open: openHangmanGame, w: 620, h: 560 }
];

function openGamesHub() {
  const panel = document.createElement('div');
  panel.className = 'app-panel';
  panel.innerHTML = `<h2>🎮 Jogos</h2><div class="hub-grid" id="games-hub-grid"></div>`;
  const grid = panel.querySelector('#games-hub-grid');
  GAMES_CATALOG.forEach(g => {
    const card = document.createElement('div');
    card.className = 'hub-card';
    card.innerHTML = `<span class="hc-emoji">${g.emoji}</span><div class="hc-title">${g.title}</div><div class="hc-sub">${g.sub}</div>`;
    card.addEventListener('click', () => {
      soundManager.click();
      windowManager.open({ appId: 'game-' + g.id, title: g.title, icon: g.emoji, contentEl: g.open(), width: g.w || 520, height: g.h || 480, singleton: true });
    });
    grid.appendChild(card);
  });
  return panel;
}
