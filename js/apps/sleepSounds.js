/* Anne OS Kids - Hora de Dormir */

const BEDTIME_STORIES = [
  {
    title: 'A Lua e o Coelhinho',
    text: 'Era uma vez um coelhinho que não conseguia dormir. Ele olhou pela janela e viu a Lua brilhando no céu. A Lua contou que também gostava de observar o mundo em silêncio. O coelhinho respirou bem devagar, fechou os olhos e imaginou um campo cheio de flores macias. Quando abriu os olhos de novo, já era manhã e ele tinha descansado muito bem.'
  },
  {
    title: 'A Estrela Sonolenta',
    text: 'Uma estrelinha queria ajudar todos a encontrar o caminho para casa, mas naquela noite estava muito cansada. As outras estrelas disseram que descansar também era importante. Ela se aconchegou atrás de uma nuvem fofinha e ouviu o vento cantar baixinho. Quando acordou, estava brilhante e feliz para iluminar o céu novamente.'
  },
  {
    title: 'O Jardim Tranquilo',
    text: 'No fim do dia, todos os animais do jardim procuravam um cantinho para descansar. A borboleta fechou as asas, a joaninha se escondeu sob uma folha e o passarinho ajeitou seu ninho. O jardim ficou quietinho, ouvindo apenas o som suave da brisa. E assim todos tiveram sonhos coloridos e tranquilos.'
  },
  {
    title: 'O Barquinho de Nuvem',
    text: 'Uma criança encontrou um barquinho feito de nuvem no alto do céu. Ela entrou nele e navegou por um mar de estrelas. O barquinho balançava devagar, como um berço. Cada estrela contava uma história bem baixinha, até que a criança sentiu os olhos pesarem. O barquinho voltou para casa e deixou um sonho bonito no travesseiro.'
  }
];

function openBedtimeApp() {
  const panel = document.createElement('div');
  panel.className = 'app-panel bedtime-panel';
  panel.innerHTML = `
    <h2>🌙 Hora de Dormir</h2>
    <div class="bedtime-tabs">
      <button class="bedtime-tab selected" data-tab="rain">🌧️ Chuva</button>
      <button class="bedtime-tab" data-tab="lullaby">🎵 Ninar</button>
      <button class="bedtime-tab" data-tab="stories">📖 Histórias</button>
    </div>
    <section class="bedtime-view active" data-view="rain">
      <div class="bedtime-art">🌧️ ☁️ 🌧️</div>
      <h3>Ruído branco de chuva</h3>
      <p>Uma chuva suave para ajudar a relaxar.</p>
      <button class="bedtime-play" id="bedtime-rain">▶️ Começar chuva</button>
      <label class="bedtime-volume">Volume <input id="bedtime-rain-volume" type="range" min="0" max="1" step="0.05" value="0.28"></label>
    </section>
    <section class="bedtime-view" data-view="lullaby">
      <div class="bedtime-art">🌙 🎶 ⭐</div>
      <h3>Música de ninar</h3>
      <p>Uma melodia calma tocada suavemente em loop.</p>
      <button class="bedtime-play" id="bedtime-lullaby">▶️ Começar música</button>
      <label class="bedtime-volume">Volume <input id="bedtime-lullaby-volume" type="range" min="0" max="1" step="0.05" value="0.22"></label>
    </section>
    <section class="bedtime-view" data-view="stories">
      <div class="bedtime-story-list" id="bedtime-story-list"></div>
      <article class="bedtime-story" id="bedtime-story"></article>
    </section>
  `;
  setTimeout(() => initBedtimeApp(panel), 0);
  return panel;
}

