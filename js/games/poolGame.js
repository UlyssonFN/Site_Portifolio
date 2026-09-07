/* ==========================================================================
   Anne OS Kids — poolGame.js
   Sinuquinha: bilhar simplificado para crianças, jogador vs computador
   ========================================================================== */

const POOL_COLORS = ['#ff6f6f', '#ff9f6f', '#ffd166', '#6fdc8c', '#4fc3f7', '#8c6fff'];

function openPoolApp() {
  const panel = document.createElement('div');
  panel.className = 'app-panel pool-panel';
  panel.innerHTML = `
    <h2>🎱 Sinuquinha</h2>
    <div class="pool-hud">
      <span id="pool-score-player">🧒 Você: 0</span>
      <span id="pool-turn">Sua vez!</span>
      <span id="pool-score-cpu">🤖 Computador: 0</span>
    </div>
    <div class="pool-canvas-wrap">
      <canvas id="pool-canvas" width="380" height="230"></canvas>
    </div>
    <p class="blk-hint">👉 Arraste a bola branca para trás e solte para jogar</p>
    <p id="pool-msg" class="pz-win" style="display:none;"></p>
    <div style="text-align:center;"><button id="pool-new" class="btn-secondary">🔄 Novo jogo</button></div>
  `;
  setTimeout(() => initPoolApp(panel), 0);
  return panel;
}

