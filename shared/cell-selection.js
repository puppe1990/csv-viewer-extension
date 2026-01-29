export function createCellSelection() {
  const selectedCells = new Set();
  let lastSelectedCell = null;
  let isSelecting = false;
  let selectionStartCell = null;
  let editingCell = null;

  function cellKey(row, col) {
    return `${row}:${col}`;
  }

  function clearCellSelection() {
    document.querySelectorAll('td.cell-selected').forEach((cell) => {
      cell.classList.remove('cell-selected');
    });
    selectedCells.clear();
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

  function reset() {
    clearCellSelection();
    lastSelectedCell = null;
    isSelecting = false;
    selectionStartCell = null;
    if (editingCell) finishEditingCell(editingCell);
  }

  return {
    addCellToSelection,
    clearCellSelection,
    finishEditingCell,
    getSelectionStart,
    handleCellMouseDown,
    isEditingCell,
    isSelectingActive,
    removeCellFromSelection,
    reset,
    setCellSelectionRange,
    startEditingCell,
    stopSelection
  };
}
