/* Anne OS Kids - Paciencia de Baralho (Klondike) */

const SOLITAIRE_SUITS = [
  { symbol: '♥', name: 'copas', color: 'red' },
  { symbol: '♦', name: 'ouros', color: 'red' },
  { symbol: '♣', name: 'paus', color: 'black' },
  { symbol: '♠', name: 'espadas', color: 'black' }
];
const SOLITAIRE_RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function openSolitaireGame() {
  const panel = document.createElement('div');
  panel.className = 'app-panel solitaire-panel';
  panel.innerHTML = `
    <h2>🃏 Paciência de Baralho</h2>
    <div class="solitaire-hud">
      <span id="sol-score">Pontos: 0</span>
      <span id="sol-moves">Jogadas: 0</span>
      <span id="sol-status">Selecione uma carta</span>
      <button id="sol-new" class="btn-secondary">🔄 Novo jogo</button>
    </div>
    <div class="solitaire-top">
      <button id="sol-stock" class="sol-card sol-back" title="Comprar carta">↥</button>
      <div id="sol-waste" class="sol-slot"></div>
      <div class="sol-foundations" id="sol-foundations"></div>
    </div>
    <div class="sol-tableau" id="sol-tableau"></div>
    <p id="sol-win" class="pz-win" style="display:none;">🎉 Você venceu a Paciência! 🎉</p>
  `;
  setTimeout(() => initSolitaireGame(panel), 0);
  return panel;
}