function initPoolApp(panel) {
  const canvas = panel.querySelector('#pool-canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const left = 16, top = 16, right = W - 16, bottom = H - 16;
  const R = 8;
  const pockets = [
    { x: left, y: top }, { x: (left + right) / 2, y: top - 2 }, { x: right, y: top },
    { x: left, y: bottom }, { x: (left + right) / 2, y: bottom + 2 }, { x: right, y: bottom }
  ].map(p => ({ x: p.x, y: p.y, r: 13 }));

  let balls = [];
  let turn = 'player';
  let shotBy = 'player';
  let aiming = false;
  let aimStart = null;
  let running = true;
  let gameOver = false;
  let wasMoving = false;
  let pottedThisShot = false;
  let scorePlayer = 0, scoreCpu = 0;

  const turnEl = panel.querySelector('#pool-turn');
  const scorePlayerEl = panel.querySelector('#pool-score-player');
  const scoreCpuEl = panel.querySelector('#pool-score-cpu');
  const msgEl = panel.querySelector('#pool-msg');

  function setup() {
    balls = [];
    balls.push({ id: 'cue', isCue: true, x: left + 60, y: (top + bottom) / 2, vx: 0, vy: 0, r: R, color: '#ffffff', potted: false });
    let n = 1;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col <= row; col++) {
        if (n > 6) break;
        balls.push({
          id: 'b' + n, isCue: false, num: n,
          x: right - 70 + row * 18,
          y: (top + bottom) / 2 - row * 9 + col * 18,
          vx: 0, vy: 0, r: R, color: POOL_COLORS[n - 1], potted: false
        });
        n++;
      }
    }
    turn = 'player'; shotBy = 'player'; gameOver = false; pottedThisShot = false;
    scorePlayer = 0; scoreCpu = 0;
    updateHud();
    msgEl.style.display = 'none';
  }

  function updateHud() {
    scorePlayerEl.textContent = '🧒 Você: ' + scorePlayer;
    scoreCpuEl.textContent = '🤖 Computador: ' + scoreCpu;
    turnEl.textContent = gameOver ? 'Fim de jogo' : (turn === 'player' ? 'Sua vez! 🎯' : 'Vez do computador 🤖');
  }

  function anyMoving() {
    return balls.some(b => !b.potted && (Math.abs(b.vx) > 0.02 || Math.abs(b.vy) > 0.02));
  }

  function pot(b) {
    b.potted = true;
    if (b.isCue) {
      soundManager.error();
      setTimeout(() => { b.x = left + 60; b.y = (top + bottom) / 2; b.vx = 0; b.vy = 0; b.potted = false; }, 10);
    } else {
      soundManager.starGain();
      if (shotBy === 'player') scorePlayer += 10; else scoreCpu += 10;
      pottedThisShot = true;
      updateHud();
    }
  }

  function step(dt) {
    balls.forEach(b => {
      if (b.potted) return;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x - b.r < left) { b.x = left + b.r; b.vx *= -0.9; }
      if (b.x + b.r > right) { b.x = right - b.r; b.vx *= -0.9; }
      if (b.y - b.r < top) { b.y = top + b.r; b.vy *= -0.9; }
      if (b.y + b.r > bottom) { b.y = bottom - b.r; b.vy *= -0.9; }
      b.vx *= 0.986; b.vy *= 0.986;
      if (Math.hypot(b.vx, b.vy) < 0.03) { b.vx = 0; b.vy = 0; }
    });
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const a = balls[i], b = balls[j];
        if (a.potted || b.potted) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0 && dist < a.r + b.r) {
          const nx = dx / dist, ny = dy / dist;
          const overlap = (a.r + b.r - dist) / 2;
          a.x -= nx * overlap; a.y -= ny * overlap;
          b.x += nx * overlap; b.y += ny * overlap;
          const avn = a.vx * nx + a.vy * ny;
          const bvn = b.vx * nx + b.vy * ny;
          a.vx += (bvn - avn) * nx; a.vy += (bvn - avn) * ny;
          b.vx += (avn - bvn) * nx; b.vy += (avn - bvn) * ny;
          soundManager.click();
        }
      }
    }
    balls.forEach(b => {
      if (b.potted) return;
      pockets.forEach(p => { if (!b.potted && Math.hypot(b.x - p.x, b.y - p.y) < p.r) pot(b); });
    });
  }

  function remainingObjectBalls() { return balls.filter(b => !b.isCue && !b.potted).length; }

  function onAllStopped() {
    if (gameOver) return;
    if (remainingObjectBalls() === 0) { endGame(); return; }
    if (pottedThisShot) {
      pottedThisShot = false;
      turn = shotBy;
      updateHud();
      if (turn === 'cpu') setTimeout(cpuShoot, 800);
      return;
    }
    turn = turn === 'player' ? 'cpu' : 'player';
    shotBy = turn;
    updateHud();
    if (turn === 'cpu') setTimeout(cpuShoot, 800);
  }

  async function endGame() {
    gameOver = true;
    updateHud();
    let text;
    if (scorePlayer > scoreCpu) text = '🎉 Você venceu o computador! 🎉';
    else if (scoreCpu > scorePlayer) text = '🤖 O computador venceu desta vez!';
    else text = 'Empate! Jogo equilibrado 🤝';
    msgEl.textContent = text;
    msgEl.style.display = 'block';
    if (window.userManager && userManager.currentUser) {
      await userManager.saveGameResult('sinuca', scorePlayer);
      if (scorePlayer > scoreCpu) {
        await userManager.saveGameResult('sinuca-vitoria', scorePlayer);
        await userManager.addStars(8);
      } else {
        await userManager.addStars(2);
      }
      if (window.achievementManager) await achievementManager.checkAndUnlock();
    }
  }

  function cpuShoot() {
    if (gameOver) return;
    pottedThisShot = false;
    const cue = balls.find(b => b.isCue);
    const targets = balls.filter(b => !b.isCue && !b.potted);
    if (!targets.length) return;
    let best = null, bestScore = Infinity;
    targets.forEach(t => {
      pockets.forEach(p => {
        const d = Math.hypot(t.x - p.x, t.y - p.y);
        if (d < bestScore) { bestScore = d; best = { t, p }; }
      });
    });
    const dirToPocket = { x: best.p.x - best.t.x, y: best.p.y - best.t.y };
    const dLen = Math.hypot(dirToPocket.x, dirToPocket.y) || 1;
    const ghost = { x: best.t.x - (dirToPocket.x / dLen) * (R * 2), y: best.t.y - (dirToPocket.y / dLen) * (R * 2) };
    let aimX = ghost.x - cue.x, aimY = ghost.y - cue.y;
    const noise = (Math.random() - 0.5) * 0.25;
    const cos = Math.cos(noise), sin = Math.sin(noise);
    const rx = aimX * cos - aimY * sin, ry = aimX * sin + aimY * cos;
    const len = Math.hypot(rx, ry) || 1;
    const power = 5.5 + Math.random() * 2.5;
    cue.vx = (rx / len) * power;
    cue.vy = (ry / len) * power;
    soundManager.click();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#3d9c5c';
    ctx.fillRect(left - 4, top - 4, right - left + 8, bottom - top + 8);
    ctx.strokeStyle = '#7a4a2b'; ctx.lineWidth = 10;
    ctx.strokeRect(left - 4, top - 4, right - left + 8, bottom - top + 8);
    pockets.forEach(p => { ctx.fillStyle = '#1c1245'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); });

    if (aiming && aimStart) {
      const cue = balls.find(b => b.isCue);
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(cue.x, cue.y);
      ctx.lineTo(cue.x - (aimStart.dx), cue.y - (aimStart.dy));
      ctx.stroke(); ctx.setLineDash([]);
    }

    balls.forEach(b => {
      if (b.potted) return;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = b.color; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = '#3a2a55'; ctx.stroke();
      if (!b.isCue) {
        ctx.fillStyle = '#fff'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(b.num, b.x, b.y + 3);
      }
    });
  }

  let lastT = 0;
  function loop(t) {
    if (!running) return;
    const dt = lastT ? Math.min(t - lastT, 32) / 16 : 1;
    lastT = t;
    const moving = anyMoving();
    if (moving) step(dt);
    if (wasMoving && !moving) onAllStopped();
    wasMoving = moving;
    draw();
    requestAnimationFrame(loop);
  }

  function canPlayerAim() { return turn === 'player' && !gameOver && !anyMoving(); }

  canvas.addEventListener('pointerdown', (e) => {
    if (!canPlayerAim()) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    pottedThisShot = false;
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width, scaleY = H / rect.height;
    const px = (e.clientX - rect.left) * scaleX, py = (e.clientY - rect.top) * scaleY;
    aiming = true;
    aimStart = { px, py, dx: 0, dy: 0 };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!aiming) return;
    e.preventDefault();
    const cue = balls.find(b => b.isCue);
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width, scaleY = H / rect.height;
    const px = (e.clientX - rect.left) * scaleX, py = (e.clientY - rect.top) * scaleY;
    aimStart.dx = px - cue.x; aimStart.dy = py - cue.y;
  });
  function releaseAim(e) {
    if (!aiming) return;
    if (e && e.pointerId !== undefined && canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    aiming = false;
    const cue = balls.find(b => b.isCue);
    const dx = aimStart.dx, dy = aimStart.dy;
    const dist = Math.min(Math.hypot(dx, dy), 70);
    if (dist > 6) {
      const power = (dist / 70) * 9;
      cue.vx = -(dx / Math.hypot(dx, dy)) * power;
      cue.vy = -(dy / Math.hypot(dx, dy)) * power;
      soundManager.click();
    }
    aimStart = null;
  }

  canvas.addEventListener('pointerup', releaseAim);
  canvas.addEventListener('pointercancel', releaseAim);

  panel.querySelector('#pool-new').addEventListener('click', () => { soundManager.click(); setup(); });

  setup();
  requestAnimationFrame(loop);
  panel._cleanup = () => { running = false; };
}
