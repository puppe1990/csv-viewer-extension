export function columnIndexToLetter(index) {
  let result = '';
  let n = index;
  do {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return result;
}

export function formatCellRef(row, col) {
  return `${columnIndexToLetter(col)}${row + 1}`;
}

export function formatSelectionRef(bounds) {
  if (!bounds) return '';
  const start = formatCellRef(bounds.minRow, bounds.minCol);
  if (bounds.minRow === bounds.maxRow && bounds.minCol === bounds.maxCol) return start;
  const end = formatCellRef(bounds.maxRow, bounds.maxCol);
  return `${start}:${end}`;
}

export function getSelectionCellCount(bounds) {
  if (!bounds) return 0;
  return (bounds.maxRow - bounds.minRow + 1) * (bounds.maxCol - bounds.minCol + 1);
}

export function getFormulaBarValue(bounds, csvData, cellSelection) {
  if (!bounds) return '';

  const count = getSelectionCellCount(bounds);
  if (count > 1) return `${count} células selecionadas`;

  const value = csvData[bounds.minRow]?.[bounds.minCol];
  return value == null ? '' : String(value);
}

export function formatSheetStats(rowCount, colCount) {
  const rows = rowCount === 1 ? '1 linha' : `${rowCount} linhas`;
  const cols = colCount === 1 ? '1 coluna' : `${colCount} colunas`;
  return `${rows} · ${cols}`;
}

export function createSheetHeaderController(elements) {
  let currentFileName = 'Sem título';

  function setFileName(name) {
    currentFileName = name || 'Sem título';
    if (elements.fileNameEl) elements.fileNameEl.textContent = currentFileName;
  }

  function update({
    rowCount = 0,
    colCount = 0,
    selectionBounds = null,
    csvData = [],
    cellSelection
  }) {
    if (elements.statsEl) {
      elements.statsEl.textContent = formatSheetStats(rowCount, colCount);
    }

    if (elements.cellRefEl) {
      elements.cellRefEl.textContent = selectionBounds ? formatSelectionRef(selectionBounds) : '—';
    }

    if (elements.cellValueEl) {
      elements.cellValueEl.value = getFormulaBarValue(selectionBounds, csvData, cellSelection);
    }
  }

  function reset() {
    setFileName('Sem título');
    update({ rowCount: 0, colCount: 0, selectionBounds: null, csvData: [] });
  }

  return { setFileName, update, reset };
}
