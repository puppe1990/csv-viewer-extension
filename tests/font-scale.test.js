import { describe, test, expect } from 'vitest';
import {
  clampFontScale,
  decreaseFontScale,
  formatFontScaleLabel,
  increaseFontScale,
  FONT_SCALE_DEFAULT,
  FONT_SCALE_MIN
} from '../shared/font-scale.js';

describe('font-scale', () => {
  test('decreases font scale by one step', () => {
    expect(decreaseFontScale(1)).toBe(0.95);
    expect(decreaseFontScale(0.8)).toBe(0.75);
  });

  test('does not go below the minimum scale', () => {
    expect(decreaseFontScale(FONT_SCALE_MIN)).toBe(FONT_SCALE_MIN);
  });

  test('increases font scale by one step', () => {
    expect(increaseFontScale(1)).toBe(1.05);
  });

  test('formats the scale as a percentage label', () => {
    expect(formatFontScaleLabel(0.95)).toBe('95%');
    expect(formatFontScaleLabel(FONT_SCALE_DEFAULT)).toBe('100%');
  });

  test('falls back to default for invalid values', () => {
    expect(clampFontScale('invalid')).toBe(FONT_SCALE_DEFAULT);
  });
});
