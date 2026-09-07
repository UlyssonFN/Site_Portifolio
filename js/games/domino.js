/* ==========================================================================
   Anne OS Kids — games/domino.js
   🁫 Dominó — jogo do dominó duplo-seis contra o computador
   ========================================================================== */

function dominoBuildSet() {
  const tiles = [];
  let id = 0;
  for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) tiles.push({ a, b, id: id++ });
  return tiles;
}

function dominoPipDots(n) {
  return '•'.repeat(n) || '';
}

function openDominoGame() {
  const panel = document.createElement('div');
  panel.className = 'app-panel';
  panel.innerHTML = `
    <h2 style="text-align:center;">🁫 Dominó</h2>
    <div class="game-header"><span id="dom-turn">Sua vez</span><span class="gh-score" id="dom-boneyard">Monte: 14</span></div>
    <div class="domino-train" id="dom-train"></div>
    <p style="text-align:center;color:#888;font-size:.8rem;margin:.3rem 0;">🤖 Computador: <span id="dom-bot-count">7</span> peças</p>
    <div class="quiz-feedback" id="dom-feedback" style="text-align:center;"></div>
    <div class="domino-hand" id="dom-hand"></div>
    <div style="text-align:center;margin-top:.5rem;display:flex;gap:.5rem;justify-content:center;">
      <button class="music-btn" id="dom-draw">🁢 Comprar peça</button>
      <button class="music-btn" id="dom-restart">🔁 Novo jogo</button>
    </div>
  `;
  setTimeout(() => initDomino(panel), 0);
  return panel;
}

