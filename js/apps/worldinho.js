/* Anne OS Kids - Worldinho */

function openWorldinhoApp() {
  const panel = document.createElement('div');
  panel.className = 'app-panel worldinho-app';
  panel.innerHTML = `<h2>🌍 Worldinho</h2><p>Descubra o mundo respondendo perguntas rápidas.</p><div class="worldinho-score">Pontos: 0</div><div class="worldinho-question"></div><div class="worldinho-options"></div><div class="quiz-feedback worldinho-feedback"></div><button class="music-btn worldinho-next" style="display:none;">Próxima pergunta</button>`;
  const questions = [
    { q: 'Qual é o maior continente?', options: ['Ásia', 'Europa', 'Oceania'], answer: 'Ásia' },
    { q: 'Em qual continente fica o Brasil?', options: ['América do Sul', 'África', 'Ásia'], answer: 'América do Sul' },
    { q: 'Qual destes é um oceano?', options: ['Pacífico', 'Saara', 'Alpes'], answer: 'Pacífico' },
    { q: 'Qual é a capital do Brasil?', options: ['Brasília', 'Salvador', 'Recife'], answer: 'Brasília' }
  ];
  let index = 0, score = 0;
  const questionEl = panel.querySelector('.worldinho-question');
  const optionsEl = panel.querySelector('.worldinho-options');
  const feedbackEl = panel.querySelector('.worldinho-feedback');
  const nextButton = panel.querySelector('.worldinho-next');
  function render() {
    const item = questions[index]; questionEl.textContent = item.q; optionsEl.innerHTML = ''; feedbackEl.textContent = ''; nextButton.style.display = 'none';
    item.options.forEach(option => { const button = document.createElement('button'); button.className = 'quiz-option'; button.textContent = option; button.addEventListener('click', () => { optionsEl.querySelectorAll('button').forEach(b => b.disabled = true); if (option === item.answer) { score += 10; feedbackEl.textContent = 'Muito bem! 🎉'; } else feedbackEl.textContent = `A resposta era ${item.answer}.`; panel.querySelector('.worldinho-score').textContent = `Pontos: ${score}`; nextButton.style.display = ''; }); optionsEl.appendChild(button); });
  }
  nextButton.addEventListener('click', () => { index = (index + 1) % questions.length; render(); }); render(); return panel;
}
