/* ==========================================================================
   Anne OS Kids — games/animalsHub.js
   🐾 Mundo dos Animais e 🎵 Anne Music (hubs de entrada dos ícones do desktop)
   ========================================================================== */

function openAnimalsHub() {
  const panel = document.createElement('div');
  panel.className = 'app-panel';
  panel.innerHTML = `<h2>🐾 Mundo dos Animais</h2><div class="hub-grid">
    <div class="hub-card" data-g="animal-guess"><span class="hc-emoji">🐘</span><div class="hc-title">Que Animal É Esse?</div><div class="hc-sub">Adivinhe pela imagem</div></div>
    <div class="hub-card" data-g="animal-memory"><span class="hc-emoji">🧠</span><div class="hc-title">Memória dos Animais</div><div class="hc-sub">Jogo da memória</div></div>
  </div>`;
  const map = { 'animal-guess': [openAnimalGuessGame, 'Que Animal É Esse?', '🐘'], 'animal-memory': [openAnimalMemoryGame, 'Memória dos Animais', '🧠'] };
  panel.querySelectorAll('.hub-card').forEach(card => {
    card.addEventListener('click', () => {
      soundManager.click();
      const [fn, title, emoji] = map[card.dataset.g];
      windowManager.open({ appId: 'game-' + card.dataset.g, title, icon: emoji, contentEl: fn(), width: 520, height: 480 });
    });
  });
  return panel;
}

function openMusicHub() {
  const panel = document.createElement('div');
  panel.className = 'app-panel';
  panel.innerHTML = `<h2>🎵 Anne Music</h2><div class="hub-grid">
    <div class="hub-card" data-g="piano"><span class="hc-emoji">🎹</span><div class="hc-title">Teclado Musical</div><div class="hc-sub">Toque livremente</div></div>
    <div class="hub-card" data-g="music-repeat"><span class="hc-emoji">🎵</span><div class="hc-title">Repita a Música</div><div class="hc-sub">Memorize a sequência</div></div>
    <div class="hub-card" data-g="music-note"><span class="hc-emoji">🎶</span><div class="hc-title">Acerte a Nota</div><div class="hc-sub">Identifique o som</div></div>
  </div>`;
  const map = { piano: [openPianoApp, 'Teclado Musical', '🎹'], 'music-repeat': [openMusicRepeatGame, 'Repita a Música', '🎵'], 'music-note': [openMusicNoteGame, 'Acerte a Nota', '🎶'] };
  panel.querySelectorAll('.hub-card').forEach(card => {
    card.addEventListener('click', () => {
      soundManager.click();
      const [fn, title, emoji] = map[card.dataset.g];
      windowManager.open({ appId: 'game-' + card.dataset.g, title, icon: emoji, contentEl: fn(), width: 520, height: 460 });
    });
  });
  return panel;
}
