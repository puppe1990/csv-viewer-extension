const {
  detectDelimiter,
  parseCSVLine,
  parseCSV,
  parseCSVAsync,
  serializeCSV
} = require('../shared/csv-utils');

describe('detectDelimiter', () => {
  test('detects comma delimiter', () => {
    expect(detectDelimiter('a,b,c\n1,2,3')).toBe(',');
  });

  test('detects semicolon delimiter', () => {
    expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';');
  });

  test('detects tab delimiter', () => {
    expect(detectDelimiter('a\tb\tc\n1\t2\t3')).toBe('\t');
  });

  test('defaults to comma for empty text', () => {
    expect(detectDelimiter('')).toBe(',');
  });

  test('handles quoted delimiters correctly', () => {
    expect(detectDelimiter('"a,b";"c;d";"e;f"')).toBe(';');
  });
});

describe('parseCSVLine', () => {
  test('parses simple comma-separated line', () => {
    expect(parseCSVLine('a,b,c', ',')).toEqual(['a', 'b', 'c']);
  });

  test('parses line with quoted values', () => {
    expect(parseCSVLine('"hello, world",foo,bar', ',')).toEqual(['hello, world', 'foo', 'bar']);
  });

  test('parses line with escaped quotes', () => {
    expect(parseCSVLine('"say ""hello""",test', ',')).toEqual(['say "hello"', 'test']);
  });

  test('parses semicolon-separated line', () => {
    expect(parseCSVLine('a;b;c', ';')).toEqual(['a', 'b', 'c']);
  });

  test('handles empty values', () => {
    expect(parseCSVLine('a,,c', ',')).toEqual(['a', '', 'c']);
  });
});

describe('parseCSV', () => {
  test('parses basic CSV with headers', () => {
    const result = parseCSV('Name,Age,City\nJohn,30,NYC\nJane,25,LA');
    expect(result.headers).toEqual(['Name', 'Age', 'City']);
    expect(result.rows).toEqual([
      ['John', '30', 'NYC'],
      ['Jane', '25', 'LA']
    ]);
    expect(result.delimiter).toBe(',');
  });

  test('parses CSV with semicolon delimiter', () => {
    const result = parseCSV('Name;Age;City\nJohn;30;NYC');
    expect(result.headers).toEqual(['Name', 'Age', 'City']);
    expect(result.rows).toEqual([['John', '30', 'NYC']]);
    expect(result.delimiter).toBe(';');
  });

  test('handles quoted fields with delimiters', () => {
    const result = parseCSV('Name,Description\nProduct,"A, B, C"');
    expect(result.headers).toEqual(['Name', 'Description']);
    expect(result.rows).toEqual([['Product', 'A, B, C']]);
  });

  test('handles empty CSV', () => {
    const result = parseCSV('');
    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
  });

  test('normalizes row lengths', () => {
    const result = parseCSV('A,B,C\n1,2\n1,2,3,4');
    expect(result.headers).toEqual(['A', 'B', 'C']);
    expect(result.rows).toEqual([
      ['1', '2', ''],
      ['1', '2', '3,4']
    ]);
  });

  test('handles CRLF line endings', () => {
    const result = parseCSV('A,B\r\n1,2\r\n3,4');
    expect(result.headers).toEqual(['A', 'B']);
    expect(result.rows).toEqual([
      ['1', '2'],
      ['3', '4']
    ]);
  });
});

describe('parseCSVAsync', () => {
  test('parses CSV asynchronously', async () => {
    const result = await parseCSVAsync('Name,Age\nJohn,30\nJane,25');
    expect(result.headers).toEqual(['Name', 'Age']);
    expect(result.rows).toEqual([
      ['John', '30'],
      ['Jane', '25']
    ]);
  });

  test('reports progress', async () => {
    const progressCalls = [];
    await parseCSVAsync('A,B\n1,2\n3,4', {
      onProgress: (p) => progressCalls.push(p)
    });
    expect(progressCalls.length).toBeGreaterThan(0);
    expect(progressCalls[progressCalls.length - 1]).toBe(100);
  });

  test('handles empty input', async () => {
    const result = await parseCSVAsync('');
    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
  });
});

describe('serializeCSV', () => {
  test('serializes headers and rows', () => {
    const result = serializeCSV(['A', 'B'], [['1', '2'], ['3', '4']]);
    expect(result).toBe('"A","B"\n"1","2"\n"3","4"');
  });

  test('handles values with commas', () => {
    const result = serializeCSV(['Name'], [['Hello, World']]);
    expect(result).toBe('"Name"\n"Hello, World"');
  });

  test('handles values with quotes', () => {
    const result = serializeCSV(['Text'], [['Say "Hi"']]);
    expect(result).toBe('"Text"\n"Say ""Hi"""');
  });

  test('uses custom delimiter', () => {
    const result = serializeCSV(['A', 'B'], [['1', '2']], ';');
    expect(result).toBe('"A";"B"\n"1";"2"');
  });

  test('handles null and undefined values', () => {
    const result = serializeCSV(['A', 'B'], [[null, undefined]]);
    expect(result).toBe('"A","B"\n"",""');
  });
});