function initSolitaireGame(panel) {
  const stockEl = panel.querySelector('#sol-stock');
  const wasteEl = panel.querySelector('#sol-waste');
  const foundationsEl = panel.querySelector('#sol-foundations');
  const tableauEl = panel.querySelector('#sol-tableau');
  const scoreEl = panel.querySelector('#sol-score');
  const movesEl = panel.querySelector('#sol-moves');
  const statusEl = panel.querySelector('#sol-status');
  const winEl = panel.querySelector('#sol-win');

  let stock = [], waste = [], foundations = [], tableau = [];
  let selected = null;
  let score = 0, moves = 0, won = false;

  function makeDeck() {
    const deck = [];
    SOLITAIRE_SUITS.forEach((suit, suitIndex) => {
      for (let rank = 1; rank <= 13; rank++) deck.push({ id: suitIndex + '-' + rank, suit: suitIndex, rank, faceUp: false });
    });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  function newGame() {
    const deck = makeDeck();
    stock = []; waste = []; foundations = [[], [], [], []]; tableau = Array.from({ length: 7 }, () => []);
    selected = null; score = 0; moves = 0; won = false;
    winEl.style.display = 'none';
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        const card = deck.pop();
        card.faceUp = row === col;
        tableau[col].push(card);
      }
    }
    stock = deck;
    render();
  }

  function cardLabel(card) {
    const suit = SOLITAIRE_SUITS[card.suit];
    return `${SOLITAIRE_RANKS[card.rank]}${suit.symbol}`;
  }

  function createCard(card, location, index) {
    const button = document.createElement('button');
    button.className = 'sol-card' + (card.faceUp ? ' sol-face-up ' + SOLITAIRE_SUITS[card.suit].color : ' sol-face-down');
    button.dataset.location = location;
    button.dataset.index = index;
    if (card.faceUp) {
      button.innerHTML = `<span class="sol-corner-rank">${SOLITAIRE_RANKS[card.rank]}<small>${SOLITAIRE_SUITS[card.suit].symbol}</small></span><strong>${SOLITAIRE_SUITS[card.suit].symbol}</strong>`;
      button.title = `Carta ${cardLabel(card)}`;
    } else {
      button.textContent = '✦';
      button.title = 'Carta virada';
    }
    button.addEventListener('click', () => handleCardClick(location, index));
    return button;
  }

  function render() {
    scoreEl.textContent = 'Pontos: ' + score;
    movesEl.textContent = 'Jogadas: ' + moves;
    statusEl.textContent = selected ? 'Escolha o destino' : 'Selecione uma carta';
    stockEl.textContent = stock.length ? '↥' : '↻';
    wasteEl.innerHTML = '';
    if (waste.length) wasteEl.appendChild(createCard(waste[waste.length - 1], 'waste', waste.length - 1));
    foundationsEl.innerHTML = '';
    foundations.forEach((pile, suitIndex) => {
      const slot = document.createElement('button');
      slot.className = 'sol-slot sol-foundation';
      slot.dataset.suit = suitIndex;
      slot.textContent = pile.length ? cardLabel(pile[pile.length - 1]) : SOLITAIRE_SUITS[suitIndex].symbol;
      slot.classList.add(SOLITAIRE_SUITS[suitIndex].color);
      slot.addEventListener('click', () => handleFoundationClick(suitIndex));
      foundationsEl.appendChild(slot);
    });
    tableauEl.innerHTML = '';
    tableau.forEach((column, colIndex) => {
      const columnEl = document.createElement('div');
      columnEl.className = 'sol-column';
      columnEl.dataset.column = colIndex;
      column.forEach((card, cardIndex) => {
        const cardEl = createCard(card, 'tableau-' + colIndex, cardIndex);
        cardEl.style.top = (cardIndex * 26) + 'px';
        if (selected && selected.location === 'tableau-' + colIndex && cardIndex >= selected.index) cardEl.classList.add('sol-selected');
        columnEl.appendChild(cardEl);
      });
      columnEl.addEventListener('click', (event) => {
        if (event.target === columnEl) handleTableauDestination(colIndex);
      });
      tableauEl.appendChild(columnEl);
    });
  }

  function isDescendingAlternating(cards) {
    for (let i = 1; i < cards.length; i++) {
      if (!cards[i].faceUp || cards[i - 1].rank !== cards[i].rank + 1 || SOLITAIRE_SUITS[cards[i - 1].suit].color === SOLITAIRE_SUITS[cards[i].suit].color) return false;
    }
    return cards[0].faceUp;
  }

  function getSelectedCards() {
    if (!selected) return [];
    if (selected.location === 'waste') return waste.length ? [waste[waste.length - 1]] : [];
    const col = Number(selected.location.split('-')[1]);
    return tableau[col].slice(selected.index);
  }

  function removeSelected() {
    if (selected.location === 'waste') return waste.pop();
    const col = Number(selected.location.split('-')[1]);
    const cards = tableau[col].splice(selected.index);
    const last = tableau[col][tableau[col].length - 1];
    if (last && !last.faceUp) { last.faceUp = true; score += 5; }
    return cards;
  }

  function handleCardClick(location, index) {
    if (won) return;
    const cards = location === 'waste' ? waste : tableau[Number(location.split('-')[1])];
    const card = cards[index];
    if (!card || !card.faceUp) return;
    if (selected) {
      if (selected.location === location && selected.index === index) { selected = null; render(); return; }
      if (location.startsWith('tableau-') && isDescendingAlternating(cards.slice(index))) {
        handleTableauDestination(Number(location.split('-')[1]));
        if (selected) return;
      }
    }
    if (location === 'waste' || isDescendingAlternating(cards.slice(index))) selected = { location, index };
    render();
  }

  function canPlaceOnTableau(card, column) {
    const top = column[column.length - 1];
    return !top ? card.rank === 13 : top.faceUp && top.rank === card.rank + 1 && SOLITAIRE_SUITS[top.suit].color !== SOLITAIRE_SUITS[card.suit].color;
  }

  function handleTableauDestination(colIndex) {
    if (!selected) return;
    const cards = getSelectedCards();
    if (!cards.length || !isDescendingAlternating(cards) || !canPlaceOnTableau(cards[0], tableau[colIndex])) return;
    const source = selected.location;
    const moved = removeSelected();
    tableau[colIndex].push(...(Array.isArray(moved) ? moved : [moved]));
    moves++; score += 5; selected = null; render(); checkWin();
    if (source === 'waste') soundManager.success(); else soundManager.click();
  }

  function handleFoundationClick(suitIndex) {
    if (!selected) return;
    const cards = getSelectedCards();
    if (cards.length !== 1 || cards[0].suit !== suitIndex) return;
    const card = cards[0], pile = foundations[suitIndex];
    if ((pile.length === 0 && card.rank !== 1) || (pile.length && card.rank !== pile[pile.length - 1].rank + 1)) return;
    removeSelected(); foundations[suitIndex].push(card); moves++; score += 10; selected = null; render(); checkWin(); soundManager.success();
  }

  stockEl.addEventListener('click', () => {
    if (won) return;
    selected = null;
    if (stock.length) { const card = stock.pop(); card.faceUp = true; waste.push(card); score = Math.max(0, score - 1); }
    else { stock = waste.reverse(); waste = []; stock.forEach(card => { card.faceUp = false; }); }
    moves++; render(); soundManager.click();
  });

  panel.querySelector('#sol-new').addEventListener('click', () => { soundManager.click(); newGame(); });

  function checkWin() {
    if (foundations.every(pile => pile.length === 13)) {
      won = true; winEl.style.display = 'block'; score += 100; render(); soundManager.success();
      if (userManager && userManager.currentUser) {
        userManager.saveGameResult('paciencia', score).then(async () => {
          await userManager.addStars(8);
          await achievementManager.checkAndUnlock();
        });
      }
    }
  }

  newGame();
  panel._cleanup = () => {};
}
