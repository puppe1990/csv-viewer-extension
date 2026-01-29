import { serializeCSV } from './csv-utils.js';
import { parseNumber } from './number-utils.js';

export function downloadBlob(blob, filename) {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadCSV(headers, rows) {
  const csvContent = serializeCSV(headers, rows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, 'edited_file.csv');
}

export function downloadExcel(headers, rows, sourceFormat) {
  if (!window.XLSX) {
    alert('Biblioteca XLSX não encontrada.');
    return;
  }

  const data = [headers.map((header) => header || '')];
  rows.forEach((row) => {
    const normalized = headers.map((_, idx) => {
      const raw = row[idx] || '';
      const parsed = parseNumber(raw, sourceFormat);
      if (parsed !== null) return parsed;
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
  downloadBlob(blob, 'edited_file.xlsx');
}
