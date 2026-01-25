// Estado da aplicação
let csvData = [];
let headers = [];
let currencyFormat = 'pt-BR';
let sourceFormat = 'auto';
let selectedColumnIndex = null;

// Elementos DOM
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const editorContainer = document.getElementById('editorContainer');
const csvTable = document.getElementById('csvTable');
const tableHead = document.getElementById('tableHead');
const tableBody = document.getElementById('tableBody');
const tableFoot = document.getElementById('tableFoot');
const downloadBtn = document.getElementById('downloadBtn');
const newFileBtn = document.getElementById('newFileBtn');
const sourceFormatSelect = document.getElementById('sourceFormat');
const currencyFormatSelect = document.getElementById('currencyFormat');
const formatCurrencyBtn = document.getElementById('formatCurrencyBtn');

// Event Listeners
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('dragleave', handleDragLeave);
dropZone.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);
downloadBtn.addEventListener('click', downloadCSV);
newFileBtn.addEventListener('click', resetEditor);
formatCurrencyBtn.addEventListener('click', applyCurrencyFormat);

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
  dropZone.classList.add('scale-105');
}

function handleDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove('scale-105');
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove('scale-105');

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
    dropZone.classList.add('hidden');
    editorContainer.classList.remove('hidden');
    editorContainer.classList.add('flex');
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
  selectedColumnIndex = null;

  // Cabeçalho
  const headerRow = document.createElement('tr');
  headers.forEach((header, index) => {
    const th = document.createElement('th');
    th.textContent = header || `Coluna ${index + 1}`;
    th.dataset.columnIndex = index;
    th.className = 'px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors min-w-[120px]';
    th.addEventListener('click', () => {
      // Remover seleção anterior
      document.querySelectorAll('th').forEach(h => {
        h.classList.remove('header-selected');
        h.className = 'px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors min-w-[120px]';
      });
      // Selecionar nova coluna
      th.classList.add('header-selected');
      selectedColumnIndex = index;
    });
    headerRow.appendChild(th);
  });
  tableHead.appendChild(headerRow);

  // Corpo da tabela
  csvData.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50 border-b border-gray-100';
    headers.forEach((_, colIndex) => {
      const td = document.createElement('td');
      td.contentEditable = true;
      td.className = 'px-4 py-3 text-sm text-gray-900 border-r border-gray-100 cell-editable min-w-[120px]';
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
}

// Atualizar somas das colunas
function updateSums() {
  tableFoot.innerHTML = '';
  const footerRow = document.createElement('tr');
  
  headers.forEach((_, colIndex) => {
    const td = document.createElement('td');
    const sum = calculateColumnSum(colIndex);
    td.className = 'px-4 py-3 text-sm font-semibold text-blue-600 text-right border-r border-gray-200 bg-gray-50 min-w-[120px]';
    td.textContent = sum !== null ? formatNumber(sum) : '';
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
function formatNumber(num) {
  if (num === null || isNaN(num)) return '';
  return new Intl.NumberFormat(currencyFormat, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
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

// Aplicar formato de moeda
function applyCurrencyFormat() {
  if (selectedColumnIndex === null) {
    alert('Por favor, clique no cabeçalho da coluna que deseja formatar primeiro!');
    return;
  }

  const colIdx = selectedColumnIndex;

  // Formatar todas as células da coluna
  csvData.forEach((row, rowIndex) => {
    const value = row[colIdx];
    if (value) {
      const num = parseNumber(value, sourceFormat);
      if (num !== null) {
        row[colIdx] = formatNumber(num);
        const cell = document.querySelector(`td[data-row-index="${rowIndex}"][data-column-index="${colIdx}"]`);
        if (cell) {
          cell.textContent = row[colIdx];
        }
      }
    }
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

// Resetar editor
function resetEditor() {
  if (confirm('Deseja criar um novo arquivo? Os dados atuais serão perdidos.')) {
    csvData = [];
    headers = [];
    editorContainer.classList.add('hidden');
    editorContainer.classList.remove('flex');
    dropZone.classList.remove('hidden');
    fileInput.value = '';
  }
}
