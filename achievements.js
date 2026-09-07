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
  { id: 'five_notes', emoji: '📝', name: '5 notas escritas', desc: 'Pequeno escritor', check: (s) => s.notes >= 5 },
  { id: 'jogo_quebra_cabeca', emoji: '🧩', name: 'Mestre dos quebra-cabeças', desc: 'Completou um quebra-cabeça', check: (s) => s.puzzlesCompleted >= 1 },
  { id: 'jogo_digitacao', emoji: '⌨️', name: 'Dedos rápidos', desc: 'Fez 20 pontos na Chuva de Palavras', check: (s) => s.typingBest >= 20 },
  { id: 'jogo_balde_tinta', emoji: '🪣', name: 'Pintor de baldinho', desc: 'Coloriu um desenho completo', check: (s) => s.bucketFills >= 1 },
  { id: 'jogo_blocos', emoji: '🧱', name: 'Arquiteto mirim', desc: 'Construiu com 15 blocos ou mais', check: (s) => s.blocksBuilds >= 1 },
  { id: 'jogo_sinuca', emoji: '🎱', name: 'Craque da sinuca', desc: 'Venceu o computador na sinuquinha', check: (s) => s.sinucaVitorias >= 1 },
  { id: 'jogo_paciencia', emoji: '🃏', name: 'Mestre da paciência', desc: 'Venceu uma partida de Paciência', check: (s) => s.solitaireWins >= 1 }
  ,{ id: 'jogo_forca', emoji: '🔤', name: 'Mestre das palavras', desc: 'Venceu uma partida da Forca', check: (s) => s.hangmanWins >= 1 }
];

const ACHIEVEMENT_LEVELS = [1, 3, 5, 10, 20, 50];
const ACHIEVEMENT_PROGRESS = [
  { key: 'gamesPlayed', id: 'aventuras', emoji: '🎮', label: 'aventuras concluídas', desc: 'Explorou os jogos do sistema' },
  { key: 'drawings', id: 'arte', emoji: '🎨', label: 'desenhos salvos', desc: 'Criou trabalhos artísticos' },
  { key: 'notes', id: 'escrita', emoji: '📝', label: 'notas escritas', desc: 'Praticou sua escrita' },
  { key: 'stars', id: 'estrelas', emoji: '⭐', label: 'estrelas conquistadas', desc: 'Colecionou estrelas' },
  { key: 'questionsAnswered', id: 'perguntas', emoji: '🧠', label: 'perguntas respondidas', desc: 'Aprendeu brincando' },
  { key: 'musicPlays', id: 'musica', emoji: '🎵', label: 'momentos musicais', desc: 'Explorou os sons e as melodias' },
  { key: 'animalsCorrect', id: 'animais', emoji: '🐶', label: 'animais identificados', desc: 'Conheceu melhor o mundo animal' },
  { key: 'puzzlesCompleted', id: 'quebra', emoji: '🧩', label: 'quebra-cabeças concluídos', desc: 'Treinou a atenção e a lógica' },
  { key: 'typingBest', id: 'digitacao', emoji: '⌨️', label: 'pontos na Chuva de Palavras', desc: 'Treinou agilidade e concentração' },
  { key: 'bucketFills', id: 'pintura', emoji: '🪣', label: 'desenhos coloridos', desc: 'Usou criatividade com o Balde de Tinta' },
  { key: 'blocksBuilds', id: 'construcoes', emoji: '🧱', label: 'construções realizadas', desc: 'Criou mundos com blocos' },
  { key: 'solitaireWins', id: 'cartas', emoji: '🃏', label: 'partidas de Paciência vencidas', desc: 'Exercitou estratégia e paciência' },
  { key: 'hangmanWins', id: 'palavras', emoji: '🔤', label: 'partidas da Forca vencidas', desc: 'Ampliou seu vocabulário' },
  { key: 'sinucaVitorias', id: 'sinuca', emoji: '🎱', label: 'vitórias na Sinuquinha', desc: 'Praticou mira e planejamento' }
];

