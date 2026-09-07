/* ==========================================================================
   Anne OS Kids — games/dollDressUp.js
   👗 Vista a Boneca — jogo de criatividade (roupas, cabelo, acessórios)
   ========================================================================== */

const DOLL_SKIN_TONES = ['#ffe0bd', '#f1c27d', '#e0ac69', '#c68642', '#8d5524'];
const DOLL_HAIR_COLORS = ['#3b2314', '#000000', '#ffd166', '#ff6fa5', '#8c6fff', '#c0392b'];
const DOLL_OUTFIT_COLORS = ['#ff6fa5', '#4fc3f7', '#6fdc8c', '#ffd166', '#8c6fff', '#ff9f6f', '#ffffff'];
const DOLL_ACCESSORIES = [
  { id: 'none', label: '🚫' }, { id: 'crown', label: '👑' }, { id: 'bow', label: '🎀' },
  { id: 'glasses', label: '🕶️' }, { id: 'hat', label: '👒' }, { id: 'flower', label: '🌸' }
];

function dollDefaultLook() {
  return { skin: DOLL_SKIN_TONES[0], hair: DOLL_HAIR_COLORS[0], hairStyle: 'long', outfit: 'dress', outfitColor: DOLL_OUTFIT_COLORS[0], pantsColor: DOLL_OUTFIT_COLORS[1], shoes: DOLL_OUTFIT_COLORS[4], accessory: 'none' };
}

function openDollDressUpGame() {
  const panel = document.createElement('div');
  panel.className = 'app-panel';
  panel.innerHTML = `
    <h2 style="text-align:center;">👗 Vista a Boneca</h2>
    <div class="doll-layout">
      <div class="doll-stage" id="doll-stage"></div>
      <div class="doll-controls" id="doll-controls">
        <div class="doll-tabs" id="doll-tabs"></div>
        <div class="doll-options" id="doll-options"></div>
        <div style="display:flex;gap:.5rem;margin-top:.8rem;flex-wrap:wrap;">
          <button class="music-btn" id="doll-random">🎲 Look aleatório</button>
          <button class="music-btn" id="doll-save">💾 Salvar look</button>
        </div>
        <div class="doll-gallery" id="doll-gallery"></div>
      </div>
    </div>
  `;
  setTimeout(() => initDollDressUp(panel), 0);
  return panel;
}

const DOLL_TABS = [
  { id: 'skin', label: '🧑 Pele' },
  { id: 'hair', label: '💇 Cabelo' },
  { id: 'outfit', label: '👗 Roupa' },
  { id: 'shoes', label: '👟 Sapato' },
  { id: 'accessory', label: '✨ Acessório' }
];

