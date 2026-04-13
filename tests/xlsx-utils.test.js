const { parseXLSX, parseXLSXAsync } = require('../shared/xlsx-utils');

// Mock XLSX library
const mockXLSX = {
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn()
  }
};

global.XLSX = mockXLSX;

describe('parseXLSX', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('throws error if XLSX library not loaded', () => {
    const originalXLSX = global.XLSX;
    global.XLSX = undefined;
    
    expect(() => parseXLSX(new ArrayBuffer(0))).toThrow('XLSX library not loaded');
    
    global.XLSX = originalXLSX;
  });

  test('parses XLSX file with first sheet', () => {
    const mockArrayBuffer = new ArrayBuffer(100);
    const mockWorksheet = { /* mock worksheet object */ };
    const mockSheetData = [
      ['Name', 'Age', 'City'],
      ['John', '30', 'NYC'],
      ['Jane', '25', 'LA']
    ];

    mockXLSX.read.mockReturnValue({
      SheetNames: ['Sheet1'],
      Sheets: { 'Sheet1': mockWorksheet }
    });

    mockXLSX.utils.sheet_to_json.mockReturnValue(mockSheetData);

    const result = parseXLSX(mockArrayBuffer);

    expect(mockXLSX.read).toHaveBeenCalledWith(mockArrayBuffer, { type: 'array' });
    expect(mockXLSX.utils.sheet_to_json).toHaveBeenCalledWith(mockWorksheet, { header: 1, def: '' });
    expect(result.headers).toEqual(['Name', 'Age', 'City']);
    expect(result.rows).toEqual([
      ['John', '30', 'NYC'],
      ['Jane', '25', 'LA']
    ]);
    expect(result.delimiter).toBe(',');
  });

  test('throws error if no sheets found', () => {
    const mockArrayBuffer = new ArrayBuffer(100);
    mockXLSX.read.mockReturnValue({
      SheetNames: []
    });

    expect(() => parseXLSX(mockArrayBuffer)).toThrow('No sheets found in the workbook');
  });

  test('handles empty sheet', () => {
    const mockArrayBuffer = new ArrayBuffer(100);
    mockXLSX.read.mockReturnValue({
      SheetNames: ['Sheet1'],
      Sheets: { 'Sheet1': {} }
    });
    mockXLSX.utils.sheet_to_json.mockReturnValue([]);

    const result = parseXLSX(mockArrayBuffer);

    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
  });

  test('handles rows longer than headers', () => {
    const mockArrayBuffer = new ArrayBuffer(100);
    const mockWorksheet = {};
    const mockSheetData = [
      ['A', 'B', 'C'],
      ['1', '2'],
      ['1', '2', '3', '4']
    ];

    mockXLSX.read.mockReturnValue({
      SheetNames: ['Sheet1'],
      Sheets: { 'Sheet1': mockWorksheet }
    });

    mockXLSX.utils.sheet_to_json.mockReturnValue(mockSheetData);

    const result = parseXLSX(mockArrayBuffer);

    expect(result.headers).toEqual(['A', 'B', 'C']);
    // Rows shorter than headers are padded, rows longer are kept as-is
    expect(result.rows).toEqual([
      ['1', '2', ''],
      ['1', '2', '3', '4']
    ]);
  });

  test('reports progress during parsing', () => {
    const mockArrayBuffer = new ArrayBuffer(100);
    const progressCalls = [];

    mockXLSX.read.mockReturnValue({
      SheetNames: ['Sheet1'],
      Sheets: { 'Sheet1': {} }
    });
    mockXLSX.utils.sheet_to_json.mockReturnValue([
      ['A', 'B'],
      ['1', '2']
    ]);

    parseXLSX(mockArrayBuffer, { onProgress: (p) => progressCalls.push(p) });

    expect(progressCalls).toContain(20);
    expect(progressCalls).toContain(50);
    expect(progressCalls).toContain(70);
    expect(progressCalls).toContain(90);
    expect(progressCalls).toContain(100);
  });
});

describe('parseXLSXAsync', () => {
  test('calls parseXLSX with same parameters', async () => {
    const mockArrayBuffer = new ArrayBuffer(100);
    
    mockXLSX.read.mockReturnValue({
      SheetNames: ['Sheet1'],
      Sheets: { 'Sheet1': {} }
    });
    mockXLSX.utils.sheet_to_json.mockReturnValue([
      ['A', 'B'],
      ['1', '2']
    ]);

    const result = await parseXLSXAsync(mockArrayBuffer);

    expect(result.headers).toEqual(['A', 'B']);
    expect(result.rows).toEqual([['1', '2']]);
  });
});
