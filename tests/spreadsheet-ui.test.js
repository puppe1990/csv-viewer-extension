import { describe, test, expect } from 'vitest';
import {
  columnIndexToLetter,
  formatCellRef,
  formatSelectionRef,
  formatSheetStats,
  getFormulaBarValue
} from '../shared/spreadsheet-ui.js';

describe('columnIndexToLetter', () => {
  test('converts single-letter columns', () => {
    expect(columnIndexToLetter(0)).toBe('A');
    expect(columnIndexToLetter(25)).toBe('Z');
  });

  test('converts multi-letter columns', () => {
    expect(columnIndexToLetter(26)).toBe('AA');
    expect(columnIndexToLetter(27)).toBe('AB');
  });
});

describe('formatCellRef', () => {
  test('formats spreadsheet coordinates', () => {
    expect(formatCellRef(0, 0)).toBe('A1');
    expect(formatCellRef(9, 2)).toBe('C10');
  });
});

describe('formatSelectionRef', () => {
  test('returns single cell reference', () => {
    expect(formatSelectionRef({ minRow: 0, maxRow: 0, minCol: 0, maxCol: 0 })).toBe('A1');
  });

  test('returns range reference', () => {
    expect(formatSelectionRef({ minRow: 0, maxRow: 2, minCol: 0, maxCol: 2 })).toBe('A1:C3');
  });
});

describe('formatSheetStats', () => {
  test('formats row and column counts', () => {
    expect(formatSheetStats(12, 5)).toBe('12 linhas · 5 colunas');
    expect(formatSheetStats(1, 1)).toBe('1 linha · 1 coluna');
  });
});

describe('getFormulaBarValue', () => {
  test('shows selected cell value', () => {
    const value = getFormulaBarValue({ minRow: 0, maxRow: 0, minCol: 1, maxCol: 1 }, [
      ['Nome', 'João']
    ]);
    expect(value).toBe('João');
  });

  test('shows selection count for ranges', () => {
    const value = getFormulaBarValue({ minRow: 0, maxRow: 1, minCol: 0, maxCol: 1 }, [
      ['A', 'B'],
      ['C', 'D']
    ]);
    expect(value).toBe('4 células selecionadas');
  });
});
