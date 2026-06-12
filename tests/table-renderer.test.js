import { describe, test, expect, beforeEach } from 'vitest';
import { calculateColumnSum, updateSums, applyFilters } from '../shared/table-renderer.js';
import { parseNumber } from '../shared/number-utils.js';

describe('calculateColumnSum', () => {
  const sourceFormat = 'en-US';

  test('sums all numeric values in a column', () => {
    const rows = [
      ['10'],
      ['20'],
      ['30']
    ];
    const result = calculateColumnSum(rows, 0, parseNumber, sourceFormat);
    expect(result).toBe(60);
  });

  test('returns null when no numeric values exist', () => {
    const rows = [
      ['abc'],
      ['def']
    ];
    const result = calculateColumnSum(rows, 0, parseNumber, sourceFormat);
    expect(result).toBeNull();
  });

  test('sums only visible rows when visibleRowIndexes is provided', () => {
    const rows = [
      ['10'],
      ['20'],
      ['30'],
      ['40']
    ];
    const result = calculateColumnSum(rows, 0, parseNumber, sourceFormat, [0, 2]);
    expect(result).toBe(40);
  });

  test('sums only visible rows with pt-BR format', () => {
    const rows = [
      ['1.000,50'],
      ['2.000,25'],
      ['3.000,00'],
      ['4.000,75']
    ];
    const result = calculateColumnSum(rows, 0, parseNumber, 'pt-BR', [1, 3]);
    expect(result).toBeCloseTo(6001, 0);
  });

  test('returns null when visibleRowIndexes is empty', () => {
    const rows = [
      ['10'],
      ['20']
    ];
    const result = calculateColumnSum(rows, 0, parseNumber, sourceFormat, []);
    expect(result).toBeNull();
  });

  test('skips non-numeric values in visible rows', () => {
    const rows = [
      ['10'],
      ['abc'],
      ['30']
    ];
    const result = calculateColumnSum(rows, 0, parseNumber, sourceFormat, [0, 1, 2]);
    expect(result).toBe(40);
  });

  test('does not sum date values in a column', () => {
    const rows = [
      ['05/06/2026'],
      ['09/06/2026'],
      ['10/06/2026'],
      ['11/06/2026']
    ];
    const result = calculateColumnSum(rows, 0, parseNumber, 'pt-BR');
    expect(result).toBeNull();
  });

  test('does not sum text with digits embedded in description', () => {
    const rows = [
      ['Pix recebido de João, ref 12345'],
      ['TRANSF ENVIADA PIX agencia 0001']
    ];
    const result = calculateColumnSum(rows, 0, parseNumber, 'auto');
    expect(result).toBeNull();
  });

  test('does not sum text descriptions with embedded digits', () => {
    const rows = [
      ['Pix recebido de BEATRIZ VITORIA FERREIRA DA SILVA'],
      ['Pix recebido de Marcilene Pereira Moura'],
      ['TRANSF ENVIADA PIX'],
      ['Pix recebido de MARIA ANTONIELE S COSTA'],
      ['Pix recebido de Francisco Leonardo Soares Fernandes'],
      ['TRANSF ENVIADA PIX']
    ];
    const result = calculateColumnSum(rows, 0, parseNumber, 'auto');
    expect(result).toBeNull();
  });

  test('does not sum category or type text columns', () => {
    const rows = [
      ['Entrada'],
      ['Saida'],
      ['Outros'],
      ['PJ'],
      ['PIX'],
      ['Dinheiro']
    ];
    const result = calculateColumnSum(rows, 0, parseNumber, 'pt-BR');
    expect(result).toBeNull();
  });

  test('still sums currency values when another column has dates', () => {
    const rows = [
      ['05/06/2026', 'R$ 120,00'],
      ['09/06/2026', 'R$ 100,00'],
      ['10/06/2026', 'R$ 49,90']
    ];
    const dataSum = calculateColumnSum(rows, 0, parseNumber, 'pt-BR');
    const valorSum = calculateColumnSum(rows, 1, parseNumber, 'pt-BR');
    expect(dataSum).toBeNull();
    expect(valorSum).toBeCloseTo(269.9, 2);
  });
});

