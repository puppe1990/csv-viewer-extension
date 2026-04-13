const { formatNumber, getDecimalCount, parseNumber } = require('../shared/number-utils');

describe('formatNumber', () => {
  test('formats number in pt-BR format', () => {
    expect(formatNumber(1234.56, 2, 'pt-BR')).toBe('1.234,56');
  });

  test('formats number in en-US format', () => {
    expect(formatNumber(1234.56, 2, 'en-US')).toBe('1,234.56');
  });

  test('formats number in en-GB format', () => {
    const result = formatNumber(1234.56, 2, 'en-GB');
    expect(result).toBe('1,234.56');
  });

  test('handles zero decimals', () => {
    expect(formatNumber(1234, 0, 'en-US')).toBe('1,234');
  });

  test('returns empty for null', () => {
    expect(formatNumber(null)).toBe('');
  });

  test('returns empty for NaN', () => {
    expect(formatNumber(NaN)).toBe('');
  });

  test('uses default 2 decimals', () => {
    expect(formatNumber(100.5, undefined, 'en-US')).toBe('100.50');
  });
});

describe('getDecimalCount', () => {
  test('returns 0 for null/undefined', () => {
    expect(getDecimalCount(null)).toBe(0);
    expect(getDecimalCount(undefined)).toBe(0);
  });

  test('returns 0 for empty string', () => {
    expect(getDecimalCount('')).toBe(0);
  });

  test('detects decimals in en-US format', () => {
    expect(getDecimalCount('1,234.56', 'en-US')).toBe(2);
  });

  test('detects decimals in pt-BR format', () => {
    expect(getDecimalCount('1.234,56', 'pt-BR')).toBe(2);
  });

  test('returns 0 for integers', () => {
    expect(getDecimalCount('1234')).toBe(0);
  });

  test('handles auto-detection for mixed formats', () => {
    expect(getDecimalCount('1,234.56')).toBe(2);
    expect(getDecimalCount('1.234,56')).toBe(2);
  });
});

describe('parseNumber', () => {
  test('returns null for null/undefined', () => {
    expect(parseNumber(null)).toBeNull();
    expect(parseNumber(undefined)).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(parseNumber('')).toBeNull();
  });

  test('parses en-US format', () => {
    expect(parseNumber('1,234.56', 'en-US')).toBe(1234.56);
  });

  test('parses pt-BR format', () => {
    expect(parseNumber('1.234,56', 'pt-BR')).toBe(1234.56);
  });

  test('parses negative numbers', () => {
    expect(parseNumber('-1,234.56', 'en-US')).toBe(-1234.56);
  });

  test('parses negative with parentheses', () => {
    expect(parseNumber('(1,234.56)', 'en-US')).toBe(-1234.56);
  });

  test('auto-detects format', () => {
    expect(parseNumber('1,234.56')).toBe(1234.56);
    expect(parseNumber('1.234,56')).toBe(1234.56);
  });

  test('handles integers', () => {
    expect(parseNumber('1234')).toBe(1234);
  });

  test('handles currency symbols', () => {
    expect(parseNumber('$1,234.56', 'en-US')).toBe(1234.56);
    expect(parseNumber('R$ 1.234,56', 'pt-BR')).toBe(1234.56);
  });
});
