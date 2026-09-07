/* ==========================================================================
   Anne OS Kids — users.js
   UserManager: perfis (CRUD), usuário atual, estrelas e pontuação
   ========================================================================== */

const AVATAR_CHOICES = ['🧒', '👧', '👦', '🐱', '🐶', '🦊', '🐼', '🦄', '🐸', '🐰', '🦁', '🐧'];
const COLOR_CHOICES = ['#ff6fa5', '#8c6fff', '#4fc3f7', '#6fdc8c', '#ffd166', '#ff9f6f', '#ff6f6f'];

class UserManager {
  constructor() {
    this.currentUser = null;
  }

  async listUsers() {
    return db.getAll('users');
  }

  async createUser({ nome, avatar, cor }) {
    const user = {
      nome: nome || 'Criança',
      avatar: avatar || '🧒',
      cor: cor || COLOR_CHOICES[0],
      pontuacao: 0,
      estrelas: 0,
      jogosRealizados: 0,
      criadoEm: new Date().toISOString()
    };
    const id = await db.add('users', user);
    user.id = id;
    await db.put('settings', {
      usuario_id: id,
      wallpaper: 'wp-arcoiris',
      tema: 'claro',
      volume: 0.6,
      somSistema: true
    });
    return user;
  }

  async deleteUser(id) {
    await db.delete('users', id);
    await db.delete('settings', id);
    const stores = ['games', 'drawings', 'notes', 'achievements'];
    for (const s of stores) {
      const items = await db.getByIndex(s, 'usuario_id', id);
      for (const it of items) await db.delete(s, it.id);
    }
  }

  async setCurrentUser(id) {
    const user = await db.get('users', id);
    this.currentUser = user;
    // Contadores em memória (ex.: toques de piano) são por sessão de login —
    // zerar aqui evita que fiquem "vazando" de um perfil para outro em um
    // computador compartilhado entre irmãos.
    window.__pianoPlays = 0;
    return user;
  }

  getCurrentUser() { return this.currentUser; }

  async refreshCurrentUser() {
    if (!this.currentUser) return null;
    this.currentUser = await db.get('users', this.currentUser.id);
    return this.currentUser;
  }

  async addStars(amount) {
    if (!this.currentUser) return;
    this.currentUser.estrelas = (this.currentUser.estrelas || 0) + amount;
    await db.put('users', this.currentUser);
    updateStarDisplay(this.currentUser.estrelas);
    if (amount > 0) notificationManager.stars(amount);
    try { soundManager.starGain(); } catch (e) {}
  }

  async addScore(amount) {
    if (!this.currentUser) return;
    this.currentUser.pontuacao = (this.currentUser.pontuacao || 0) + amount;
    await db.put('users', this.currentUser);
  }

  async incGamesPlayed() {
    if (!this.currentUser) return;
    this.currentUser.jogosRealizados = (this.currentUser.jogosRealizados || 0) + 1;
    await db.put('users', this.currentUser);
  }

  async saveGameResult(jogo, pontuacao) {
    if (!this.currentUser) return;
    await db.add('games', {
      usuario_id: this.currentUser.id,
      jogo,
      pontuacao,
      data: new Date().toISOString()
    });
    await this.incGamesPlayed();
  }

  async getUserGames() {
    if (!this.currentUser) return [];
    return db.getByIndex('games', 'usuario_id', this.currentUser.id);
  }

  async getBestScore(jogo) {
    const games = await this.getUserGames();
    const filtered = games.filter(g => g.jogo === jogo);
    if (!filtered.length) return 0;
    return Math.max(...filtered.map(g => g.pontuacao));
  }
}

function updateStarDisplay(amount) {
  const el1 = document.getElementById('tray-stars');
  const el2 = document.getElementById('sm-stars');
  if (el1) el1.textContent = `⭐ ${amount}`;
  if (el2) el2.textContent = `⭐ ${amount}`;
}

const userManager = new UserManager();
globalThis.userManager = userManager;
