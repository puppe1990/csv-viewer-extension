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

export function getFormulaBarValue(bounds, csvData, options = {}) {
  if (!bounds) return '';

  const { tableBody, countVisibleSelected } = options;
  const visibleCount =
    typeof countVisibleSelected === 'function' && tableBody
      ? countVisibleSelected(tableBody)
      : getSelectionCellCount(bounds);

  if (visibleCount > 1) return `${visibleCount} células selecionadas`;

  if (visibleCount === 1 && tableBody) {
    const selected = [...tableBody.querySelectorAll('td.cell-selected')].find((td) => {
      const tr = td.closest('tr');
      return tr && tr.style.display !== 'none';
    });
    if (selected) {
      const rowIndex = parseInt(selected.dataset.rowIndex, 10);
      const colIndex = parseInt(selected.dataset.columnIndex, 10);
      const value = csvData[rowIndex]?.[colIndex];
      return value == null ? '' : String(value);
    }
  }

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
    tableBody = null,
    countVisibleSelected = null
  }) {
    if (elements.statsEl) {
      elements.statsEl.textContent = formatSheetStats(rowCount, colCount);
    }

    if (elements.cellRefEl) {
      elements.cellRefEl.textContent = selectionBounds ? formatSelectionRef(selectionBounds) : '—';
    }

    if (elements.cellValueEl) {
      elements.cellValueEl.value = getFormulaBarValue(selectionBounds, csvData, {
        tableBody,
        countVisibleSelected
      });
    }
  }

  function reset() {
    setFileName('Sem título');
    update({ rowCount: 0, colCount: 0, selectionBounds: null, csvData: [] });
  }

  return { setFileName, update, reset };
}
