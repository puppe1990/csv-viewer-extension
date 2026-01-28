// Estado da aplicação
let csvData = [];
let headers = [];
let currencyFormat = 'pt-BR';
let sourceFormat = 'auto';
let selectedColumnIndexes = [];
let lastSelectedIndex = null;
let isMouseSelecting = false;
let selectionStartIndex = null;
let columnFilters = [];

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
downloadBtn.addEventListener('click', downloadCSV);
downloadExcelBtn.addEventListener('click', downloadExcel);
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
  if (isMouseSelecting) {
    isMouseSelecting = false;
    selectionStartIndex = null;
  }
});

// Carregar formato de moeda salvo
chrome.storage.local.get(['currencyFormat'], (result) => {
  if (result.currencyFormat) {
    currencyFormat = result.currencyFormat;
    currencyFormatSelect.value = currencyFormat;
  }
});

// Carregar formato de entrada salvo
chrome.storage.local.get(['sourceFormat'], (result) => {
  if (result.sourceFormat) {
    sourceFormat = result.sourceFormat;
    sourceFormatSelect.value = sourceFormat;
  }
});

currencyFormatSelect.addEventListener('change', (e) => {
  currencyFormat = e.target.value;
  chrome.storage.local.set({ currencyFormat });
});

sourceFormatSelect.addEventListener('change', (e) => {
  sourceFormat = e.target.value;
  chrome.storage.local.set({ sourceFormat });
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
  if (files.length > 0 && files[0].type === 'text/csv' || files[0].name.endsWith('.csv')) {
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
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    parseCSV(text);
    renderTable();
    dropZone.style.display = 'none';
    editorContainer.style.display = 'flex';
  };
  reader.readAsText(file, 'UTF-8');
}

// Parse CSV
function parseCSV(text) {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return;

  // Detectar delimitador (vírgula ou ponto e vírgula)
  const delimiter = text.includes(';') ? ';' : ',';
  
  headers = parseCSVLine(lines[0], delimiter);
  csvData = [];
  columnFilters = Array(headers.length).fill('');

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i], delimiter);
    if (row.length > 0) {
      csvData.push(row);
    }
  }
}

// Parse uma linha CSV considerando aspas
function parseCSVLine(line, delimiter) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Pular próxima aspas
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Renderizar tabela
function renderTable() {
  // Limpar tabela
  tableHead.innerHTML = '';
  tableBody.innerHTML = '';
  tableFoot.innerHTML = '';
  selectedColumnIndexes = [];
  lastSelectedIndex = null;

  // Cabeçalho
  const headerRow = document.createElement('tr');
  headers.forEach((header, index) => {
    const th = document.createElement('th');
    th.textContent = header || `Coluna ${index + 1}`;
    th.dataset.columnIndex = index;
    th.classList.add('column-header');
    th.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        handleColumnSelection(e, index, th);
        return;
      }

      e.preventDefault();
      isMouseSelecting = true;
      selectionStartIndex = index;
      setColumnSelectionRange(selectionStartIndex, index);
      lastSelectedIndex = index;
    });
    th.addEventListener('mouseenter', () => {
      if (!isMouseSelecting || selectionStartIndex === null) return;
      setColumnSelectionRange(selectionStartIndex, index);
    });
    headerRow.appendChild(th);
  });
  tableHead.appendChild(headerRow);
  updateSelectionIndicator();

  const filterRow = document.createElement('tr');
  filterRow.classList.add('column-filter-row');
  headers.forEach((_, index) => {
    const th = document.createElement('th');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'column-filter';
    input.placeholder = 'Filtrar...';
    input.value = columnFilters[index] || '';
    input.addEventListener('input', (e) => {
      columnFilters[index] = e.target.value;
      applyFilters();
    });
    th.appendChild(input);
    filterRow.appendChild(th);
  });
  tableHead.appendChild(filterRow);

  // Corpo da tabela
  csvData.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50 border-b border-gray-100';
    headers.forEach((_, colIndex) => {
      const td = document.createElement('td');
      td.contentEditable = true;
      td.className = 'editable';
      td.textContent = row[colIndex] || '';
      td.dataset.rowIndex = rowIndex;
      td.dataset.columnIndex = colIndex;
      
      // Atualizar dados ao editar
      td.addEventListener('blur', (e) => {
        const rIdx = parseInt(e.target.dataset.rowIndex);
        const cIdx = parseInt(e.target.dataset.columnIndex);
        if (csvData[rIdx]) {
          csvData[rIdx][cIdx] = e.target.textContent;
        }
        updateSums();
        applyFilters();
      });

      // Enter para próxima célula
      td.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const nextRow = tr.nextElementSibling;
          if (nextRow) {
            const nextCell = nextRow.children[colIndex];
            if (nextCell) nextCell.focus();
          }
        }
      });

      tr.appendChild(td);
    });
    tableBody.appendChild(tr);
  });

  // Rodapé com somas
  updateSums();
  applyFilters();
}

