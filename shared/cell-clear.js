import { isRowVisible } from './clipboard-utils.js';

export function isClearSelectionKey(key) {
  return key === 'Backspace' || key === 'Delete';
}

export function canClearGridSelection(activeElement, cellSelection) {
  if (cellSelection.isEditingCell(activeElement)) return false;
  if (activeElement?.isContentEditable) return false;
  if (activeElement?.classList?.contains('column-filter')) return false;
  if (
    activeElement &&
    (activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.tagName === 'SELECT')
  ) {
    return activeElement.id === 'cellValueDisplay';
  }
  return true;
}

export function clearCellsInData(csvData, coordinates) {
  if (!csvData.length || !coordinates.length) return false;

  coordinates.forEach(({ row, col }) => {
    if (!csvData[row]) return;
    csvData[row][col] = '';
  });

  return true;
}

export function getVisibleSelectedCells(tableBody) {
  if (!tableBody) return [];

  const cells = [];
  tableBody.querySelectorAll('td.cell-selected').forEach((td) => {
    const tr = td.closest('tr');
    if (!isRowVisible(tr)) return;

    cells.push({
      row: parseInt(td.dataset.rowIndex, 10),
      col: parseInt(td.dataset.columnIndex, 10),
      element: td
    });
  });

  return cells;
}

export function clearVisibleSelectedCells(tableBody, csvData) {
  const cells = getVisibleSelectedCells(tableBody);
  if (!cells.length) return false;

  cells.forEach(({ row, col, element }) => {
    if (!csvData[row]) return;
    csvData[row][col] = '';
    element.textContent = '';
  });

  return true;
}