function initDollDressUp(panel) {
  let look = dollDefaultLook();
  let activeTab = 'skin';

  const stage = panel.querySelector('#doll-stage');
  const tabsEl = panel.querySelector('#doll-tabs');
  const optionsEl = panel.querySelector('#doll-options');
  const galleryEl = panel.querySelector('#doll-gallery');

  DOLL_TABS.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'theme-choice doll-tab' + (t.id === activeTab ? ' selected' : '');
    btn.textContent = t.label;
    btn.dataset.tab = t.id;
    btn.addEventListener('click', () => {
      activeTab = t.id;
      soundManager.click();
      panel.querySelectorAll('.doll-tab').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      renderOptions();
    });
    tabsEl.appendChild(btn);
  });

  function renderStage() {
    stage.innerHTML = `
      <div class="doll-hair doll-hair-${look.hairStyle}" style="background:${look.hair};"></div>
      <div class="doll-head" style="background:${look.skin};"></div>
      ${look.outfit === 'dress'
        ? `<div class="doll-dress" style="background:${look.outfitColor};"></div>`
        : `<div class="doll-shirt" style="background:${look.outfitColor};"></div><div class="doll-pants" style="background:${look.pantsColor};"></div>`}
      <div class="doll-shoe doll-shoe-left" style="background:${look.shoes};"></div>
      <div class="doll-shoe doll-shoe-right" style="background:${look.shoes};"></div>
      ${look.accessory !== 'none' ? `<div class="doll-accessory">${DOLL_ACCESSORIES.find(a => a.id === look.accessory).label}</div>` : ''}
    `;
  }

  function swatchRow(colors, key) {
    const row = document.createElement('div');
    row.className = 'color-picker';
    colors.forEach(c => {
      const sw = document.createElement('span');
      sw.className = 'color-choice' + (look[key] === c ? ' selected' : '');
      sw.style.background = c;
      sw.addEventListener('click', () => { soundManager.click(); look[key] = c; renderStage(); renderOptions(); });
      row.appendChild(sw);
    });
    return row;
  }

  function renderOptions() {
    optionsEl.innerHTML = '';
    if (activeTab === 'skin') {
      optionsEl.appendChild(labelEl('Tom de pele'));
      optionsEl.appendChild(swatchRow(DOLL_SKIN_TONES, 'skin'));
    } else if (activeTab === 'hair') {
      optionsEl.appendChild(labelEl('Estilo do cabelo'));
      const styleRow = document.createElement('div');
      styleRow.style.display = 'flex'; styleRow.style.gap = '.5rem'; styleRow.style.marginBottom = '.6rem';
      ['long', 'short', 'curly'].forEach(style => {
        const b = document.createElement('button');
        b.className = 'theme-choice' + (look.hairStyle === style ? ' selected' : '');
        b.textContent = style === 'long' ? '💁 Longo' : style === 'short' ? '🙂 Curto' : '🧑‍🦱 Cacheado';
        b.addEventListener('click', () => { soundManager.click(); look.hairStyle = style; renderStage(); renderOptions(); });
        styleRow.appendChild(b);
      });
      optionsEl.appendChild(styleRow);
      optionsEl.appendChild(labelEl('Cor do cabelo'));
      optionsEl.appendChild(swatchRow(DOLL_HAIR_COLORS, 'hair'));
    } else if (activeTab === 'outfit') {
      optionsEl.appendChild(labelEl('Tipo de roupa'));
      const styleRow = document.createElement('div');
      styleRow.style.display = 'flex'; styleRow.style.gap = '.5rem'; styleRow.style.marginBottom = '.6rem';
      [['dress', '👗 Vestido'], ['shirt', '👕 Camiseta e calça']].forEach(([id, label]) => {
        const b = document.createElement('button');
        b.className = 'theme-choice' + (look.outfit === id ? ' selected' : '');
        b.textContent = label;
        b.addEventListener('click', () => { soundManager.click(); look.outfit = id; renderStage(); renderOptions(); });
        styleRow.appendChild(b);
      });
      optionsEl.appendChild(styleRow);
      optionsEl.appendChild(labelEl(look.outfit === 'dress' ? 'Cor do vestido' : 'Cor da camiseta'));
      optionsEl.appendChild(swatchRow(DOLL_OUTFIT_COLORS, 'outfitColor'));
      if (look.outfit === 'shirt') {
        optionsEl.appendChild(labelEl('Cor da calça'));
        optionsEl.appendChild(swatchRow(DOLL_OUTFIT_COLORS, 'pantsColor'));
      }
    } else if (activeTab === 'shoes') {
      optionsEl.appendChild(labelEl('Cor do sapato'));
      optionsEl.appendChild(swatchRow(DOLL_OUTFIT_COLORS, 'shoes'));
    } else if (activeTab === 'accessory') {
      optionsEl.appendChild(labelEl('Escolha um acessório'));
      const row = document.createElement('div');
      row.className = 'avatar-picker';
      DOLL_ACCESSORIES.forEach(a => {
        const span = document.createElement('span');
        span.className = 'avatar-choice' + (look.accessory === a.id ? ' selected' : '');
        span.textContent = a.label;
        span.addEventListener('click', () => { soundManager.click(); look.accessory = a.id; renderStage(); renderOptions(); });
        row.appendChild(span);
      });
      optionsEl.appendChild(row);
    }
  }

  function labelEl(text) {
    const l = document.createElement('label');
    l.textContent = text;
    l.style.display = 'block';
    l.style.fontWeight = '700';
    l.style.color = '#3a2a55';
    l.style.margin = '.4rem 0 .3rem';
    return l;
  }

  async function renderGallery() {
    galleryEl.innerHTML = '';
    const looks = (settingsManager.current.bonecaLooks || []);
    if (!looks.length) { galleryEl.innerHTML = '<p style="color:#aaa;font-size:.78rem;">Nenhum look salvo ainda.</p>'; return; }
    looks.forEach((saved, i) => {
      const mini = document.createElement('div');
      mini.className = 'doll-mini';
      mini.style.background = saved.skin;
      mini.title = 'Carregar look ' + (i + 1);
      mini.textContent = DOLL_ACCESSORIES.find(a => a.id === saved.accessory)?.label !== '🚫' ? (DOLL_ACCESSORIES.find(a => a.id === saved.accessory)?.label || '') : '';
      mini.addEventListener('click', () => { soundManager.click(); look = { ...saved }; renderStage(); renderOptions(); });
      galleryEl.appendChild(mini);
    });
  }

  panel.querySelector('#doll-random').addEventListener('click', () => {
    soundManager.click();
    look = {
      skin: DOLL_SKIN_TONES[Math.floor(Math.random() * DOLL_SKIN_TONES.length)],
      hair: DOLL_HAIR_COLORS[Math.floor(Math.random() * DOLL_HAIR_COLORS.length)],
      hairStyle: ['long', 'short', 'curly'][Math.floor(Math.random() * 3)],
      outfit: Math.random() > 0.5 ? 'dress' : 'shirt',
      outfitColor: DOLL_OUTFIT_COLORS[Math.floor(Math.random() * DOLL_OUTFIT_COLORS.length)],
      pantsColor: DOLL_OUTFIT_COLORS[Math.floor(Math.random() * DOLL_OUTFIT_COLORS.length)],
      shoes: DOLL_OUTFIT_COLORS[Math.floor(Math.random() * DOLL_OUTFIT_COLORS.length)],
      accessory: DOLL_ACCESSORIES[Math.floor(Math.random() * DOLL_ACCESSORIES.length)].id
    };
    renderStage(); renderOptions();
  });

  panel.querySelector('#doll-save').addEventListener('click', async () => {
    soundManager.click();
    if (!userManager.currentUser) return;
    const looks = settingsManager.current.bonecaLooks || [];
    looks.push({ ...look });
    settingsManager.current.bonecaLooks = looks.slice(-6);
    await settingsManager.save();
    await renderGallery();
    notificationManager.show('Look salvo na sua galeria! 👗', '💾', 2500);
    await userManager.addStars(2);
    await db.add('games', { usuario_id: userManager.currentUser.id, jogo: 'vista-boneca', pontuacao: 5, data: new Date().toISOString() });
    await userManager.incGamesPlayed();
    await achievementManager.checkAndUnlock();
  });

  renderStage();
  renderOptions();
  renderGallery();
}
