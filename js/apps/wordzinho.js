/* Anne OS Kids - Wordzinho */

function openWordzinhoApp() {
  const panel = document.createElement('div');
  panel.className = 'app-panel wordzinho-app';
  panel.innerHTML = `
    <h2>📝 Wordzinho</h2>
    <p>Escreva e formate seu texto de um jeito simples.</p>
    <div class="wordzinho-toolbar">
      <button class="music-btn" data-command="bold" title="Negrito"><strong>B</strong></button>
      <button class="music-btn" data-command="italic" title="Itálico"><em>I</em></button>
      <button class="music-btn" data-command="underline" title="Sublinhado"><u>U</u></button>
      <button class="music-btn" data-command="justifyLeft" title="Alinhar à esquerda">⬅️</button>
      <button class="music-btn" data-command="justifyCenter" title="Centralizar">↔️</button>
      <button class="music-btn" data-command="justifyRight" title="Alinhar à direita">➡️</button>
      <select class="wordzinho-size" aria-label="Tamanho da fonte">
        <option value="3">Fonte normal</option>
        <option value="4">Fonte grande</option>
        <option value="5">Fonte maior</option>
        <option value="6">Fonte enorme</option>
      </select>
      <button class="music-btn" data-action="clear" title="Limpar texto">🧹</button>
    </div>
    <div class="wordzinho-editor" contenteditable="true" role="textbox" aria-label="Área de texto">Comece a escrever aqui...</div>
    <div class="wordzinho-footer"><span class="wordzinho-count">0 palavras</span><button class="music-btn" data-action="save">💾 Salvar texto</button></div>
    <div class="quiz-feedback wordzinho-feedback"></div>
  `;
  const editor = panel.querySelector('.wordzinho-editor');
  const countEl = panel.querySelector('.wordzinho-count');
  const feedbackEl = panel.querySelector('.wordzinho-feedback');
  let placeholderActive = true;

  function updateCount() {
    const text = placeholderActive ? '' : editor.innerText.trim();
    countEl.textContent = `${text ? text.split(/\s+/).length : 0} palavras`;
  }
  editor.addEventListener('focus', () => { if (placeholderActive) { editor.textContent = ''; placeholderActive = false; } });
  editor.addEventListener('input', updateCount);
  panel.querySelectorAll('[data-command]').forEach(button => button.addEventListener('click', () => {
    editor.focus();
    document.execCommand(button.dataset.command, false, null);
    updateCount();
  }));
  panel.querySelector('.wordzinho-size').addEventListener('change', event => {
    editor.focus();
    document.execCommand('fontSize', false, event.target.value);
  });
  panel.querySelector('[data-action="clear"]').addEventListener('click', () => {
    editor.innerHTML = '';
    placeholderActive = false;
    feedbackEl.textContent = 'Texto limpo.';
    updateCount();
  });
  panel.querySelector('[data-action="save"]').addEventListener('click', () => {
    const text = editor.innerText.trim();
    if (!text) { feedbackEl.textContent = 'Escreva algo antes de salvar.'; return; }
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'meu-texto.txt';
    link.click();
    URL.revokeObjectURL(link.href);
    feedbackEl.textContent = 'Texto salvo como meu-texto.txt.';
  });
  updateCount();
  return panel;
}
