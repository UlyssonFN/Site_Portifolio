/* ==========================================================================
   Anne OS Kids — apps/browser.js
   🌐 Navegador fictício (páginas educativas simuladas, sem internet)
   ========================================================================== */

const BROWSER_PAGES = {
  inicio: {
    title: 'Anne Web — Início',
    body: `
      <h2>🌐 Bem-vindo ao Anne Web!</h2>
      <p>Este é um navegador de brincadeira, feito só para você explorar dentro do Anne OS. Escolha um site:</p>
      <div class="hub-grid">
        <div class="hub-card" data-page="zoo"><span class="hc-emoji">🦁</span><div class="hc-title">ZooAnne</div><div class="hc-sub">Curiosidades de animais</div></div>
        <div class="hub-card" data-page="espaco"><span class="hc-emoji">🚀</span><div class="hc-title">EspaçoKids</div><div class="hc-sub">O universo é incrível!</div></div>
        <div class="hub-card" data-page="receitas"><span class="hc-emoji">🍪</span><div class="hc-title">ReceitasFofas</div><div class="hc-sub">Comidinhas divertidas</div></div>
      </div>
    `
  },
  zoo: {
    title: 'ZooAnne',
    body: `<h2>🦁 ZooAnne</h2><p>🐘 Os elefantes são os maiores animais terrestres do mundo!</p><p>🦒 As girafas têm o mesmo número de ossos no pescoço que nós: 7!</p><p>🐧 Pinguins não voam, mas são ótimos nadadores.</p>`
  },
  espaco: {
    title: 'EspaçoKids',
    body: `<h2>🚀 EspaçoKids</h2><p>🌕 A Lua é o único satélite natural da Terra.</p><p>🪐 Saturno tem lindos anéis feitos de gelo e rocha.</p><p>☀️ O Sol é uma estrela gigante que nos dá luz e calor!</p>`
  },
  receitas: {
    title: 'ReceitasFofas',
    body: `<h2>🍪 ReceitasFofas</h2><p>🧁 Cupcake de banana: peça ajuda de um adulto e capriche na cobertura!</p><p>🍓 Espetinho de frutas: uma lanchinho colorido e gostoso.</p>`
  }
};

function openBrowserApp() {
  const panel = document.createElement('div');
  panel.className = 'app-panel';
  panel.style.padding = '0';
  panel.innerHTML = `
    <div style="display:flex;gap:.4rem;align-items:center;background:#f0eaff;padding:.5rem;">
      <button id="browser-back" class="paint-tool" title="Voltar">⬅️</button>
      <div style="flex:1;background:#fff;border-radius:16px;padding:.4rem .8rem;font-size:.85rem;color:#888;" id="browser-url">Anneweb://inicio</div>
    </div>
    <div class="app-panel" id="browser-content"></div>
  `;
  const history = ['inicio'];
  function render(page) {
    const data = BROWSER_PAGES[page] || BROWSER_PAGES.inicio;
    panel.querySelector('#browser-url').textContent = 'Anneweb://' + page;
    const contentEl = panel.querySelector('#browser-content');
    contentEl.innerHTML = data.body;
    contentEl.querySelectorAll('[data-page]').forEach(el => {
      el.addEventListener('click', () => { soundManager.click(); history.push(el.dataset.page); render(el.dataset.page); });
    });
  }
  panel.querySelector('#browser-back').addEventListener('click', () => {
    if (history.length > 1) { history.pop(); render(history[history.length - 1]); soundManager.click(); }
  });
  setTimeout(() => render('inicio'), 0);
  return panel;
}
