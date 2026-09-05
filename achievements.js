/* ==========================================================================
   Anne OS Kids — achievements.js
   AchievementManager: conquistas desbloqueadas automaticamente
   ========================================================================== */

const ACHIEVEMENT_DEFS = [
  { id: 'first_drawing', emoji: '🏆', name: 'Primeiro desenho', desc: 'Salvou seu primeiro desenho', check: (s) => s.drawings >= 1 },
  { id: 'first_game', emoji: '⭐', name: 'Primeiro jogo', desc: 'Completou o primeiro jogo', check: (s) => s.gamesPlayed >= 1 },
  { id: 'ten_drawings', emoji: '🎨', name: '10 desenhos criados', desc: 'Verdadeiro artista!', check: (s) => s.drawings >= 10 },
  { id: 'ten_music', emoji: '🎵', name: '10 músicas tocadas', desc: 'Tocou 10 vezes no piano/jogo musical', check: (s) => s.musicPlays >= 10 },
  { id: 'ten_animals', emoji: '🐶', name: 'Acertou 10 animais', desc: 'Especialista em bichinhos', check: (s) => s.animalsCorrect >= 10 },
  { id: 'twenty_questions', emoji: '🧠', name: '20 perguntas respondidas', desc: 'Cabeça cheia de conhecimento', check: (s) => s.questionsAnswered >= 20 },
  { id: 'five_games', emoji: '🎮', name: 'Jogou 5 jogos', desc: 'Explorador de jogos', check: (s) => s.gamesPlayed >= 5 },
  { id: 'hundred_stars', emoji: '💫', name: '100 estrelas', desc: 'Colecionador de estrelas', check: (s) => s.stars >= 100 },
  { id: 'five_notes', emoji: '📝', name: '5 notas escritas', desc: 'Pequeno escritor', check: (s) => s.notes >= 5 }
];

class AchievementManager {
  constructor() { this.unlocked = []; }

  async loadUnlocked() {
    if (!userManager.currentUser) { this.unlocked = []; return []; }
    this.unlocked = await db.getByIndex('achievements', 'usuario_id', userManager.currentUser.id);
    return this.unlocked;
  }

  isUnlocked(id) { return this.unlocked.some(a => a.achievement_id === id); }

  async computeStats() {
    const uid = userManager.currentUser ? userManager.currentUser.id : null;
    if (!uid) return {};
    const [drawings, notes, games] = await Promise.all([
      db.getByIndex('drawings', 'usuario_id', uid),
      db.getByIndex('notes', 'usuario_id', uid),
      db.getByIndex('games', 'usuario_id', uid)
    ]);
    const animalsCorrect = games.filter(g => g.jogo === 'animais-quiz' || g.jogo === 'animais-som').reduce((a, g) => a + (g.acertos || 0), 0);
    const questionsAnswered = games.reduce((a, g) => a + (g.perguntas || 0), 0);
    const musicPlays = games.filter(g => g.jogo && g.jogo.startsWith('musica')).length +
      (window.__pianoPlays || 0);
    return {
      drawings: drawings.length,
      notes: notes.length,
      gamesPlayed: games.length,
      animalsCorrect,
      questionsAnswered,
      musicPlays,
      stars: userManager.currentUser.estrelas || 0
    };
  }

  async checkAndUnlock() {
    if (!userManager.currentUser) return;
    await this.loadUnlocked();
    const stats = await this.computeStats();
    for (const def of ACHIEVEMENT_DEFS) {
      if (this.isUnlocked(def.id)) continue;
      if (def.check(stats)) {
        await db.add('achievements', {
          usuario_id: userManager.currentUser.id,
          achievement_id: def.id,
          data: new Date().toISOString()
        });
        this.unlocked.push({ achievement_id: def.id });
        notificationManager.achievement(def.name);
        await userManager.addStars(3);
      }
    }
  }

  async getAllForDisplay() {
    await this.loadUnlocked();
    return ACHIEVEMENT_DEFS.map(def => ({
      ...def,
      unlocked: this.isUnlocked(def.id)
    }));
  }
}

const achievementManager = new AchievementManager();
