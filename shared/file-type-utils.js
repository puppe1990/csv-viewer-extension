const CSV_MIME_TYPES = ['text/csv', 'application/csv'];
const JSON_MIME_TYPES = ['application/json', 'text/json'];
const XLSX_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel'
];

function getFileName(file) {
  return String(file?.name || '').toLowerCase();
}

function getFileType(file) {
  return String(file?.type || '').toLowerCase();
}

export function isCSVFile(file) {
  const name = getFileName(file);
  const type = getFileType(file);
  return name.endsWith('.csv') || CSV_MIME_TYPES.includes(type);
}

export function isJSONFile(file) {
  const name = getFileName(file);
  const type = getFileType(file);
  return name.endsWith('.json') || JSON_MIME_TYPES.includes(type);
}

export function isXLSXFile(file) {
  const name = getFileName(file);
  const type = getFileType(file);
  return name.endsWith('.xlsx') || name.endsWith('.xls') || XLSX_MIME_TYPES.includes(type);
}

export function isSupportedDataFile(file) {
  return isCSVFile(file) || isJSONFile(file) || isXLSXFile(file);
}

export function getSupportedDataFileMessage() {
  return 'Por favor, selecione um arquivo CSV, JSON ou XLSX válido.';
}
