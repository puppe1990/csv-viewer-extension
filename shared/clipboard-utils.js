export function isRowVisible(rowEl) {
  return Boolean(rowEl) && rowEl.style.display !== 'none';
}

export function canHandleGridClipboard(activeElement, cellSelection) {
  if (!activeElement) return true;
  if (cellSelection.isEditingCell(activeElement)) return false;
  if (activeElement.isContentEditable) return false;
  return true;
}

export function shouldInterceptGridCopy(activeElement) {
  if (!activeElement) return true;
  if (activeElement.classList?.contains('column-filter')) return true;
  if (activeElement.id === 'cellValueDisplay') return true;
  if (activeElement.tagName === 'TD') return true;
  if (activeElement === document.body) return true;
  return false;
}

export function hasCopyableGridSelection(cellSelection, tableBody, csvData) {
  const bounds = cellSelection.getSelectionBounds();
  const text = buildCopyText(tableBody, csvData);
  return Boolean(bounds && text);
}

export function copyTextToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  let copied;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }

  document.body.removeChild(textarea);

  if (copied) return Promise.resolve(true);

  if (navigator.clipboard?.writeText) {
    return navigator.clipboard
      .writeText(text)
      .then(() => true)
      .catch(() => false);
  }

  return Promise.resolve(false);
}

export function countVisibleSelectedCells(tableBody) {
  if (!tableBody) return 0;
  let count = 0;
  tableBody.querySelectorAll('td.cell-selected').forEach((td) => {
    if (isRowVisible(td.closest('tr'))) count += 1;
  });
  return count;
}

export function buildCopyText(tableBody, csvData) {
  if (!tableBody) return null;

  const selected = tableBody.querySelectorAll('td.cell-selected');
  if (!selected.length) return null;

  const byRow = new Map();
  selected.forEach((td) => {
    const tr = td.closest('tr');
    if (!isRowVisible(tr)) return;

    const rowIndex = parseInt(td.dataset.rowIndex, 10);
    const colIndex = parseInt(td.dataset.columnIndex, 10);
    if (!byRow.has(rowIndex)) byRow.set(rowIndex, []);
    byRow.get(rowIndex).push({
      col: colIndex,
      value: csvData[rowIndex]?.[colIndex] ?? ''
    });
  });

  if (!byRow.size) return null;

  const sortedRowIndices = [...byRow.keys()].sort((a, b) => a - b);
  let minCol = Infinity;
  let maxCol = -Infinity;

  sortedRowIndices.forEach((rowIndex) => {
    byRow.get(rowIndex).forEach(({ col }) => {
      if (col < minCol) minCol = col;
      if (col > maxCol) maxCol = col;
    });
  });

  return sortedRowIndices
    .map((rowIndex) => {
      const cells = byRow.get(rowIndex);
      const values = [];
      for (let col = minCol; col <= maxCol; col += 1) {
        const found = cells.find((cell) => cell.col === col);
        values.push(found ? found.value : '');
      }
      return values.join('\t');
    })
    .join('\n');
}
