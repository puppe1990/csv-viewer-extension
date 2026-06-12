const { serializeCSV } = require('../shared/csv-utils');
const { parseNumber } = require('../shared/number-utils');

jest.mock('../shared/csv-utils', () => ({
  serializeCSV: jest.fn()
}));

jest.mock('../shared/number-utils', () => ({
  ...jest.requireActual('../shared/number-utils'),
  parseNumber: jest.fn()
}));

global.URL = {
  createObjectURL: jest.fn(() => 'blob:http://test/url')
};

const { downloadBlob, downloadCSV, downloadExcel } = require('../shared/download-utils');

describe('downloadBlob', () => {
  let originalCreateElement;
  let mockLink;

  beforeEach(() => {
    mockLink = {
      setAttribute: jest.fn(),
      style: {},
      click: jest.fn()
    };

    originalCreateElement = document.createElement;
    document.createElement = jest.fn(() => mockLink);

    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
  });

  afterEach(() => {
    document.createElement = originalCreateElement;
  });

  test('creates and clicks a download link', () => {
    const blob = new Blob(['test'], { type: 'text/csv' });

    downloadBlob(blob, 'test.csv');

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'blob:http://test/url');
    expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'test.csv');
    expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
    expect(mockLink.click).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
  });
});

describe('downloadCSV', () => {
  beforeEach(() => {
    serializeCSV.mockReturnValue('"A","B"\n"1","2"');
  });

  test('creates CSV blob and calls downloadBlob', () => {
    const headers = ['A', 'B'];
    const rows = [['1', '2']];

    downloadCSV(headers, rows, ',');

    expect(serializeCSV).toHaveBeenCalledWith(headers, rows, ',');
  });
});

describe('downloadExcel', () => {
  let originalXLSX;

  beforeEach(() => {
    originalXLSX = window.XLSX;
    window.XLSX = {
      utils: {
        aoa_to_sheet: jest.fn(() => ({})),
        book_new: jest.fn(() => ({})),
        book_append_sheet: jest.fn()
      },
      write: jest.fn(() => new ArrayBuffer(8))
    };
  });

  afterEach(() => {
    window.XLSX = originalXLSX;
  });

  test('shows alert if XLSX not loaded', () => {
    window.XLSX = undefined;
    global.alert = jest.fn();

    downloadExcel(['A', 'B'], [['1', '2']], 'en-US');

    expect(global.alert).toHaveBeenCalledWith('Biblioteca XLSX não encontrada.');
  });

  test('creates Excel file with parsed numbers', () => {
    parseNumber.mockReturnValue(1234.56);

    downloadExcel(['A', 'B'], [['1.234,56']], 'pt-BR');

    expect(parseNumber).toHaveBeenCalledWith('1.234,56', 'pt-BR');
    expect(window.XLSX.utils.aoa_to_sheet).toHaveBeenCalled();
  });

  test('preserves DD/MM/YYYY dates instead of converting to numbers', () => {
    parseNumber.mockImplementation(jest.requireActual('../shared/number-utils').parseNumber);

    downloadExcel(
      ['Data', 'Valor'],
      [
        ['01/06/2026', '1.234,56'],
        ['05/06/2026', '120,00'],
        ['10/06/2026', '50,00']
      ],
      'pt-BR'
    );

    const sheetData = window.XLSX.utils.aoa_to_sheet.mock.calls[0][0];
    expect(sheetData).toEqual([
      ['Data', 'Valor'],
      ['01/06/2026', 1234.56],
      ['05/06/2026', 120],
      ['10/06/2026', 50]
    ]);
    expect(parseNumber).not.toHaveBeenCalledWith('01/06/2026', 'pt-BR');
    expect(parseNumber).not.toHaveBeenCalledWith('05/06/2026', 'pt-BR');
    expect(parseNumber).not.toHaveBeenCalledWith('10/06/2026', 'pt-BR');
  });

  test('preserves text descriptions that contain digits', () => {
    parseNumber.mockImplementation(jest.requireActual('../shared/number-utils').parseNumber);

    const description = 'Pix recebido c6 de MATHEUS NUNES PUPPE';
    downloadExcel(
      ['Data', 'Descrição', 'Valor'],
      [['01/06/2026', description, 'R$ 200,00']],
      'pt-BR'
    );

    const sheetData = window.XLSX.utils.aoa_to_sheet.mock.calls[0][0];
    expect(sheetData).toEqual([
      ['Data', 'Descrição', 'Valor'],
      ['01/06/2026', description, 200]
    ]);
    expect(parseNumber).not.toHaveBeenCalledWith(description, 'pt-BR');
  });
});
