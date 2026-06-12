import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, test, expect, beforeEach } from 'vitest';
import { buildCopyText, countVisibleSelectedCells } from '../shared/clipboard-utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function mountFilteredSelectionCase() {
  const css = readFileSync(join(root, 'styles.css'), 'utf8');
  document.head.innerHTML = `<style>${css}</style>`;
  document.body.innerHTML = `
    <table>
      <tbody id="tableBody"></tbody>
    </table>
  `;

  const tableBody = document.getElementById('tableBody');
  const csvData = [];
  const selectedRowIndexes = [2, 4, 8, 11, 12];

  for (let rowIndex = 0; rowIndex < 15; rowIndex += 1) {
    const valor = rowIndex === 11 || rowIndex === 12 ? 'R$ 49,90' : 'R$ 120,00';
    const descricao =
      rowIndex === 9 || rowIndex === 10 ? 'Outro lançamento' : 'Pix recebido de Cliente';

    csvData.push([
      `2024-01-${String(rowIndex + 1).padStart(2, '0')}`,
      descricao,
      'Entrada',
      'Vendas',
      'Conta',
      'Pix',
      valor,
      ''
    ]);

    const tr = document.createElement('tr');
    tr.dataset.rowIndex = String(rowIndex);

    const rowNumber = document.createElement('td');
    rowNumber.textContent = String(rowIndex + 1);
    tr.appendChild(rowNumber);

    for (let colIndex = 0; colIndex < 8; colIndex += 1) {
      const td = document.createElement('td');
      td.dataset.rowIndex = String(rowIndex);
      td.dataset.columnIndex = String(colIndex);
      td.textContent = csvData[rowIndex][colIndex];
      tr.appendChild(td);
    }

    if (!descricao.includes('Pix recebido de')) tr.style.display = 'none';
    tableBody.appendChild(tr);
  }

  selectedRowIndexes.forEach((rowIndex) => {
    const cell = tableBody.querySelector(`td[data-row-index="${rowIndex}"][data-column-index="6"]`);
    cell.classList.add('cell-selected');
  });

  for (let rowIndex = 8; rowIndex <= 12; rowIndex += 1) {
    if (selectedRowIndexes.includes(rowIndex)) continue;
    const cell = tableBody.querySelector(`td[data-row-index="${rowIndex}"][data-column-index="6"]`);
    cell.classList.add('cell-selected');
  }

  return { tableBody, csvData, selectedRowIndexes };
}

describe('buildCopyText with active filters', () => {
  let tableBody;
  let csvData;

  beforeEach(() => {
    ({ tableBody, csvData } = mountFilteredSelectionCase());
  });

  test('copies only visible selected cells while filters hide rows in the range', () => {
    const text = buildCopyText(tableBody, csvData);

    expect(text).not.toBeNull();
    expect(text.split('\n')).toEqual([
      'R$ 120,00',
      'R$ 120,00',
      'R$ 120,00',
      'R$ 49,90',
      'R$ 49,90'
    ]);
  });

  test('counts only visible selected cells when rows are filtered out', () => {
    expect(countVisibleSelectedCells(tableBody)).toBe(5);
  });

  test('returns null when every selected cell is hidden by filters', () => {
    tableBody.querySelectorAll('td.cell-selected').forEach((td) => {
      td.closest('tr').style.display = 'none';
    });

    expect(buildCopyText(tableBody, csvData)).toBeNull();
    expect(countVisibleSelectedCells(tableBody)).toBe(0);
  });
});
