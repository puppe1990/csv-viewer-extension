import { parseCSV } from './shared/csv-utils.js';
import { downloadCSV, downloadExcel } from './shared/download-utils.js';
import { readFileAsText } from './shared/file-utils.js';
import { formatNumber, getDecimalCount, parseNumber } from './shared/number-utils.js';
import { loadPreference, savePreference } from './shared/storage-utils.js';
import { createCellSelection } from './shared/cell-selection.js';
import { renderTable, updateSums } from './shared/table-renderer.js';

// Estado da aplicação
let csvData = [];
let headers = [];
let currencyFormat = 'pt-BR';
let sourceFormat = 'auto';
let selectedColumnIndex = null;
let columnFilters = [];
let sortState = { columnIndex: null, direction: null };
const cellSelection = createCellSelection();

// Elementos DOM
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
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
downloadBtn.addEventListener('click', () => downloadCSV(headers, csvData));
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

// Processar arquivo CSV
function processFile(file) {
  readFileAsText(file)
    .then((text) => {
      const parsed = parseCSV(text);
      headers = parsed.headers;
      csvData = parsed.rows;
      columnFilters = Array(headers.length).fill('');
      sortState = { columnIndex: null, direction: null };
      renderTableWrapper();
      dropZone.style.display = 'none';
      editorContainer.style.display = 'flex';
    })
    .catch(() => {
      alert('Não foi possível ler o arquivo CSV.');
    });
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
    editorContainer.style.display = 'none';
    dropZone.style.display = 'flex';
    fileInput.value = '';
  }
}
