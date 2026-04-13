const { serializeCSV } = require('../shared/csv-utils');
const { parseNumber } = require('../shared/number-utils');

jest.mock('../shared/csv-utils', () => ({
  serializeCSV: jest.fn()
}));

jest.mock('../shared/number-utils', () => ({
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
});