import { parseCSVAsync } from './shared/csv-utils.js';
import { downloadCSV, downloadExcel } from './shared/download-utils.js';
import { readFileAsText } from './shared/file-utils.js';
import { formatNumber, getDecimalCount, parseNumber } from './shared/number-utils.js';
import { loadPreference, savePreference } from './shared/storage-utils.js';
import { createCellSelection } from './shared/cell-selection.js';
import { applyFilters, renderTable, updateSums } from './shared/table-renderer.js';

// Estado da aplicação
let csvData = [];
let headers = [];
let currencyFormat = 'pt-BR';
let sourceFormat = 'auto';
let delimiter = ',';
let selectedColumnIndex = null;
let columnFilters = [];
let sortState = { columnIndex: null, direction: null };
const cellSelection = createCellSelection();

// Elementos DOM
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadLoader = document.getElementById('uploadLoader');
const uploadLoaderBar = document.getElementById('uploadLoaderBar');
const uploadLoaderText = document.getElementById('uploadLoaderText');
const editorContainer = document.getElementById('editorContainer');
const csvTable = document.getElementById('csvTable');
const tableHead = document.getElementById('tableHead');
const tableBody = document.getElementById('tableBody');
const tableFoot = document.getElementById('tableFoot');
const downloadBtn = document.getElementById('downloadBtn');
const downloadExcelBtn = document.getElementById('downloadExcelBtn');
const newFileBtn = document.getElementById('newFileBtn');
const sourceFormatSelect = document.getElementById('sourceFormat');
const currencyFormatSelect = document.getElementById('currencyFormat');
const convertColumnBtn = document.getElementById('convertColumnBtn');
const convertModal = document.getElementById('convertModal');
const convertFieldsList = document.getElementById('convertFieldsList');
const convertModalClose = document.getElementById('convertModalClose');
const convertCancelBtn = document.getElementById('convertCancelBtn');
const convertApplyBtn = document.getElementById('convertApplyBtn');
const convertSelectAll = document.getElementById('convertSelectAll');
const convertClearAll = document.getElementById('convertClearAll');

// Event Listeners
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('dragleave', handleDragLeave);
dropZone.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);
downloadBtn.addEventListener('click', () => downloadCSV(headers, csvData, delimiter));
downloadExcelBtn.addEventListener('click', () => downloadExcel(headers, csvData, sourceFormat));
newFileBtn.addEventListener('click', resetEditor);
convertColumnBtn.addEventListener('click', openConvertModal);
convertModalClose.addEventListener('click', closeConvertModal);
convertCancelBtn.addEventListener('click', closeConvertModal);
convertApplyBtn.addEventListener('click', applyConvertModal);
convertSelectAll.addEventListener('click', () => toggleAllFields(true));
convertClearAll.addEventListener('click', () => toggleAllFields(false));
convertModal.addEventListener('click', (e) => {
  if (e.target.dataset.close) closeConvertModal();
});
document.addEventListener('keydown', handleGridKeydown);
document.addEventListener('mouseup', () => {
  if (cellSelection.isSelectingActive()) cellSelection.stopSelection();
});

// Carregar formato de moeda salvo
loadPreference('currencyFormat').then((stored) => {
  if (stored) {
    currencyFormat = stored;
    currencyFormatSelect.value = currencyFormat;
  }
});

// Carregar formato de entrada salvo
loadPreference('sourceFormat').then((stored) => {
  if (stored) {
    sourceFormat = stored;
    sourceFormatSelect.value = sourceFormat;
  }
});

currencyFormatSelect.addEventListener('change', (e) => {
  currencyFormat = e.target.value;
  savePreference('currencyFormat', currencyFormat);
});

sourceFormatSelect.addEventListener('change', (e) => {
  sourceFormat = e.target.value;
  savePreference('sourceFormat', sourceFormat);
});

// Funções de Drag and Drop
function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.add('drag-over');
}

function handleDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove('drag-over');

  const files = e.dataTransfer.files;
  if (files.length > 0 && (files[0].type === 'text/csv' || files[0].name.endsWith('.csv'))) {
    processFile(files[0]);
  } else {
    alert('Por favor, selecione um arquivo CSV válido.');
  }
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) {
    processFile(file);
  }
}

function setUploadProgress(progress) {
  const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));
  uploadLoaderBar.style.width = `${safeProgress}%`;
  uploadLoaderText.textContent = `${safeProgress}%`;
}

function toggleUploadLoader(isVisible) {
  uploadLoader.hidden = !isVisible;
  dropZone.classList.toggle('is-loading', isVisible);
}

function waitForNextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

