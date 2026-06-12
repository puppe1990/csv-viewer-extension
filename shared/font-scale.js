export const FONT_SCALE_MIN = 0.75;
export const FONT_SCALE_MAX = 1.25;
export const FONT_SCALE_STEP = 0.05;
export const FONT_SCALE_DEFAULT = 1;

export function clampFontScale(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return FONT_SCALE_DEFAULT;
  return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, parsed));
}

export function decreaseFontScale(current) {
  return clampFontScale(current - FONT_SCALE_STEP);
}

export function increaseFontScale(current) {
  return clampFontScale(current + FONT_SCALE_STEP);
}

export function formatFontScaleLabel(scale) {
  return `${Math.round(scale * 100)}%`;
}

export function applyFontScale(container, scale) {
  if (!container) return;
  container.style.setProperty('--sheet-font-scale', String(clampFontScale(scale)));
}