function applyFilters() {
  const rows = tableBody.querySelectorAll('tr');
  rows.forEach((tr) => {
    const rowIndex = parseInt(tr.children[0]?.dataset.rowIndex, 10);
    const row = csvData[rowIndex] || [];
    const matches = columnFilters.every((filterValue, colIndex) => {
      if (!filterValue) return true;
      const cell = row[colIndex] || '';
      return cell.toString().toLowerCase().includes(filterValue.toLowerCase());
    });
    tr.style.display = matches ? '' : 'none';
  });
}

// Atualizar somas das colunas
function updateSums() {
  tableFoot.innerHTML = '';
  const footerRow = document.createElement('tr');
  
  headers.forEach((_, colIndex) => {
    const td = document.createElement('td');
    const sum = calculateColumnSum(colIndex);
    td.className = 'sum-cell';
    td.textContent = sum !== null ? formatNumber(sum, 2) : '';
    footerRow.appendChild(td);
  });
  
  tableFoot.appendChild(footerRow);
}

// Calcular soma de uma coluna
function calculateColumnSum(columnIndex) {
  let sum = 0;
  let hasNumbers = false;

  csvData.forEach(row => {
    const value = row[columnIndex];
    if (value) {
      const num = parseNumber(value, sourceFormat);
      if (num !== null) {
        sum += num;
        hasNumbers = true;
      }
    }
  });

  return hasNumbers ? sum : null;
}

