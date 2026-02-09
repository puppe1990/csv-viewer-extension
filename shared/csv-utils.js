export function detectDelimiter(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return ',';
  const sample = lines[0];
  const counts = { ',': 0, ';': 0, '\t': 0 };
  let inQuotes = false;

  for (let i = 0; i < sample.length; i += 1) {
    const char = sample[i];
    if (char === '"') {
      if (inQuotes && sample[i + 1] === '"') {
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && counts[char] !== undefined) {
      counts[char] += 1;
    }
  }

  if (counts[';'] > counts[','] && counts[';'] > counts['\t']) return ';';
  if (counts['\t'] > counts[','] && counts['\t'] > counts[';']) return '\t';
  return ',';
}

export function parseCSVLine(line, delimiter) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1; // Skip escaped quote
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

export function parseCSV(text) {
  if (!text || !text.trim()) return { headers: [], rows: [], delimiter: ',' };

  const delimiter = detectDelimiter(text);
  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let inQuotes = false;

  function pushCell() {
    currentRow.push(currentCell.trim());
    currentCell = '';
  }

  function pushRow() {
    pushCell();
    const hasContent = currentRow.some((cell) => cell !== '');
    if (hasContent) rows.push(currentRow);
    currentRow = [];
  }

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === delimiter) {
      pushCell();
      continue;
    }

    if (!inQuotes && char === '\n') {
      pushRow();
      continue;
    }

    if (!inQuotes && char === '\r') {
      if (nextChar === '\n') i += 1;
      pushRow();
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    pushRow();
  }

  if (rows.length === 0) return { headers: [], rows: [], delimiter };
  const [headers, ...dataRows] = rows;
  const normalizedRows = normalizeRows(headers, dataRows, delimiter);
  return { headers, rows: normalizedRows, delimiter };
}

export async function parseCSVAsync(text, options = {}) {
  const { onProgress = null, chunkSize = 50000 } = options;
  if (!text || !text.trim()) {
    if (typeof onProgress === 'function') onProgress(100);
    return { headers: [], rows: [], delimiter: ',' };
  }

  const delimiter = detectDelimiter(text);
  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let inQuotes = false;
  const totalLength = text.length;
  let index = 0;

  function pushCell() {
    currentRow.push(currentCell.trim());
    currentCell = '';
  }

  function pushRow() {
    pushCell();
    const hasContent = currentRow.some((cell) => cell !== '');
    if (hasContent) rows.push(currentRow);
    currentRow = [];
  }

  while (index < totalLength) {
    const end = Math.min(index + chunkSize, totalLength);
    for (; index < end; index += 1) {
      const char = text[index];
      const nextChar = text[index + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (!inQuotes && char === delimiter) {
        pushCell();
        continue;
      }

      if (!inQuotes && char === '\n') {
        pushRow();
        continue;
      }

      if (!inQuotes && char === '\r') {
        if (nextChar === '\n') index += 1;
        pushRow();
        continue;
      }

      currentCell += char;
    }

    if (typeof onProgress === 'function') {
      onProgress((index / totalLength) * 100);
    }

    if (index < totalLength) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    pushRow();
  }

  if (rows.length === 0) {
    if (typeof onProgress === 'function') onProgress(100);
    return { headers: [], rows: [], delimiter };
  }

  const [headers, ...dataRows] = rows;
  const normalizedRows = normalizeRows(headers, dataRows, delimiter);
  if (typeof onProgress === 'function') onProgress(100);
  return { headers, rows: normalizedRows, delimiter };
}

function normalizeRows(headers, dataRows, delimiter) {
  return dataRows.map((row) => {
    if (row.length > headers.length) {
      const head = row.slice(0, headers.length - 1);
      const tail = row.slice(headers.length - 1).join(delimiter);
      return [...head, tail];
    }
    if (row.length < headers.length) {
      return [...row, ...Array(headers.length - row.length).fill('')];
    }
    return row;
  });
}

export function serializeCSV(headers, rows, delimiter = ',') {
  const lines = [];
  const serializeCell = (value) => {
    const raw = value === null || value === undefined ? '' : value.toString();
    const escaped = raw.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  lines.push(headers.map((header) => serializeCell(header)).join(delimiter));
  rows.forEach((row) => {
    lines.push(row.map((cell) => serializeCell(cell)).join(delimiter));
  });
  return lines.join('\n');
}
