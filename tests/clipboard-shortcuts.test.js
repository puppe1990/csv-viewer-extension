import { describe, test, expect } from 'vitest';
import { canHandleGridClipboard, shouldInterceptGridCopy } from '../shared/clipboard-utils.js';

describe('grid clipboard shortcuts with filters', () => {
  const cellSelection = {
    isEditingCell: (el) => el?.dataset?.editing === 'true'
  };

  test('allows copy when focus is on a column filter input', () => {
    const filterInput = { classList: { contains: (name) => name === 'column-filter' } };
    expect(canHandleGridClipboard(filterInput, cellSelection)).toBe(true);
    expect(shouldInterceptGridCopy(filterInput)).toBe(true);
  });

  test('blocks copy while editing a cell', () => {
    const editingCell = { dataset: { editing: 'true' }, isContentEditable: true };
    expect(canHandleGridClipboard(editingCell, cellSelection)).toBe(false);
  });

  test('allows copy from the formula bar input', () => {
    const formulaInput = { id: 'cellValueDisplay', tagName: 'INPUT' };
    expect(canHandleGridClipboard(formulaInput, cellSelection)).toBe(true);
    expect(shouldInterceptGridCopy(formulaInput)).toBe(true);
  });
});
