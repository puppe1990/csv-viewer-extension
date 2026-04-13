export function parseXLSX(arrayBuffer, options = {}) {
  const { onProgress = null } = options;

  if (typeof XLSX === 'undefined') {
    throw new Error('XLSX library not loaded');
  }

  if (typeof onProgress === 'function') onProgress(20);

  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  if (typeof onProgress === 'function') onProgress(50);

  // Get first sheet
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('No sheets found in the workbook');
  }

  const worksheet = workbook.Sheets[firstSheetName];

  if (typeof onProgress === 'function') onProgress(70);

  // Convert to JSON
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, def: '' });

  if (typeof onProgress === 'function') onProgress(90);

  if (jsonData.length === 0) {
    if (typeof onProgress === 'function') onProgress(100);
    return { headers: [], rows: [], delimiter: ',' };
  }

  const headers = jsonData[0].map(h => String(h));
  const rows = jsonData.slice(1).map(row => {
    const normalizedRow = row.map(cell => String(cell));
    // Ensure row has same length as headers
    if (normalizedRow.length < headers.length) {
      return [...normalizedRow, ...Array(headers.length - normalizedRow.length).fill('')];
    }
    return normalizedRow;
  });

  if (typeof onProgress === 'function') onProgress(100);

  return { headers, rows, delimiter: ',' };
}

export async function parseXLSXAsync(arrayBuffer, options = {}) {
  return parseXLSX(arrayBuffer, options);
}