function initDomino(panel) {
  let boneyard, playerHand, botHand, train, leftEnd, rightEnd, over, pendingTile;

  const trainEl = panel.querySelector('#dom-train');
  const handEl = panel.querySelector('#dom-hand');
  const turnEl = panel.querySelector('#dom-turn');
  const boneyardEl = panel.querySelector('#dom-boneyard');
  const botCountEl = panel.querySelector('#dom-bot-count');
  const feedbackEl = panel.querySelector('#dom-feedback');
  const drawBtn = panel.querySelector('#dom-draw');

  function isPlayable(tile) {
    return train.length === 0 || tile.a === leftEnd || tile.b === leftEnd || tile.a === rightEnd || tile.b === rightEnd;
  }
  function handHasPlayable(hand) { return hand.some(isPlayable); }

  function tileEl(tile, faceDown, inTrain) {
    const div = document.createElement('div');
    const isDouble = tile.a === tile.b;
    div.className = 'domino-tile' + (faceDown ? ' face-down' : '') + (inTrain && isDouble ? ' domino-vertical' : '');
    if (!faceDown) div.innerHTML = `<span>${tile.a}</span><span>${tile.b}</span>`;
    return div;
  }

  function renderTrain() {
    trainEl.innerHTML = '';
    if (!train.length) { trainEl.innerHTML = '<p style="color:#aaa;padding:.5rem;">Jogue a primeira peça!</p>'; return; }
    train.forEach(t => trainEl.appendChild(tileEl(t, false, true)));
  }

  function renderHand() {
    handEl.innerHTML = '';
    playerHand.forEach(tile => {
      const div = tileEl(tile);
      const playable = isPlayable(tile) && !over;
      div.classList.toggle('playable', playable);
      div.classList.toggle('disabled', !playable);
      div.addEventListener('click', () => playable && handleTilePick(tile, div));
      handEl.appendChild(div);
    });
  }

  function render() {
    renderTrain();
    renderHand();
    boneyardEl.textContent = 'Monte: ' + boneyard.length;
    botCountEl.textContent = botHand.length;
    turnEl.textContent = over ? 'Fim de jogo' : 'Sua vez 🙂';
    drawBtn.disabled = over || handHasPlayable(playerHand) || boneyard.length === 0;
  }

  function handleTilePick(tile, div) {
    const matchesLeft = tile.a === leftEnd || tile.b === leftEnd;
    const matchesRight = tile.a === rightEnd || tile.b === rightEnd;
    if (train.length === 0) { placeTile(tile, 'right'); return; }
    if (matchesLeft && matchesRight && leftEnd !== rightEnd) {
      showSidePicker(tile);
    } else if (matchesLeft) {
      placeTile(tile, 'left');
    } else if (matchesRight) {
      placeTile(tile, 'right');
    }
  }

  function showSidePicker(tile) {
    feedbackEl.innerHTML = `Jogar de qual lado? <button class="quiz-option" id="dom-side-left">⬅️ Esquerda</button> <button class="quiz-option" id="dom-side-right">➡️ Direita</button>`;
    panel.querySelector('#dom-side-left').addEventListener('click', () => { feedbackEl.innerHTML = ''; placeTile(tile, 'left'); });
    panel.querySelector('#dom-side-right').addEventListener('click', () => { feedbackEl.innerHTML = ''; placeTile(tile, 'right'); });
  }

  function placeTile(tile, side) {
    playerHand = playerHand.filter(t => t.id !== tile.id);
    if (train.length === 0) {
      train.push(tile); leftEnd = tile.a; rightEnd = tile.b;
    } else if (side === 'left') {
      const other = tile.a === leftEnd ? tile.b : tile.a;
      train.unshift({ a: other, b: leftEnd }); leftEnd = other;
    } else {
      const other = tile.a === rightEnd ? tile.b : tile.a;
      train.push({ a: rightEnd, b: other }); rightEnd = other;
    }
    soundManager.click();
    render();
    checkWin('player');
    if (!over) setTimeout(botTurn, 700);
  }

  function botTurn() {
    if (over) return;
    let tries = 0;
    while (!handHasPlayable(botHand) && boneyard.length && tries < 20) { botHand.push(boneyard.pop()); tries++; }
    const tile = botHand.find(isPlayable);
    if (!tile) { feedbackEl.textContent = '🤖 O computador passou a vez.'; render(); return; }
    botHand = botHand.filter(t => t.id !== tile.id);
    const matchesLeft = train.length && (tile.a === leftEnd || tile.b === leftEnd);
    if (train.length === 0) { train.push(tile); leftEnd = tile.a; rightEnd = tile.b; }
    else if (matchesLeft) { const other = tile.a === leftEnd ? tile.b : tile.a; train.unshift({ a: other, b: leftEnd }); leftEnd = other; }
    else { const other = tile.a === rightEnd ? tile.b : tile.a; train.push({ a: rightEnd, b: other }); rightEnd = other; }
    soundManager.tone(300, 0.15, 'square', 0.3);
    render();
    checkWin('bot');
  }

  async function checkWin(who) {
    if (playerHand.length === 0) { await finish('Você venceu o Dominó! 🎉', true); return; }
    if (botHand.length === 0) { await finish('🤖 O computador venceu desta vez!', false); return; }
    if (!boneyard.length && !handHasPlayable(playerHand) && !handHasPlayable(botHand)) {
      const pSum = playerHand.reduce((s, t) => s + t.a + t.b, 0);
      const bSum = botHand.reduce((s, t) => s + t.a + t.b, 0);
      if (pSum <= bSum) await finish(`Jogo travado! Você venceu com menos pontos (${pSum} x ${bSum}).`, true);
      else await finish(`Jogo travado! O computador venceu (${bSum} x ${pSum}).`, false);
    }
  }

  async function finish(msg, won) {
    over = true;
    feedbackEl.textContent = '🏁 ' + msg;
    soundManager[won ? 'success' : 'error']();
    if (userManager.currentUser) {
      await db.add('games', { usuario_id: userManager.currentUser.id, jogo: 'domino', pontuacao: won ? 20 : 0, data: new Date().toISOString() });
      await userManager.incGamesPlayed();
      if (won) await userManager.addStars(6);
      await achievementManager.checkAndUnlock();
    }
    render();
  }

  drawBtn.addEventListener('click', () => {
    if (boneyard.length) { playerHand.push(boneyard.pop()); soundManager.click(); }
    render();
    setTimeout(botTurn, 500);
  });

  function reset() {
    const set = shuffleArr(dominoBuildSet());
    playerHand = set.slice(0, 7);
    botHand = set.slice(7, 14);
    boneyard = set.slice(14);
    train = []; leftEnd = null; rightEnd = null; over = false;
    feedbackEl.textContent = '';
    render();
  }

  panel.querySelector('#dom-restart').addEventListener('click', () => { soundManager.click(); reset(); });
  reset();
}
