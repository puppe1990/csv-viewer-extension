export function detectDelimiter(text) {
  return text.includes(';') ? ';' : ',';
}

export function parseCSVLine(line, delimiter) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
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
  const lines = text.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return { headers: [], rows: [], delimiter: ',' };

  const delimiter = detectDelimiter(text);
  const headers = parseCSVLine(lines[0], delimiter);
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const row = parseCSVLine(lines[i], delimiter);
    if (row.length > 0) rows.push(row);
  }

  return { headers, rows, delimiter };
}

export function serializeCSV(headers, rows) {
  const lines = [];
  lines.push(headers.map((header) => `"${header}"`).join(','));
  rows.forEach((row) => {
    lines.push(row.map((cell) => `"${cell || ''}"`).join(','));
  });
  return lines.join('\n');
}