// Processar arquivo CSV
async function processFile(file) {
  toggleUploadLoader(true);
  setUploadProgress(0);
  let visualProgress = 0;

  const setVisualProgress = (progress) => {
    visualProgress = Math.max(visualProgress, Math.min(100, progress));
    setUploadProgress(visualProgress);
  };

  try {
    await waitForNextFrame();
    const text = await readFileAsText(file, 'UTF-8', (event) => {
      const total = event.total || file.size;
      if (!total) return;
      const readProgress = Math.min(40, (event.loaded / total) * 40);
      setVisualProgress(readProgress);
    });
    setVisualProgress(40);

    const parsed = await parseCSVAsync(text, {
      onProgress: (parseProgress) => {
        const totalProgress = 40 + (parseProgress / 100) * 55;
        setVisualProgress(totalProgress);
      }
    });
    setVisualProgress(95);
    headers = parsed.headers;
    csvData = parsed.rows;
    delimiter = parsed.delimiter || ',';
    columnFilters = Array(headers.length).fill('');
    sortState = { columnIndex: null, direction: null };
    setVisualProgress(99);
    renderTableWrapper();
    await waitForNextFrame();
    setVisualProgress(100);
    await waitForNextFrame();
    dropZone.style.display = 'none';
    editorContainer.style.display = 'flex';
  } catch {
    toggleUploadLoader(false);
    setUploadProgress(0);
    alert('Não foi possível ler o arquivo CSV.');
  }
}

// Renderizar tabela
function renderTableWrapper() {
  selectedColumnIndex = null;
  renderTable({
    state: { headers, csvData, columnFilters, sortState },
    dom: { tableHead, tableBody, tableFoot },
    cellSelection,
    onToggleSort: toggleSort,
    onHeaderCellSetup: ({ th, index }) => {
      th.addEventListener('click', () => {
        if (selectedColumnIndex === index) {
          th.classList.remove('selected');
          selectedColumnIndex = null;
          return;
        }

        document.querySelectorAll('th.column-header').forEach((h) => h.classList.remove('selected'));
        th.classList.add('selected');
        selectedColumnIndex = index;
      });
    },
    formatNumberForCell,
    parseNumber,
    sourceFormat
  });
}

function toggleSort(columnIndex) {
  const isSameColumn = sortState.columnIndex === columnIndex;
  const direction = isSameColumn && sortState.direction === 'asc' ? 'desc' : 'asc';
  sortState = { columnIndex, direction };

  csvData.sort((rowA, rowB) => {
    const valueA = rowA[columnIndex] ?? '';
    const valueB = rowB[columnIndex] ?? '';
    const numA = parseNumber(valueA, sourceFormat);
    const numB = parseNumber(valueB, sourceFormat);

    let result = 0;
    if (numA !== null && numB !== null) {
      result = numA - numB;
    } else {
      const textA = valueA.toString().toLowerCase();
      const textB = valueB.toString().toLowerCase();
      result = textA.localeCompare(textB, undefined, { numeric: true, sensitivity: 'base' });
    }

    return direction === 'asc' ? result : -result;
  });

  renderTableWrapper();
}

// Formatar número
function formatNumberForCell(num, decimals = 2) {
  return formatNumber(num, decimals, currencyFormat);
}

function handleGridKeydown(e) {
  if (!headers.length || !csvData.length) return;
  const active = document.activeElement;
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) return;
  if (active && active.isContentEditable) return;
  if (cellSelection.isEditingCell(active)) return;

  const hasMod = e.ctrlKey || e.metaKey;
  if (hasMod && e.key.toLowerCase() === 'c') {
    e.preventDefault();
    copySelectionToClipboard();
    return;
  }
  if (hasMod && e.key.toLowerCase() === 'v') {
    e.preventDefault();
    pasteFromClipboard();
    return;
  }

  const moveMap = {
    ArrowUp: { deltaRow: -1, deltaCol: 0 },
    ArrowDown: { deltaRow: 1, deltaCol: 0 },
    ArrowLeft: { deltaRow: 0, deltaCol: -1 },
    ArrowRight: { deltaRow: 0, deltaCol: 1 }
  };
  if (!moveMap[e.key]) return;

  e.preventDefault();
  if (!cellSelection.getLastSelectedCell()) {
    cellSelection.setCellSelectionRange({ row: 0, col: 0 }, { row: 0, col: 0 }, false);
  }

  const next = cellSelection.moveSelection({
    ...moveMap[e.key],
    maxRow: csvData.length - 1,
    maxCol: headers.length - 1,
    extend: e.shiftKey
  });

  if (next) {
    const cell = tableBody.querySelector(
      `td[data-row-index="${next.row}"][data-column-index="${next.col}"]`
    );
    if (cell) {
      cell.focus();
      cell.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }
}

