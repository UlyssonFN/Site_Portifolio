/* ==========================================================================
   Anne OS Kids — games/carRace.js
   🏎️ Corrida de Carrinho — desvie dos obstáculos nas 3 faixas
   ========================================================================== */

function openCarRaceGame() {
  const panel = document.createElement('div');
  panel.className = 'app-panel';
  panel.style.padding = '.5rem';
  panel.innerHTML = `
    <h2 style="text-align:center;margin:.2rem 0;">🏎️ Corrida de Carrinho</h2>
    <div class="game-header"><span id="race-score">Distância: 0m</span><span class="gh-score" id="race-best">Recorde: 0m</span></div>
    <div class="race-wrap">
      <canvas id="race-canvas"></canvas>
      <div class="race-overlay" id="race-overlay">
        <button class="btn-primary" id="race-start">🚦 Começar corrida</button>
      </div>
    </div>
    <div class="dpad" id="race-dpad">
      <div><button data-d="left">⬅️</button><button data-d="right">➡️</button></div>
    </div>
    <p style="text-align:center;color:#888;font-size:.78rem;">Use as setas ⬅️➡️ ou os botões para trocar de faixa</p>
  `;
  setTimeout(() => initCarRace(panel), 0);
  return panel;
}

async function initCarRace(panel) {
  const canvas = panel.querySelector('#race-canvas');
  const ctx = canvas.getContext('2d');
  const overlay = panel.querySelector('#race-overlay');
  const startBtn = panel.querySelector('#race-start');
  const scoreEl = panel.querySelector('#race-score');
  const bestEl = panel.querySelector('#race-best');

  function resize() { canvas.width = canvas.parentElement.clientWidth; canvas.height = canvas.parentElement.clientHeight; }
  resize();
  window.addEventListener('resize', resize);

  let best = userManager.currentUser ? await userManager.getBestScore('corrida-carrinho') : 0;
  bestEl.textContent = 'Recorde: ' + best + 'm';

  const LANES = 3;
  let lane = 1, obstacles = [], distance = 0, speed = 3.2, running = false, raf = null, lastSpawn = 0, elapsed = 0;

  function laneX(l) { return (canvas.width / LANES) * l + (canvas.width / LANES) / 2; }

  function reset() {
    lane = 1; obstacles = []; distance = 0; speed = 3.2; elapsed = 0;
  }

  function spawnObstacle() {
    const l = Math.floor(Math.random() * LANES);
    obstacles.push({ lane: l, y: -40 });
  }

  function draw() {
    ctx.fillStyle = '#4a4a58';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,.6)';
    ctx.setLineDash([16, 18]);
    ctx.lineWidth = 3;
    for (let l = 1; l < LANES; l++) {
      const x = (canvas.width / LANES) * l;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    ctx.setLineDash([]);

    obstacles.forEach(o => {
      ctx.font = '32px serif';
      ctx.textAlign = 'center';
      ctx.fillText('🚧', laneX(o.lane), o.y);
    });

    ctx.font = '34px serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏎️', laneX(lane), canvas.height - 40);
  }

  function loop(ts) {
    if (!running) return;
    elapsed++;
    distance = Math.floor(elapsed / 6);
    speed = 3.2 + distance / 40;
    scoreEl.textContent = 'Distância: ' + distance + 'm';

    if (elapsed - lastSpawn > Math.max(28, 60 - distance)) { spawnObstacle(); lastSpawn = elapsed; }

    obstacles.forEach(o => o.y += speed);
    obstacles = obstacles.filter(o => o.y < canvas.height + 50);

    const carY = canvas.height - 40;
    for (const o of obstacles) {
      if (o.lane === lane && Math.abs(o.y - carY) < 30) { crash(); return; }
    }

    draw();
    raf = requestAnimationFrame(loop);
  }

  async function crash() {
    running = false;
    cancelAnimationFrame(raf);
    soundManager.error();
    overlay.style.display = 'flex';
    overlay.innerHTML = `<div style="text-align:center;color:#fff;"><p style="font-size:1.3rem;font-weight:700;">💥 Bateu! Distância: ${distance}m</p><button class="btn-primary" id="race-restart">🔁 Correr de novo</button></div>`;
    panel.querySelector('#race-restart').addEventListener('click', startRace);
    if (userManager.currentUser) {
      await db.add('games', { usuario_id: userManager.currentUser.id, jogo: 'corrida-carrinho', pontuacao: distance, data: new Date().toISOString() });
      await userManager.incGamesPlayed();
      await userManager.addStars(Math.min(10, Math.max(1, Math.floor(distance / 20))));
      if (distance > best) { best = distance; bestEl.textContent = 'Recorde: ' + best + 'm'; notificationManager.record(); await userManager.addStars(10); }
      await achievementManager.checkAndUnlock();
    }
  }

  function startRace() {
    soundManager.click();
    reset();
    overlay.style.display = 'none';
    running = true;
    lastSpawn = 0;
    raf = requestAnimationFrame(loop);
  }

  function changeLane(d) {
    if (!running) return;
    if (d === 'left' && lane > 0) lane--;
    if (d === 'right' && lane < LANES - 1) lane++;
    soundManager.hover();
  }

  startBtn.addEventListener('click', startRace);
  panel.querySelector('#race-dpad').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (btn) changeLane(btn.dataset.d);
  });
  const keyHandler = (e) => {
    if (!isPanelActiveWindow(panel)) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') changeLane('left');
    if (e.key === 'ArrowRight' || e.key === 'd') changeLane('right');
  };
  document.addEventListener('keydown', keyHandler);
  panel._cleanup = () => { document.removeEventListener('keydown', keyHandler); window.removeEventListener('resize', resize); cancelAnimationFrame(raf); running = false; };

  draw();
}