// Formatar número
function formatNumber(num, decimals = 2) {
  if (num === null || isNaN(num)) return '';
  return new Intl.NumberFormat(currencyFormat, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}

function getDecimalCount(value, format) {
  if (value === null || value === undefined) return 0;
  const raw = value.toString().trim();
  if (!raw) return 0;

  const cleaned = raw.replace(/[^\d.,]/g, '');
  if (!cleaned) return 0;

  if (format === 'en-US') {
    const idx = cleaned.lastIndexOf('.');
    if (idx === -1) return 0;
    return cleaned.slice(idx + 1).replace(/[^\d]/g, '').length;
  }

  if (format === 'pt-BR') {
    const idx = cleaned.lastIndexOf(',');
    if (idx === -1) return 0;
    return cleaned.slice(idx + 1).replace(/[^\d]/g, '').length;
  }

  const lastDot = cleaned.lastIndexOf('.');
  const lastComma = cleaned.lastIndexOf(',');
  if (lastDot === -1 && lastComma === -1) return 0;

  const decimalSep = lastDot > lastComma ? '.' : ',';
  const idx = cleaned.lastIndexOf(decimalSep);
  const frac = cleaned.slice(idx + 1).replace(/[^\d]/g, '');
  const intPart = cleaned.slice(0, idx).replace(/[^\d]/g, '');

  if (frac.length === 0) return 0;
  if (frac.length === 3 && intPart.length > 0) return 0;
  return frac.length;
}

function parseNumber(value, format) {
  if (value === null || value === undefined) return null;
  let str = value.toString().trim();
  if (!str) return null;

  let negative = false;
  if (str.includes('(') && str.includes(')')) negative = true;
  if (str.includes('-')) negative = true;

  str = str.replace(/[^\d.,]/g, '');
  if (!str) return null;

  let normalized = str;
  if (format === 'en-US') {
    normalized = str.replace(/,/g, '');
  } else if (format === 'pt-BR') {
    normalized = str.replace(/\./g, '').replace(',', '.');
  } else {
    const hasDot = str.includes('.');
    const hasComma = str.includes(',');

    if (hasDot && hasComma) {
      const decimalSep = str.lastIndexOf('.') > str.lastIndexOf(',') ? '.' : ',';
      const thousandsSep = decimalSep === '.' ? ',' : '.';
      normalized = str.replace(new RegExp(`\\${thousandsSep}`, 'g'), '');
      normalized = normalized.replace(decimalSep, '.');
    } else if (hasDot || hasComma) {
      const sep = hasDot ? '.' : ',';
      const parts = str.split(sep);
      if (parts.length > 2) {
        normalized = parts.join('');
      } else {
        const frac = parts[1] || '';
        if (frac.length === 0) {
          normalized = parts[0];
        } else if (frac.length === 1 || frac.length === 2) {
          normalized = `${parts[0]}.${frac}`;
        } else if (frac.length === 3) {
          normalized = parts.join('');
        } else {
          normalized = `${parts[0]}.${frac}`;
        }
      }
    }
  }

  const num = parseFloat(normalized);
  if (isNaN(num)) return null;
  return negative ? -Math.abs(num) : num;
}

// Função para lidar com seleção de colunas (suporta múltipla seleção)
function handleColumnSelection(e, columnIndex, thElement) {
  if (e.ctrlKey || e.metaKey) {
    // Ctrl/Cmd + Click: adicionar/remover da seleção
    const index = selectedColumnIndexes.indexOf(columnIndex);
    if (index > -1) {
      // Remover da seleção
      selectedColumnIndexes.splice(index, 1);
      thElement.classList.remove('selected');
    } else {
      // Adicionar à seleção
      selectedColumnIndexes.push(columnIndex);
      thElement.classList.add('selected');
    }
    lastSelectedIndex = columnIndex;
  } else if (e.shiftKey && lastSelectedIndex !== null) {
    // Shift + Click: selecionar range
    const start = Math.min(lastSelectedIndex, columnIndex);
    const end = Math.max(lastSelectedIndex, columnIndex);
    selectedColumnIndexes = [];
    
    document.querySelectorAll('th.column-header').forEach((th, idx) => {
      if (idx >= start && idx <= end) {
        selectedColumnIndexes.push(idx);
        th.classList.add('selected');
      } else {
        th.classList.remove('selected');
      }
    });
  } else {
    // Click simples: selecionar apenas esta coluna
    selectedColumnIndexes = [columnIndex];
    document.querySelectorAll('th.column-header').forEach((th, idx) => {
      if (idx === columnIndex) {
        th.classList.add('selected');
      } else {
        th.classList.remove('selected');
      }
    });
    lastSelectedIndex = columnIndex;
  }
  
  updateSelectionIndicator();
}

function setColumnSelectionRange(startIndex, endIndex) {
  const start = Math.min(startIndex, endIndex);
  const end = Math.max(startIndex, endIndex);
  selectedColumnIndexes = [];

  document.querySelectorAll('th.column-header').forEach((th, idx) => {
    if (idx >= start && idx <= end) {
      selectedColumnIndexes.push(idx);
      th.classList.add('selected');
    } else {
      th.classList.remove('selected');
    }
  });

  updateSelectionIndicator();
}

// Atualizar indicador de seleção
function updateSelectionIndicator() {
  const count = selectedColumnIndexes.length;
  const btn = convertColumnBtn;
  if (count === 0) {
    btn.textContent = 'Converter Colunas';
  } else if (count === 1) {
    btn.textContent = 'Converter Colunas (1 selecionada)';
  } else {
    btn.textContent = `Converter Colunas (${count} selecionadas)`;
  }
}

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
    checkbox.checked = selectedColumnIndexes.includes(index);
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

  selectedColumnIndexes = selected;
  document.querySelectorAll('th.column-header').forEach((th, idx) => {
    if (selectedColumnIndexes.includes(idx)) {
      th.classList.add('selected');
    } else {
      th.classList.remove('selected');
    }
  });
  updateSelectionIndicator();
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
          row[colIdx] = formatNumber(num, decimals);
          const cell = document.querySelector(`td[data-row-index="${rowIndex}"][data-column-index="${colIdx}"]`);
          if (cell) {
            cell.textContent = row[colIdx];
          }
        }
      }
    });
  });

  updateSums();
}

// Download CSV
function downloadCSV() {
  const lines = [];
  
  // Cabeçalho
  lines.push(headers.map(h => `"${h}"`).join(','));
  
  // Dados
  csvData.forEach(row => {
    lines.push(row.map(cell => `"${cell || ''}"`).join(','));
  });
  
  const csvContent = lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'edited_file.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function isNumberValue(value) {
  const num = parseNumber(value, sourceFormat);
  return num !== null;
}

// Download Excel (.xlsx) using SheetJS
function downloadExcel() {
  if (!window.XLSX) {
    alert('Biblioteca XLSX não encontrada.');
    return;
  }

  const data = [headers.map(h => h || '')];
  csvData.forEach(row => {
    const normalized = headers.map((_, idx) => {
      const raw = row[idx] || '';
      if (isNumberValue(raw)) {
        return parseNumber(raw, sourceFormat);
      }
      return raw.toString();
    });
    data.push(normalized);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  const arrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'edited_file.xlsx');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Resetar editor
function resetEditor() {
  if (confirm('Deseja criar um novo arquivo? Os dados atuais serão perdidos.')) {
    csvData = [];
    headers = [];
    selectedColumnIndexes = [];
    lastSelectedIndex = null;
    editorContainer.style.display = 'none';
    dropZone.style.display = 'flex';
    fileInput.value = '';
  }
}
