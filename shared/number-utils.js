export function formatNumber(num, decimals = 2, currencyFormat = 'pt-BR') {
  if (num === null || isNaN(num)) return '';
  return new Intl.NumberFormat(currencyFormat, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}

export function getDecimalCount(value, format) {
  if (value === null || value === undefined) return 0;
  const raw = value.toString().trim();
  if (!raw) return 0;

  const cleaned = raw.replace(/[^\d.,]/g, '');
  if (!cleaned) return 0;

  if (format === 'en-US') {
    const idx = cleaned.lastIndexOf('.');
    if (idx === -1) return 0;
    return cleaned.slice(idx + 1).replace(/[^\d]/g, '').length;
  }

  if (format === 'pt-BR') {
    const idx = cleaned.lastIndexOf(',');
    if (idx === -1) return 0;
    return cleaned.slice(idx + 1).replace(/[^\d]/g, '').length;
  }

  const lastDot = cleaned.lastIndexOf('.');
  const lastComma = cleaned.lastIndexOf(',');
  if (lastDot === -1 && lastComma === -1) return 0;

  const decimalSep = lastDot > lastComma ? '.' : ',';
  const idx = cleaned.lastIndexOf(decimalSep);
  const frac = cleaned.slice(idx + 1).replace(/[^\d]/g, '');
  const intPart = cleaned.slice(0, idx).replace(/[^\d]/g, '');

  if (frac.length === 0) return 0;
  if (frac.length === 3 && intPart.length > 0) return 0;
  return frac.length;
}

export function parseNumber(value, format) {
  if (value === null || value === undefined) return null;
  let str = value.toString().trim();
  if (!str) return null;

  let negative = false;
  if (str.includes('(') && str.includes(')')) negative = true;
  if (str.includes('-')) negative = true;

  str = str.replace(/[^\d.,]/g, '');
  if (!str) return null;

  let normalized = str;
  if (format === 'en-US') {
    normalized = str.replace(/,/g, '');
  } else if (format === 'pt-BR') {
    normalized = str.replace(/\./g, '').replace(',', '.');
  } else {
    const hasDot = str.includes('.');
    const hasComma = str.includes(',');

    if (hasDot && hasComma) {
      const decimalSep = str.lastIndexOf('.') > str.lastIndexOf(',') ? '.' : ',';
      const thousandsSep = decimalSep === '.' ? ',' : '.';
      normalized = str.replace(new RegExp(`\\${thousandsSep}`, 'g'), '');
      normalized = normalized.replace(decimalSep, '.');
    } else if (hasDot || hasComma) {
      const sep = hasDot ? '.' : ',';
      const parts = str.split(sep);
      if (parts.length > 2) {
        normalized = parts.join('');
      } else {
        const frac = parts[1] || '';
        if (frac.length === 0) {
          normalized = parts[0];
        } else if (frac.length === 1 || frac.length === 2) {
          normalized = `${parts[0]}.${frac}`;
        } else if (frac.length === 3) {
          normalized = parts.join('');
        } else {
          normalized = `${parts[0]}.${frac}`;
        }
      }
    }
  }

  const num = parseFloat(normalized);
  if (isNaN(num)) return null;
  return negative ? -Math.abs(num) : num;
}
