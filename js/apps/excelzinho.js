/* Anne OS Kids - Excelzinho */

function openExcelzinhoApp() {
  const panel = document.createElement('div');
  panel.className = 'app-panel excelzinho-app';
  panel.innerHTML = `<h2>📊 Excelzinho</h2><p>Edite as células e use fórmulas simples como <strong>=SUM(A1:A3)</strong>.</p><div class="excel-toolbar"><button class="music-btn" data-action="sum">Σ Somar coluna A</button><button class="music-btn" data-action="clear">🧹 Limpar</button><span class="excel-result">Resultado: 0</span></div><div class="excel-grid"></div>`;
  const grid = panel.querySelector('.excel-grid');
  const resultEl = panel.querySelector('.excel-result');
  const columns = ['A', 'B', 'C', 'D'];
  columns.forEach(column => { const header = document.createElement('div'); header.className = 'excel-cell excel-header'; header.textContent = column; grid.appendChild(header); });
  for (let row = 1; row <= 6; row++) {
    const number = document.createElement('div'); number.className = 'excel-cell excel-row-number'; number.textContent = row; grid.appendChild(number);
    for (let column = 0; column < columns.length; column++) { const cell = document.createElement('input'); cell.className = 'excel-cell excel-input'; cell.dataset.cell = `${columns[column]}${row}`; cell.type = 'text'; cell.setAttribute('aria-label', `Célula ${columns[column]}${row}`); grid.appendChild(cell); }
  }
  function valueAt(cellName) { const input = panel.querySelector(`[data-cell="${cellName}"]`); const value = Number(input.value.replace(',', '.')); return Number.isFinite(value) ? value : 0; }
  panel.querySelector('[data-action="sum"]').addEventListener('click', () => { let total = 0; for (let row = 1; row <= 6; row++) total += valueAt(`A${row}`); resultEl.textContent = `Resultado: ${total}`; });
  panel.querySelector('[data-action="clear"]').addEventListener('click', () => { panel.querySelectorAll('.excel-input').forEach(input => input.value = ''); resultEl.textContent = 'Resultado: 0'; });
  return panel;
}
