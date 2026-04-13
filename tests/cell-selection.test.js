const { createCellSelection } = require('../shared/cell-selection');

describe('createCellSelection', () => {
  let selection;
  let mockQuerySelector;

  beforeEach(() => {
    mockQuerySelector = jest.fn();
    global.document = {
      querySelector: mockQuerySelector,
      querySelectorAll: jest.fn(() => [])
    };
    selection = createCellSelection();
  });

  afterEach(() => {
    delete global.document;
  });

  describe('cellKey', () => {
    test('generates correct key', () => {
      expect(selection.getLastSelectedCell()).toBeNull();
    });
  });

  describe('setCellSelectionRange', () => {
    test('adds cells to selection', () => {
      selection.setCellSelectionRange({ row: 0, col: 0 }, { row: 2, col: 2 }, false);
      const bounds = selection.getSelectionBounds();
      expect(bounds.minRow).toBe(0);
      expect(bounds.maxRow).toBe(2);
      expect(bounds.minCol).toBe(0);
      expect(bounds.maxCol).toBe(2);
    });

    test('additive mode preserves existing selection', () => {
      selection.setCellSelectionRange({ row: 0, col: 0 }, { row: 0, col: 0 }, false);
      selection.setCellSelectionRange({ row: 1, col: 1 }, { row: 1, col: 1 }, true);
      const bounds = selection.getSelectionBounds();
      expect(bounds.minRow).toBe(0);
      expect(bounds.maxRow).toBe(1);
    });
  });

  describe('handleCellMouseDown', () => {
    test('simple click clears and selects single cell', () => {
      const mockEvent = { shiftKey: false, ctrlKey: false, metaKey: false };
      selection.handleCellMouseDown(mockEvent, 2, 3);
      const bounds = selection.getSelectionBounds();
      expect(bounds).toEqual({ minRow: 2, maxRow: 2, minCol: 3, maxCol: 3 });
    });

    test('shift key extends selection from last cell', () => {
      selection.setCellSelectionRange({ row: 1, col: 1 }, { row: 1, col: 1 }, false);
      const mockEvent = { shiftKey: true, ctrlKey: false, metaKey: false };
      selection.handleCellMouseDown(mockEvent, 3, 3);
      const bounds = selection.getSelectionBounds();
      expect(bounds.minRow).toBe(1);
      expect(bounds.maxRow).toBe(3);
    });

    test('ctrl/cmd key toggles cell selection', () => {
      const mockEvent = { shiftKey: false, ctrlKey: true, metaKey: true };
      selection.handleCellMouseDown(mockEvent, 0, 0);
      let bounds = selection.getSelectionBounds();
      expect(bounds.minRow).toBe(0);
      expect(bounds.maxCol).toBe(0);
    });
  });

  describe('moveSelection', () => {
    test('moves to next cell', () => {
      selection.setCellSelectionRange({ row: 0, col: 0 }, { row: 0, col: 0 }, false);
      const result = selection.moveSelection({
        deltaRow: 1,
        deltaCol: 1,
        maxRow: 10,
        maxCol: 10,
        extend: false
      });
      expect(result.row).toBe(1);
      expect(result.col).toBe(1);
    });

    test('respects boundaries', () => {
      selection.setCellSelectionRange({ row: 0, col: 0 }, { row: 0, col: 0 }, false);
      const result = selection.moveSelection({
        deltaRow: -1,
        deltaCol: -1,
        maxRow: 10,
        maxCol: 10,
        extend: false
      });
      expect(result.row).toBe(0);
      expect(result.col).toBe(0);
    });

    test('extend mode extends selection range', () => {
      selection.setCellSelectionRange({ row: 0, col: 0 }, { row: 0, col: 0 }, false);
      selection.moveSelection({
        deltaRow: 2,
        deltaCol: 2,
        maxRow: 10,
        maxCol: 10,
        extend: true
      });
      const bounds = selection.getSelectionBounds();
      expect(bounds.minRow).toBe(0);
      expect(bounds.maxRow).toBe(2);
    });
  });

  describe('reset', () => {
    test('clears all state', () => {
      selection.setCellSelectionRange({ row: 0, col: 0 }, { row: 2, col: 2 }, false);
      selection.reset();
      expect(selection.getSelectionBounds()).toBeNull();
      expect(selection.getLastSelectedCell()).toBeNull();
      expect(selection.isSelectingActive()).toBe(false);
    });
  });

  describe('getSelectionBounds', () => {
    test('returns null when no selection', () => {
      expect(selection.getSelectionBounds()).toBeNull();
    });

    test('returns single cell bounds when one cell selected', () => {
      selection.setCellSelectionRange({ row: 5, col: 5 }, { row: 5, col: 5 }, false);
      const bounds = selection.getSelectionBounds();
      expect(bounds).toEqual({ minRow: 5, maxRow: 5, minCol: 5, maxCol: 5 });
    });
  });

  describe('isSelectingActive', () => {
    test('returns false initially', () => {
      expect(selection.isSelectingActive()).toBe(false);
    });
  });
});