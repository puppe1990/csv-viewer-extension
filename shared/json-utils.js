export function parseJSON(text, options = {}) {
  const { onProgress = null } = options;

  if (typeof onProgress === 'function') onProgress(10);

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    if (!text || !text.trim()) {
      if (typeof onProgress === 'function') onProgress(100);
      return { headers: [], rows: [], delimiter: ',' };
    }
    throw new Error('Invalid JSON format');
  }

  if (typeof onProgress === 'function') onProgress(40);

  data = normalizeRoot(data);

  if (Array.isArray(data) && data.length === 0) {
    if (typeof onProgress === 'function') onProgress(100);
    return { headers: [], rows: [], delimiter: ',' };
  }

  const records = Array.isArray(data) ? data : [data];
  const firstItem = records[0];
  let headers;
  let rows;

  if (Array.isArray(firstItem)) {
    headers = firstItem.map((_, index) => String(index));
    rows = records.map(row => Array.isArray(row) ? row.map(valueToCell) : [valueToCell(row)]);
  } else if (typeof firstItem === 'object' && firstItem !== null) {
    headers = collectHeaders(records);
    rows = records.map(row => {
      if (typeof row === 'object' && row !== null) {
        return headers.map(header => {
          const value = row[header];
          return valueToCell(value);
        });
      }
      return [valueToCell(row)];
    });
  } else {
    headers = ['value'];
    rows = records.map(item => [valueToCell(item)]);
  }

  if (typeof onProgress === 'function') onProgress(80);

  rows = rows.map(row => {
    if (row.length > headers.length) {
      const head = row.slice(0, headers.length - 1);
      const tail = row.slice(headers.length - 1).join(',');
      return [...head, tail];
    }
    if (row.length < headers.length) {
      return [...row, ...Array(headers.length - row.length).fill('')];
    }
    return row;
  });

  if (typeof onProgress === 'function') onProgress(100);

  return { headers, rows, delimiter: ',' };
}

export async function parseJSONAsync(text, options = {}) {
  return parseJSON(text, options);
}

function normalizeRoot(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return data;

  const preferredKeys = ['data', 'rows', 'items', 'results', 'records'];
  const preferredKey = preferredKeys.find(key => Array.isArray(data[key]));
  if (preferredKey) return data[preferredKey];

  const firstArrayKey = Object.keys(data).find(key => Array.isArray(data[key]));
  if (firstArrayKey) return data[firstArrayKey];

  return data;
}

function collectHeaders(records) {
  const headers = [];
  const seen = new Set();

  records.forEach(record => {
    if (!record || typeof record !== 'object' || Array.isArray(record)) return;

    Object.keys(record).forEach(key => {
      if (seen.has(key)) return;
      seen.add(key);
      headers.push(key);
    });
  });

  return headers;
}

function valueToCell(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
