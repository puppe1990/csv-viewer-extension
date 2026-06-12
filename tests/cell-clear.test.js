import { describe, test, expect, beforeEach } from 'vitest';
import {
  canClearGridSelection,
  clearCellsInData,
  clearVisibleSelectedCells,
  getVisibleSelectedCells,
  isClearSelectionKey
} from '../shared/cell-clear.js';

describe('isClearSelectionKey', () => {
  test('accepts Mac Delete and Backspace keys', () => {
    expect(isClearSelectionKey('Backspace')).toBe(true);
    expect(isClearSelectionKey('Delete')).toBe(true);
    expect(isClearSelectionKey('Enter')).toBe(false);
  });
});

describe('canClearGridSelection', () => {
  const cellSelection = {
    isEditingCell: (el) => el?.dataset?.editing === 'true'
  };

  test('blocks clear while a filter input is focused', () => {
    const filterInput = { classList: { contains: (name) => name === 'column-filter' } };
    expect(canClearGridSelection(filterInput, cellSelection)).toBe(false);
  });

  test('allows clear when a table cell is focused', () => {
    const tableCell = { tagName: 'TD' };
    expect(canClearGridSelection(tableCell, cellSelection)).toBe(true);
  });
});

describe('clearCellsInData', () => {
  test('clears every coordinate in the data model', () => {
    const csvData = [
      ['2026-06-01', 'Pix recebido', 'Entrada', 'R$ 200,00'],
      ['2026-06-02', 'Pix recebido', 'Entrada', 'R$ 120,00']
    ];

    const cleared = clearCellsInData(csvData, [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 }
    ]);

    expect(cleared).toBe(true);
    expect(csvData[0]).toEqual(['', '', '', '']);
    expect(csvData[1][3]).toBe('R$ 120,00');
  });
});

describe('clearVisibleSelectedCells', () => {
  let tableBody;
  let csvData;

  beforeEach(() => {
    document.body.innerHTML = `
      <table>
        <tbody id="tableBody"></tbody>
      </table>
    `;
    tableBody = document.getElementById('tableBody');
    csvData = [
      [
        '01/06/2026',
        'Pix recebido de MATHEUS',
        'Entrada',
        'Outros',
        'PJ',
        'PIX',
        'R$ 200,00',
        '',
        ''
      ]
    ];

    const tr = document.createElement('tr');
    tr.dataset.rowIndex = '0';

    const rowNumber = document.createElement('td');
    rowNumber.textContent = '1';
    tr.appendChild(rowNumber);

    for (let colIndex = 0; colIndex < 9; colIndex += 1) {
      const td = document.createElement('td');
      td.dataset.rowIndex = '0';
      td.dataset.columnIndex = String(colIndex);
      td.textContent = csvData[0][colIndex];
      if (colIndex >= 1) td.classList.add('cell-selected');
      tr.appendChild(td);
    }

    tableBody.appendChild(tr);
  });

  test('clears a full selected row like the spreadsheet screenshot case', () => {
    const cleared = clearVisibleSelectedCells(tableBody, csvData);

    expect(cleared).toBe(true);
    expect(csvData[0]).toEqual(['01/06/2026', '', '', '', '', '', '', '', '']);
    expect(getVisibleSelectedCells(tableBody)).toHaveLength(8);
    tableBody.querySelectorAll('td.cell-selected').forEach((td) => {
      if (td.dataset.columnIndex === '0') return;
      expect(td.textContent).toBe('');
    });
  });

  test('skips selected cells hidden by filters', () => {
    tableBody.querySelector('tr').style.display = 'none';
    tableBody.querySelectorAll('td.cell-selected').forEach((td) => {
      td.classList.add('cell-selected');
    });

    expect(clearVisibleSelectedCells(tableBody, csvData)).toBe(false);
    expect(csvData[0][6]).toBe('R$ 200,00');
  });
});