ACHIEVEMENT_PROGRESS.forEach(progress => {
  ACHIEVEMENT_LEVELS.forEach((level, index) => {
    ACHIEVEMENT_DEFS.push({
      id: `${progress.id}_${level}`,
      emoji: progress.emoji,
      name: `${progress.emoji} ${level} ${progress.label}`,
      desc: `${progress.desc}: alcance ${level} ${progress.label}.`,
      check: (stats) => (stats[progress.key] || 0) >= level
    });
  });
});

if (ACHIEVEMENT_DEFS.length !== 100) console.warn('Anne OS: catálogo de conquistas fora do tamanho esperado.');

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
    const puzzlesCompleted = games.filter(g => g.jogo === 'quebra-cabeca' || g.jogo === 'quebra-cabeca-arraste').length;
    const typingBest = games.filter(g => g.jogo === 'digitacao').reduce((m, g) => Math.max(m, g.pontuacao || 0), 0);
    const bucketFills = games.filter(g => g.jogo === 'balde-tinta').length;
    const blocksBuilds = games.filter(g => g.jogo === 'blocos-criativos').length;
    const sinucaVitorias = games.filter(g => g.jogo === 'sinuca-vitoria').length;
    const solitaireWins = games.filter(g => g.jogo === 'paciencia').length;
    const hangmanWins = games.filter(g => g.jogo === 'forca' && (g.pontuacao || 0) > 0).length;
    return {
      drawings: drawings.length,
      notes: notes.length,
      gamesPlayed: games.length,
      animalsCorrect,
      questionsAnswered,
      musicPlays,
      puzzlesCompleted,
      typingBest,
      bucketFills,
      blocksBuilds,
      sinucaVitorias,
      solitaireWins,
      hangmanWins,
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
        await this.createMilestoneCertificate();
      }
    }
  }

  async createMilestoneCertificate() {
    const total = this.unlocked.length;
    if (!total || total % 10 !== 0) return;
    const certificates = await db.getByIndex('drawings', 'usuario_id', userManager.currentUser.id);
    if (certificates.some(item => item.tipo === 'certificado' && item.marco === total)) return;
    const achievement = ACHIEVEMENT_DEFS.find(def => def.id === this.unlocked[total - 1].achievement_id) || ACHIEVEMENT_DEFS[total - 1];
    const userName = userManager.currentUser.nome || 'Criança';
    const escapeXml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700">
      <rect width="1000" height="700" fill="#fffdf4"/>
      <rect x="24" y="24" width="952" height="652" rx="28" fill="none" stroke="#8c6fff" stroke-width="8"/>
      <rect x="42" y="42" width="916" height="616" rx="20" fill="none" stroke="#ffd166" stroke-width="3"/>
      <text x="500" y="135" text-anchor="middle" font-family="sans-serif" font-size="48" font-weight="bold" fill="#3a2a55">CERTIFICADO DE CONQUISTA</text>
      <text x="500" y="205" text-anchor="middle" font-family="sans-serif" font-size="25" fill="#8c6fff">Anne OS Kids • Mundo Criança</text>
      <text x="500" y="290" text-anchor="middle" font-family="sans-serif" font-size="34" font-weight="bold" fill="#3a2a55">${escapeXml(userName)}</text>
      <text x="500" y="350" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#555">concluiu a conquista</text>
      <text x="500" y="405" text-anchor="middle" font-family="sans-serif" font-size="32" font-weight="bold" fill="#7658ff">${escapeXml(achievement.name)}</text>
      <text x="500" y="455" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#555">${escapeXml(achievement.desc)}</text>
      <text x="500" y="535" text-anchor="middle" font-family="cursive" font-size="28" fill="#3a2a55">Ulysson F. Nobre</text>
      <text x="500" y="570" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#7658ff">DataStockBi - mundo criança</text>
      <text x="500" y="625" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#888">Certificado ${total / 10} de 10 • ${new Date().toLocaleDateString('pt-BR')}</text>
    </svg>`;
    await db.add('drawings', {
      usuario_id: userManager.currentUser.id,
      nome: `Certificado ${total / 10} - ${achievement.name}`,
      imagem: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
      tipo: 'certificado',
      marco: total,
      descricao: achievement.desc,
      data: new Date().toISOString()
    });
    notificationManager.show(`Novo certificado na pasta Meus Certificados!`, '📜', 4500);
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
globalThis.achievementManager = achievementManager;