async function copySelectionToClipboard() {
  const bounds = cellSelection.getSelectionBounds();
  if (!bounds) return;

  const rows = [];
  for (let r = bounds.minRow; r <= bounds.maxRow; r += 1) {
    const rowEl = tableBody.querySelector(`tr[data-row-index="${r}"]`);
    if (!rowEl || rowEl.style.display === 'none') continue;
    const rowValues = [];
    for (let c = bounds.minCol; c <= bounds.maxCol; c += 1) {
      rowValues.push(csvData[r]?.[c] ?? '');
    }
    rows.push(rowValues.join('\t'));
  }
  if (!rows.length) return;
  cellSelection.markCopiedRange(bounds);
  await writeClipboardText(rows.join('\n'));
}

async function pasteFromClipboard() {
  const text = await readClipboardText();
  if (!text) return;

  const rawRows = text.replace(/\r/g, '').split('\n');
  if (rawRows.length && rawRows[rawRows.length - 1] === '') rawRows.pop();
  if (!rawRows.length) return;

  const start = cellSelection.getLastSelectedCell() || { row: 0, col: 0 };
  let maxRow = start.row;
  let maxCol = start.col;

  rawRows.forEach((line, rOffset) => {
    const cells = line.split('\t');
    cells.forEach((value, cOffset) => {
      const targetRow = start.row + rOffset;
      const targetCol = start.col + cOffset;
      if (targetRow >= csvData.length || targetCol >= headers.length) return;
      if (!csvData[targetRow]) return;
      csvData[targetRow][targetCol] = value;
      const cell = tableBody.querySelector(
        `td[data-row-index="${targetRow}"][data-column-index="${targetCol}"]`
      );
      if (cell) cell.textContent = value;
      if (targetRow > maxRow) maxRow = targetRow;
      if (targetCol > maxCol) maxCol = targetCol;
    });
  });

  cellSelection.setCellSelectionRange(
    { row: start.row, col: start.col },
    { row: maxRow, col: maxCol },
    false
  );
  updateSums({ headers, csvData, columnFilters, sortState }, { tableHead, tableBody, tableFoot }, formatNumberForCell, parseNumber, sourceFormat);
  applyFilters({ headers, csvData, columnFilters, sortState }, { tableHead, tableBody, tableFoot });
}

async function writeClipboardText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (err) {
      // fallback below
    }
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

async function readClipboardText() {
  if (navigator.clipboard && navigator.clipboard.readText) {
    try {
      return await navigator.clipboard.readText();
    } catch (err) {
      return '';
    }
  }
  return '';
}

// Aplicar formato de moeda
function openConvertModal() {
  if (!headers.length) {
    alert('Nenhuma coluna disponível para converter.');
    return;
  }

  buildConvertFields();
  convertModal.classList.add('is-open');
  convertModal.setAttribute('aria-hidden', 'false');
}

function closeConvertModal() {
  convertModal.classList.remove('is-open');
  convertModal.setAttribute('aria-hidden', 'true');
}

function buildConvertFields() {
  convertFieldsList.innerHTML = '';
  headers.forEach((header, index) => {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = index;
    checkbox.checked = index === selectedColumnIndex;
    const name = document.createElement('span');
    name.textContent = header || `Coluna ${index + 1}`;
    label.appendChild(checkbox);
    label.appendChild(name);
    convertFieldsList.appendChild(label);
  });
}

function toggleAllFields(checked) {
  convertFieldsList.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.checked = checked;
  });
}

function applyConvertModal() {
  const selected = Array.from(convertFieldsList.querySelectorAll('input[type="checkbox"]:checked'))
    .map(input => parseInt(input.value, 10));

  if (selected.length === 0) {
    alert('Selecione pelo menos uma coluna para converter.');
    return;
  }

  convertColumns(selected);
  closeConvertModal();
}

function convertColumns(columnIndexes) {
  columnIndexes.forEach((colIdx) => {
    csvData.forEach((row, rowIndex) => {
      const value = row[colIdx];
      if (value) {
        const num = parseNumber(value, sourceFormat);
        if (num !== null) {
          const decimals = getDecimalCount(value, sourceFormat);
          row[colIdx] = formatNumberForCell(num, decimals);
          const cell = document.querySelector(`td[data-row-index="${rowIndex}"][data-column-index="${colIdx}"]`);
          if (cell) {
            cell.textContent = row[colIdx];
          }
        }
      }
    });
  });

  updateSums({ headers, csvData, columnFilters, sortState }, { tableHead, tableBody, tableFoot }, formatNumberForCell, parseNumber, sourceFormat);
}

// Download CSV/Excel é tratado em shared/download-utils.js

// Resetar editor
function resetEditor() {
  if (confirm('Deseja criar um novo arquivo? Os dados atuais serão perdidos.')) {
    csvData = [];
    headers = [];
    delimiter = ',';
    editorContainer.style.display = 'none';
    dropZone.style.display = 'flex';
    toggleUploadLoader(false);
    setUploadProgress(0);
    fileInput.value = '';
  }
}