function initBedtimeApp(panel) {
  const audio = { rain: null, lullaby: null };
  const tabs = panel.querySelectorAll('.bedtime-tab');
  const views = panel.querySelectorAll('.bedtime-view');
  const storyList = panel.querySelector('#bedtime-story-list');
  const storyEl = panel.querySelector('#bedtime-story');
  let rainSource = null;
  let rainGain = null;
  let lullabyTimer = null;
  let lullabyGain = null;
  let storyIndex = 0;

  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(item => item.classList.toggle('selected', item === tab));
    views.forEach(view => view.classList.toggle('active', view.dataset.view === tab.dataset.tab));
  }));

  function context() {
    return soundManager._ensureCtx();
  }

  function stopRain() {
    if (rainSource) { try { rainSource.stop(); } catch (e) {} rainSource.disconnect(); }
    if (rainGain) rainGain.disconnect();
    rainSource = null; rainGain = null;
    panel.querySelector('#bedtime-rain').textContent = '▶️ Começar chuva';
  }

  function startRain() {
    const ctx = context();
    if (!ctx) return;
    stopLullaby();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    rainSource = ctx.createBufferSource();
    rainSource.buffer = buffer;
    rainSource.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1200;
    rainGain = ctx.createGain();
    rainGain.gain.value = Number(panel.querySelector('#bedtime-rain-volume').value) * soundManager.masterVolume;
    rainSource.connect(filter).connect(rainGain).connect(ctx.destination);
    rainSource.start();
    panel.querySelector('#bedtime-rain').textContent = '⏹️ Parar chuva';
  }

  function stopLullaby() {
    clearTimeout(lullabyTimer);
    lullabyTimer = null;
    if (lullabyGain) lullabyGain.disconnect();
    lullabyGain = null;
    panel.querySelector('#bedtime-lullaby').textContent = '▶️ Começar música';
  }

  function startLullaby() {
    const ctx = context();
    if (!ctx) return;
    stopRain();
    const melody = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23];
    let noteIndex = 0;
    lullabyGain = ctx.createGain();
    lullabyGain.gain.value = Number(panel.querySelector('#bedtime-lullaby-volume').value) * soundManager.masterVolume;
    lullabyGain.connect(ctx.destination);
    const playNext = () => {
      if (!lullabyGain) return;
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = melody[noteIndex % melody.length];
      noteGain.gain.setValueAtTime(.001, ctx.currentTime);
      noteGain.gain.exponentialRampToValueAtTime(.8, ctx.currentTime + .12);
      noteGain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + 1.5);
      osc.connect(noteGain).connect(lullabyGain);
      osc.start();
      osc.stop(ctx.currentTime + 1.6);
      noteIndex++;
      lullabyTimer = setTimeout(playNext, 1500);
    };
    playNext();
    panel.querySelector('#bedtime-lullaby').textContent = '⏹️ Parar música';
  }

  panel.querySelector('#bedtime-rain').addEventListener('click', () => {
    soundManager.click();
    if (rainSource) stopRain(); else startRain();
  });
  panel.querySelector('#bedtime-lullaby').addEventListener('click', () => {
    soundManager.click();
    if (lullabyGain) stopLullaby(); else startLullaby();
  });
  panel.querySelector('#bedtime-rain-volume').addEventListener('input', event => {
    if (rainGain) rainGain.gain.value = Number(event.target.value) * soundManager.masterVolume;
  });
  panel.querySelector('#bedtime-lullaby-volume').addEventListener('input', event => {
    if (lullabyGain) lullabyGain.gain.value = Number(event.target.value) * soundManager.masterVolume;
  });

  BEDTIME_STORIES.forEach((story, index) => {
    const button = document.createElement('button');
    button.className = 'bedtime-story-choice';
    button.textContent = story.title;
    button.addEventListener('click', () => { storyIndex = index; renderStory(); });
    storyList.appendChild(button);
  });

  function renderStory() {
    const story = BEDTIME_STORIES[storyIndex];
    storyEl.innerHTML = `<h3>${story.title}</h3><p>${story.text}</p>`;
    storyList.querySelectorAll('.bedtime-story-choice').forEach((button, index) => button.classList.toggle('selected', index === storyIndex));
  }

  renderStory();
  panel._cleanup = () => { stopRain(); stopLullaby(); };
}
