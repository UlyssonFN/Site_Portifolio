/* ==========================================================================
   Anne OS Kids — apps/calculator.js
   🧮 Anne Calculator
   ========================================================================== */

function openCalculatorApp() {
  const panel = document.createElement('div');
  panel.className = 'app-panel';
  panel.innerHTML = `
    <div class="calc-display" id="calc-display">0</div>
    <div class="calc-grid">
      <button class="calc-btn clear" data-k="C">C</button>
      <button class="calc-btn op" data-k="%">%</button>
      <button class="calc-btn op" data-k="⌫">⌫</button>
      <button class="calc-btn op" data-k="÷">÷</button>

      <button class="calc-btn" data-k="7">7</button>
      <button class="calc-btn" data-k="8">8</button>
      <button class="calc-btn" data-k="9">9</button>
      <button class="calc-btn op" data-k="×">×</button>

      <button class="calc-btn" data-k="4">4</button>
      <button class="calc-btn" data-k="5">5</button>
      <button class="calc-btn" data-k="6">6</button>
      <button class="calc-btn op" data-k="-">-</button>

      <button class="calc-btn" data-k="1">1</button>
      <button class="calc-btn" data-k="2">2</button>
      <button class="calc-btn" data-k="3">3</button>
      <button class="calc-btn op" data-k="+">+</button>

      <button class="calc-btn" data-k="0">0</button>
      <button class="calc-btn" data-k=",">,</button>
      <button class="calc-btn eq" data-k="=">=</button>
    </div>
    <div class="calc-history" id="calc-history"></div>
  `;
  setTimeout(() => initCalculator(panel), 0);
  return panel;
}

async function initCalculator(panel) {
  const display = panel.querySelector('#calc-display');
  const historyEl = panel.querySelector('#calc-history');
  let expr = '';
  let history = [];

  if (userManager.currentUser) {
    const games = await db.getByIndex('games', 'usuario_id', userManager.currentUser.id);
    history = games.filter(g => g.jogo === 'calculadora').slice(-8).reverse().map(g => g.calc);
  }
  renderHistory();

  function renderHistory() {
    historyEl.innerHTML = history.map(h => `<div>${h}</div>`).join('');
  }

  function toEvalExpr(s) {
    return s.replace(/×/g, '*').replace(/÷/g, '/').replace(/,/g, '.').replace(/%/g, '/100');
  }

  function safeEval(s) {
    if (!/^[0-9+\-*/.() ]+$/.test(s)) return null;
    try {
      // eslint-disable-next-line no-new-func
      const result = Function('"use strict"; return (' + s + ')')();
      return Number.isFinite(result) ? result : null;
    } catch (e) { return null; }
  }

  panel.querySelectorAll('.calc-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      soundManager.click();
      const k = btn.dataset.k;
      if (k === 'C') { expr = ''; }
      else if (k === '⌫') { expr = expr.slice(0, -1); }
      else if (k === '=') {
        const result = safeEval(toEvalExpr(expr));
        if (result === null) { display.textContent = 'Erro'; soundManager.error(); return; }
        const line = `${expr} = ${result}`;
        history.unshift(line);
        history = history.slice(0, 8);
        renderHistory();
        if (userManager.currentUser) {
          await db.add('games', { usuario_id: userManager.currentUser.id, jogo: 'calculadora', pontuacao: 0, calc: line, data: new Date().toISOString() });
        }
        expr = String(result);
        soundManager.success();
      } else {
        expr += k;
      }
      display.textContent = expr || '0';
    });
  });
}