describe('updateSums with filters', () => {
  const sourceFormat = 'en-US';

  function createMockDom() {
    const foot = document.createElement('tfoot');
    const body = document.createElement('tbody');
    const head = document.createElement('thead');

    const rows = [
      { data: ['10', '20'], visible: true },
      { data: ['30', '40'], visible: false },
      { data: ['50', '60'], visible: true }
    ];

    rows.forEach((row, i) => {
      const tr = document.createElement('tr');
      tr.dataset.rowIndex = i;
      tr.style.display = row.visible ? '' : 'none';
      row.data.forEach((val, ci) => {
        const td = document.createElement('td');
        td.dataset.rowIndex = i;
        td.dataset.columnIndex = ci;
        td.textContent = val;
        tr.appendChild(td);
      });
      const rowNumTd = document.createElement('td');
      rowNumTd.className = 'row-number-cell';
      tr.prepend(rowNumTd);
      body.appendChild(tr);
    });

    const headerRow = document.createElement('tr');
    const th0 = document.createElement('th');
    th0.textContent = 'A';
    const th1 = document.createElement('th');
    th1.textContent = 'B';
    headerRow.appendChild(th0);
    headerRow.appendChild(th1);
    head.appendChild(headerRow);

    return { tableFoot: foot, tableBody: body, tableHead: head };
  }

  test('updateSums only sums visible (non-hidden) rows', () => {
    const dom = createMockDom();
    const state = {
      headers: ['A', 'B'],
      csvData: [['10', '20'], ['30', '40'], ['50', '60']],
      columnFilters: ['', ''],
      sortState: { columnIndex: null, direction: null }
    };
    const formatFn = (n, d) => n.toFixed(d);

    updateSums(state, dom, formatFn, parseNumber, sourceFormat);

    const cells = dom.tableFoot.querySelectorAll('.sum-cell');
    expect(cells[0].textContent).toBe('60.00');
    expect(cells[1].textContent).toBe('80.00');
  });
});

describe('applyFilters + updateSums integration', () => {
  const sourceFormat = 'pt-BR';

  let dom;
  let state;

  beforeEach(() => {
    const foot = document.createElement('tfoot');
    const body = document.createElement('tbody');
    const head = document.createElement('thead');

    state = {
      headers: ['DATA', 'DESCRIÇÃO', 'TIPO', 'VALOR'],
      csvData: [
        ['01/06/2026', 'Pix recebido de Alice', 'Entrada', 'R$ 120,00'],
        ['02/06/2026', 'Pix recebido de Bob', 'Entrada', 'R$ 100,00'],
        ['03/06/2026', 'Pix recebido de Carol', 'Saída', 'R$ 49,90'],
        ['04/06/2026', 'Pix recebido de Dave', 'Entrada', 'R$ 49,90']
      ],
      columnFilters: ['', '', '', ''],
      sortState: { columnIndex: null, direction: null }
    };

    state.csvData.forEach((row, rowIndex) => {
      const tr = document.createElement('tr');
      tr.dataset.rowIndex = rowIndex;
      const rowNumTd = document.createElement('td');
      rowNumTd.className = 'row-number-cell';
      tr.appendChild(rowNumTd);
      row.forEach((val, colIndex) => {
        const td = document.createElement('td');
        td.dataset.rowIndex = rowIndex;
        td.dataset.columnIndex = colIndex;
        td.textContent = val;
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });

    dom = { tableFoot: foot, tableBody: body, tableHead: head };
  });

  const formatFn = (n, d) =>
    new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: d,
      maximumFractionDigits: d
    }).format(n);

  test('sums all VALOR values when no filter is active', () => {
    applyFilters(state, dom);
    updateSums(state, dom, formatFn, parseNumber, sourceFormat);

    const cells = dom.tableFoot.querySelectorAll('.sum-cell');
    expect(cells[3].textContent).toBe('319,80');
  });

  test('sums only filtered VALOR rows when TIPO filter is Entrada', () => {
    state.columnFilters[2] = 'Entrada';
    applyFilters(state, dom);
    updateSums(state, dom, formatFn, parseNumber, sourceFormat);

    const cells = dom.tableFoot.querySelectorAll('.sum-cell');
    expect(cells[3].textContent).toBe('269,90');
  });

  test('sums only filtered VALOR rows when VALOR filter matches 49,90', () => {
    state.columnFilters[3] = '49,90';
    applyFilters(state, dom);
    updateSums(state, dom, formatFn, parseNumber, sourceFormat);

    const cells = dom.tableFoot.querySelectorAll('.sum-cell');
    expect(cells[3].textContent).toBe('99,80');
  });

  test('updateSums does not sum DATA column with date values', () => {
    applyFilters(state, dom);
    updateSums(state, dom, formatFn, parseNumber, sourceFormat);

    const cells = dom.tableFoot.querySelectorAll('.sum-cell');
    expect(cells[0].textContent).toBe('');
    expect(cells[3].textContent).toBe('319,80');
  });

  test('updateSums does not sum DESCRIÇÃO text column', () => {
    applyFilters(state, dom);
    updateSums(state, dom, formatFn, parseNumber, sourceFormat);

    const cells = dom.tableFoot.querySelectorAll('.sum-cell');
    expect(cells[1].textContent).toBe('');
  });
});