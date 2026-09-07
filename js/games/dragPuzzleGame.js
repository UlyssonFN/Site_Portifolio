/* ==========================================================================
   Anne OS Kids — dragPuzzleGame.js
   Quebra-Cabeça Fácil: arraste cada peça e solte no lugar certo (drag & drop)
   Reaproveita as cenas (PUZZLE_SCENES) definidas em puzzleGame.js
   ========================================================================== */

function openDragPuzzleApp() {
  const panel = document.createElement('div');
  panel.className = 'app-panel dp-panel';
  panel.innerHTML = `
    <h2>🧩 Quebra-Cabeça Fácil</h2>
    <div class="dp-toolbar">
      <div class="dp-scenes" id="dp-scenes"></div>
      <span id="dp-progress">0/9 encaixadas</span>
      <span id="dp-score">Pontos: 0</span>
      <button id="dp-reset" class="btn-secondary">🔄 Novo jogo</button>
    </div>
    <div class="dp-board" id="dp-board">
      <div class="dp-frame" id="dp-frame"></div>
      <div class="dp-tray" id="dp-tray"></div>
    </div>
    <p id="dp-win" class="pz-win" style="display:none;">🎉 Você completou o quebra-cabeça! 🎉</p>
  `;
  setTimeout(() => initDragPuzzleApp(panel), 0);
  return panel;
}

function initDragPuzzleApp(panel) {
  const N = 3;
  let sceneIdx = 0;
  let imgData = '';
  let placed = 0;
  let score = 0;
  let completed = false;

  const scenesWrap = panel.querySelector('#dp-scenes');
  PUZZLE_SCENES.forEach((sc, i) => {
    const b = document.createElement('button');
    b.className = 'pz-scene-btn' + (i === 0 ? ' selected' : '');
    b.textContent = sc.label;
    b.addEventListener('click', () => {
      soundManager.click();
      sceneIdx = i;
      scenesWrap.querySelectorAll('.pz-scene-btn').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      newGame();
    });
    scenesWrap.appendChild(b);
  });

  panel.querySelector('#dp-reset').addEventListener('click', () => { soundManager.click(); newGame(); });

  function genImage() {
    const c = document.createElement('canvas');
    c.width = 360; c.height = 360;
    PUZZLE_SCENES[sceneIdx].draw(c.getContext('2d'), 360);
    imgData = c.toDataURL();
  }

  function newGame() {
    genImage();
    placed = 0;
    score = 0;
    completed = false;
    panel.querySelector('#dp-progress').textContent = `0/${N * N} encaixadas`;
    panel.querySelector('#dp-score').textContent = 'Pontos: 0';
    panel.querySelector('#dp-win').style.display = 'none';

    const frame = panel.querySelector('#dp-frame');
    const tray = panel.querySelector('#dp-tray');
    panel.querySelectorAll('.dp-piece').forEach(piece => piece.remove());
    frame.innerHTML = ''; tray.innerHTML = '';
    frame.style.gridTemplateColumns = `repeat(${N}, 1fr)`;

    for (let i = 0; i < N * N; i++) {
      const slot = document.createElement('div');
      slot.className = 'dp-slot';
      slot.dataset.index = i;
      frame.appendChild(slot);
    }

    const order = Array.from({ length: N * N }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    order.forEach(idx => {
      const row = Math.floor(idx / N), col = idx % N;
      const piece = document.createElement('div');
      piece.className = 'dp-piece';
      piece.dataset.index = idx;
      piece.style.backgroundImage = `url(${imgData})`;
      piece.style.backgroundSize = `${N * 100}% ${N * 100}%`;
      piece.style.backgroundPosition = `${(col / (N - 1)) * 100}% ${(row / (N - 1)) * 100}%`;
      bindDrag(piece);
      tray.appendChild(piece);
    });
  }

  function bindDrag(piece) {
    let dragging = false, offX = 0, offY = 0;
    const board = panel.querySelector('#dp-board');
    const frame = panel.querySelector('#dp-frame');

    piece.addEventListener('pointerdown', (e) => {
      if (piece.classList.contains('locked')) return;
      const rect = piece.getBoundingClientRect();
      const boardRect = board.getBoundingClientRect();
      piece.style.width = rect.width + 'px';
      piece.style.height = rect.height + 'px';
      piece.style.position = 'absolute';
      piece.style.left = (rect.left - boardRect.left) + 'px';
      piece.style.top = (rect.top - boardRect.top) + 'px';
      piece.style.zIndex = 1000;
      board.appendChild(piece);
      offX = e.clientX - rect.left;
      offY = e.clientY - rect.top;
      dragging = true;
      piece.setPointerCapture(e.pointerId);
      soundManager.click();
    });

    piece.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const boardRect = board.getBoundingClientRect();
      piece.style.left = (e.clientX - boardRect.left - offX) + 'px';
      piece.style.top = (e.clientY - boardRect.top - offY) + 'px';
    });

    piece.addEventListener('pointerup', (e) => {
      if (!dragging) return;
      dragging = false;
      piece.releasePointerCapture(e.pointerId);
      piece.style.zIndex = 10;

      const pRect = piece.getBoundingClientRect();
      const pCenter = { x: pRect.left + pRect.width / 2, y: pRect.top + pRect.height / 2 };
      const slots = frame.querySelectorAll('.dp-slot');
      let bestSlot = null, bestDist = Infinity;
      slots.forEach(slot => {
        const sRect = slot.getBoundingClientRect();
        const sCenter = { x: sRect.left + sRect.width / 2, y: sRect.top + sRect.height / 2 };
        const dist = Math.hypot(pCenter.x - sCenter.x, pCenter.y - sCenter.y);
        if (dist < bestDist) { bestDist = dist; bestSlot = { el: slot, rect: sRect }; }
      });

      if (bestSlot && bestDist < bestSlot.rect.width * 0.55 && bestSlot.el.dataset.index === piece.dataset.index && !bestSlot.el.dataset.filled) {
        const boardRect = board.getBoundingClientRect();
        piece.style.left = (bestSlot.rect.left - boardRect.left) + 'px';
        piece.style.top = (bestSlot.rect.top - boardRect.top) + 'px';
        piece.style.width = bestSlot.rect.width + 'px';
        piece.style.height = bestSlot.rect.height + 'px';
        piece.classList.add('locked');
        bestSlot.el.dataset.filled = '1';
        soundManager.success();
        placed++;
        panel.querySelector('#dp-progress').textContent = `${placed}/${N * N} encaixadas`;
        if (placed === N * N && !completed) onWin();
      }
    });
  }

  async function onWin() {
    completed = true;
    score = 100;
    panel.querySelector('#dp-score').textContent = 'Pontos: ' + score;
    panel.querySelector('#dp-win').style.display = 'block';
    soundManager.success();
    if (userManager && userManager.currentUser) {
      await userManager.saveGameResult('quebra-cabeca-arraste', score);
      await userManager.addStars(4);
      await achievementManager.checkAndUnlock();
    }
  }

  newGame();
  panel._cleanup = () => {};
}
