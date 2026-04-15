const {
  isJSONFile,
  isSupportedDataFile,
  getSupportedDataFileMessage
} = require('../shared/file-type-utils');

describe('file-type-utils', () => {
  test('accepts JSON files by extension', () => {
    expect(isJSONFile({ name: 'report.json', type: '' })).toBe(true);
  });

  test('accepts JSON files by mime type', () => {
    expect(isJSONFile({ name: 'report', type: 'application/json' })).toBe(true);
  });

  test('accepts supported spreadsheet file types', () => {
    expect(isSupportedDataFile({ name: 'report.csv', type: '' })).toBe(true);
    expect(isSupportedDataFile({ name: 'report.xlsx', type: '' })).toBe(true);
    expect(isSupportedDataFile({ name: 'report.xls', type: '' })).toBe(true);
    expect(isSupportedDataFile({ name: 'report.json', type: '' })).toBe(true);
  });

  test('rejects unsupported files', () => {
    expect(isSupportedDataFile({ name: 'report.txt', type: 'text/plain' })).toBe(false);
  });

  test('mentions JSON in supported file message', () => {
    expect(getSupportedDataFileMessage()).toContain('JSON');
  });
});
