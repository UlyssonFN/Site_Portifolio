/* ==========================================================================
   Anne OS Kids — games/pickupSticks.js
   🥢 Pega-Vareta (Mikado simplificado) — remova a vareta de cima sem errar
   ========================================================================== */

const STICK_COLORS = ['#ff6f6f', '#4fc3f7', '#6fdc8c', '#ffd166', '#8c6fff', '#ff9f6f', '#ff6fa5'];

function openPickupSticksGame() {
  const panel = document.createElement('div');
  panel.className = 'app-panel';
  panel.innerHTML = `
    <h2 style="text-align:center;">🥢 Pega-Vareta</h2>
    <p style="text-align:center;color:#888;font-size:.82rem;">Clique sempre na vareta que está por CIMA das outras. Errar custa uma vida!</p>
    <div class="game-header"><span id="ps-lives">❤️❤️❤️</span><span class="gh-score" id="ps-score">Varetas: 0</span></div>
    <div class="sticks-area" id="sticks-area"></div>
    <div class="quiz-feedback" id="ps-feedback" style="text-align:center;"></div>
    <div style="text-align:center;margin-top:.5rem;"><button class="music-btn" id="ps-restart">🔁 Novo jogo</button></div>
  `;
  setTimeout(() => initPickupSticks(panel), 0);
  return panel;
}

function initPickupSticks(panel) {
  const area = panel.querySelector('#sticks-area');
  const livesEl = panel.querySelector('#ps-lives');
  const scoreEl = panel.querySelector('#ps-score');
  const feedbackEl = panel.querySelector('#ps-feedback');
  let sticks = [], lives = 3, removed = 0, over = false;

  function generateSticks() {
    const w = area.clientWidth || 400, h = area.clientHeight || 320;
    const count = 18;
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push({
        id: i,
        layer: i,
        x: 20 + Math.random() * (w - 60),
        y: 20 + Math.random() * (h - 60),
        angle: Math.random() * 180,
        length: 70 + Math.random() * 60,
        color: STICK_COLORS[i % STICK_COLORS.length],
        removed: false
      });
    }
    return list;
  }

  function stickEndpoints(stick) {
    const angle = stick.angle * Math.PI / 180;
    const halfLength = stick.length / 2;
    const centerX = stick.x + halfLength;
    const centerY = stick.y + 5;
    const offsetX = Math.cos(angle) * halfLength;
    const offsetY = Math.sin(angle) * halfLength;
    return [
      { x: centerX - offsetX, y: centerY - offsetY },
      { x: centerX + offsetX, y: centerY + offsetY }
    ];
  }

  function segmentDistance(first, second) {
    const firstStart = first.start;
    const firstEnd = first.end;
    const secondStart = second.start;
    const secondEnd = second.end;
    const firstVectorX = firstEnd.x - firstStart.x;
    const firstVectorY = firstEnd.y - firstStart.y;
    const secondVectorX = secondEnd.x - secondStart.x;
    const secondVectorY = secondEnd.y - secondStart.y;
    const denominator = firstVectorX * secondVectorY - firstVectorY * secondVectorX;

    if (denominator) {
      const startDifferenceX = secondStart.x - firstStart.x;
      const startDifferenceY = secondStart.y - firstStart.y;
      const firstPosition = (startDifferenceX * secondVectorY - startDifferenceY * secondVectorX) / denominator;
      const secondPosition = (startDifferenceX * firstVectorY - startDifferenceY * firstVectorX) / denominator;
      if (firstPosition >= 0 && firstPosition <= 1 && secondPosition >= 0 && secondPosition <= 1) return 0;
    }

    function pointToSegmentDistance(point, start, end) {
      const segmentX = end.x - start.x;
      const segmentY = end.y - start.y;
      const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;
      const position = segmentLengthSquared ? Math.max(0, Math.min(1,
        ((point.x - start.x) * segmentX + (point.y - start.y) * segmentY) / segmentLengthSquared
      )) : 0;
      return Math.hypot(point.x - (start.x + position * segmentX), point.y - (start.y + position * segmentY));
    }

    return Math.min(
      pointToSegmentDistance(firstStart, secondStart, secondEnd),
      pointToSegmentDistance(firstEnd, secondStart, secondEnd),
      pointToSegmentDistance(secondStart, firstStart, firstEnd),
      pointToSegmentDistance(secondEnd, firstStart, firstEnd)
    );
  }

  function isFree(stick) {
    const endpoints = stickEndpoints(stick);
    return !sticks.some(other => {
      if (other.removed || other.layer <= stick.layer) return false;
      const otherEndpoints = stickEndpoints(other);
      return segmentDistance(
        { start: endpoints[0], end: endpoints[1] },
        { start: otherEndpoints[0], end: otherEndpoints[1] }
      ) <= 10;
    });
  }

  function render() {
    area.innerHTML = '';
    sticks.forEach(s => {
      if (s.removed) return;
      const div = document.createElement('div');
      div.className = 'stick';
      div.style.left = s.x + 'px';
      div.style.top = s.y + 'px';
      div.style.width = s.length + 'px';
      div.style.background = s.color;
      div.style.transform = `rotate(${s.angle}deg)`;
      div.style.zIndex = s.layer;
      div.addEventListener('click', () => handlePick(s));
      area.appendChild(div);
    });
    livesEl.textContent = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives);
    scoreEl.textContent = 'Varetas: ' + removed;
  }

  async function handlePick(stick) {
    if (over) return;
    if (isFree(stick)) {
      stick.removed = true;
      removed++;
      soundManager.tone(700 + removed * 15, 0.15, 'triangle', 0.4);
      feedbackEl.textContent = '✅ Boa! Continue com cuidado...';
      render();
      if (removed === sticks.length) await finish(true);
    } else {
      lives--;
      soundManager.error();
      feedbackEl.textContent = '😬 Ops! Essa não estava livre.';
      render();
      if (lives <= 0) await finish(false);
    }
  }

  async function finish(won) {
    over = true;
    feedbackEl.textContent = won ? `🏆 Uau! Você removeu todas as ${sticks.length} varetas!` : `🏁 Fim de jogo! Você removeu ${removed} varetas.`;
    soundManager[won ? 'success' : 'error']();
    if (userManager.currentUser) {
      await db.add('games', { usuario_id: userManager.currentUser.id, jogo: 'pega-vareta', pontuacao: removed * 5, data: new Date().toISOString() });
      await userManager.incGamesPlayed();
      if (won) await userManager.addStars(8); else await userManager.addStars(2);
      await achievementManager.checkAndUnlock();
    }
  }

  function reset() {
    sticks = generateSticks();
    lives = 3; removed = 0; over = false;
    feedbackEl.textContent = '';
    render();
  }

  panel.querySelector('#ps-restart').addEventListener('click', () => { soundManager.click(); reset(); });
  setTimeout(reset, 30);
}
