/* ==========================================================================
   Anne OS Kids — settings.js
   SettingsManager: wallpaper, tema, volume, persistência por usuário
   ========================================================================== */

const WALLPAPERS = [
  { id: 'wp-espaco', label: 'Espaço 🚀', color: '#1c1245' },
  { id: 'wp-floresta', label: 'Floresta 🌳', color: '#4fae6b' },
  { id: 'wp-mar', label: 'Fundo do mar 🌊', color: '#1f8fd6' },
  { id: 'wp-dino', label: 'Dinossauros 🦖', color: '#f2b155' },
  { id: 'wp-animais', label: 'Animais 🐶', color: '#7fd8a3' },
  { id: 'wp-arcoiris', label: 'Arco-íris 🌈', color: 'linear-gradient(90deg,#ff6f6f,#ffd166,#6fdc8c,#4fc3f7,#8c6fff)' },
  { id: 'wp-ceu', label: 'Céu ☁️', color: '#aee4ff' }
];

class SettingsManager {
  constructor() {
    this.current = { wallpaper: 'wp-arcoiris', tema: 'claro', volume: 0.6, somSistema: true };
  }

  async load(userId) {
    let s = await db.get('settings', userId);
    if (!s) {
      s = { usuario_id: userId, wallpaper: 'wp-arcoiris', tema: 'claro', volume: 0.6, somSistema: true };
      await db.put('settings', s);
    }
    this.current = s;
    this.apply();
    return s;
  }

  async save() {
    if (!userManager.currentUser) return;
    this.current.usuario_id = userManager.currentUser.id;
    await db.put('settings', this.current);
  }

  apply() {
    const desktop = document.getElementById('desktop');
    if (desktop) {
      WALLPAPERS.forEach(w => desktop.classList.remove(w.id));
      desktop.classList.add(this.current.wallpaper || 'wp-arcoiris');
    }
    document.body.classList.toggle('theme-dark', this.current.tema === 'escuro');
    document.body.classList.toggle('theme-colorido', this.current.tema === 'colorido');
    soundManager.setVolume(this.current.volume ?? 0.6);
    soundManager.setEnabled(this.current.somSistema !== false);
  }

  async setWallpaper(id) {
    this.current.wallpaper = id;
    this.apply();
    await this.save();
  }

  async setTheme(theme) {
    this.current.tema = theme;
    this.apply();
    await this.save();
  }

  async setVolume(v) {
    this.current.volume = v;
    this.apply();
    await this.save();
  }

  async setSomSistema(v) {
    this.current.somSistema = v;
    this.apply();
    await this.save();
  }
}

const settingsManager = new SettingsManager();
