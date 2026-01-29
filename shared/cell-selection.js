export function createCellSelection() {
  const selectedCells = new Set();
  let lastSelectedCell = null;
  let isSelecting = false;
  let selectionStartCell = null;
  let editingCell = null;
  let keyboardAnchorCell = null;
  let copiedBounds = null;

  function cellKey(row, col) {
    return `${row}:${col}`;
  }

  function clearCellSelection() {
    document.querySelectorAll('td.cell-selected').forEach((cell) => {
      cell.classList.remove('cell-selected');
    });
    selectedCells.clear();
  }

  function clearCopiedRange() {
    document.querySelectorAll('td.cell-copied').forEach((cell) => {
      cell.classList.remove('cell-copied');
    });
    copiedBounds = null;
  }

  function markCopiedRange(bounds) {
    clearCopiedRange();
    if (!bounds) return;
    copiedBounds = bounds;
    for (let r = bounds.minRow; r <= bounds.maxRow; r += 1) {
      for (let c = bounds.minCol; c <= bounds.maxCol; c += 1) {
        const cell = document.querySelector(`td[data-row-index="${r}"][data-column-index="${c}"]`);
        if (cell) cell.classList.add('cell-copied');
      }
    }
  }

  function addCellToSelection(row, col) {
    const key = cellKey(row, col);
    if (selectedCells.has(key)) return;
    selectedCells.add(key);
    const cell = document.querySelector(`td[data-row-index="${row}"][data-column-index="${col}"]`);
    if (cell) cell.classList.add('cell-selected');
  }

  function removeCellFromSelection(row, col) {
    const key = cellKey(row, col);
    if (!selectedCells.has(key)) return;
    selectedCells.delete(key);
    const cell = document.querySelector(`td[data-row-index="${row}"][data-column-index="${col}"]`);
    if (cell) cell.classList.remove('cell-selected');
  }

  function setCellSelectionRange(start, end, additive) {
    if (!additive) clearCellSelection();
    const rowStart = Math.min(start.row, end.row);
    const rowEnd = Math.max(start.row, end.row);
    const colStart = Math.min(start.col, end.col);
    const colEnd = Math.max(start.col, end.col);

    for (let r = rowStart; r <= rowEnd; r += 1) {
      for (let c = colStart; c <= colEnd; c += 1) {
        addCellToSelection(r, c);
      }
    }
    lastSelectedCell = { row: end.row, col: end.col };
  }

  function handleCellMouseDown(e, row, col) {
    const current = { row, col };
    keyboardAnchorCell = null;
    if (e.shiftKey && lastSelectedCell) {
      setCellSelectionRange(lastSelectedCell, current, false);
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      if (selectedCells.has(cellKey(row, col))) {
        removeCellFromSelection(row, col);
      } else {
        addCellToSelection(row, col);
      }
      lastSelectedCell = current;
      return;
    }

    setCellSelectionRange(current, current, false);
    isSelecting = true;
    selectionStartCell = current;
  }

  function startEditingCell(cell) {
    if (editingCell && editingCell !== cell) {
      finishEditingCell(editingCell);
    }
    const row = parseInt(cell.dataset.rowIndex, 10);
    const col = parseInt(cell.dataset.columnIndex, 10);
    setCellSelectionRange({ row, col }, { row, col }, false);
    keyboardAnchorCell = null;
    cell.contentEditable = true;
    cell.classList.add('is-editing');
    editingCell = cell;
    cell.focus();

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(cell);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function finishEditingCell(cell) {
    cell.contentEditable = false;
    cell.classList.remove('is-editing');
    if (editingCell === cell) editingCell = null;
  }

  function isEditingCell(cell) {
    return editingCell === cell;
  }

  function isSelectingActive() {
    return isSelecting;
  }

  function getSelectionStart() {
    return selectionStartCell;
  }

  function stopSelection() {
    isSelecting = false;
    selectionStartCell = null;
  }

  function getLastSelectedCell() {
    return lastSelectedCell;
  }

  function getSelectionBounds() {
    if (selectedCells.size === 0) {
      if (!lastSelectedCell) return null;
      return {
        minRow: lastSelectedCell.row,
        maxRow: lastSelectedCell.row,
        minCol: lastSelectedCell.col,
        maxCol: lastSelectedCell.col
      };
    }

    let minRow = Infinity;
    let maxRow = -Infinity;
    let minCol = Infinity;
    let maxCol = -Infinity;

    selectedCells.forEach((key) => {
      const [rowStr, colStr] = key.split(':');
      const row = parseInt(rowStr, 10);
      const col = parseInt(colStr, 10);
      if (row < minRow) minRow = row;
      if (row > maxRow) maxRow = row;
      if (col < minCol) minCol = col;
      if (col > maxCol) maxCol = col;
    });

    return { minRow, maxRow, minCol, maxCol };
  }

  function moveSelection({ deltaRow, deltaCol, maxRow, maxCol, extend }) {
    if (!lastSelectedCell) return null;
    const row = Math.max(0, Math.min(maxRow, lastSelectedCell.row + deltaRow));
    const col = Math.max(0, Math.min(maxCol, lastSelectedCell.col + deltaCol));
    const next = { row, col };

    if (extend) {
      if (!keyboardAnchorCell) keyboardAnchorCell = lastSelectedCell;
      setCellSelectionRange(keyboardAnchorCell, next, false);
    } else {
      keyboardAnchorCell = null;
      setCellSelectionRange(next, next, false);
    }

    return next;
  }

  function reset() {
    clearCellSelection();
    lastSelectedCell = null;
    isSelecting = false;
    selectionStartCell = null;
    keyboardAnchorCell = null;
    clearCopiedRange();
    if (editingCell) finishEditingCell(editingCell);
  }

  return {
    addCellToSelection,
    clearCellSelection,
    clearCopiedRange,
    finishEditingCell,
    getSelectionStart,
    getSelectionBounds,
    getLastSelectedCell,
    handleCellMouseDown,
    isEditingCell,
    isSelectingActive,
    markCopiedRange,
    moveSelection,
    removeCellFromSelection,
    reset,
    setCellSelectionRange,
    startEditingCell,
    stopSelection
  };
}
