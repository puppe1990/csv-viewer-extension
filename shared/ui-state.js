export function showDropZone(dropZone, editorContainer) {
  dropZone.hidden = false;
  editorContainer.hidden = true;
  dropZone.style.removeProperty('display');
  editorContainer.style.removeProperty('display');
}

export function showEditor(dropZone, editorContainer) {
  dropZone.hidden = true;
  editorContainer.hidden = false;
  dropZone.style.removeProperty('display');
  editorContainer.style.removeProperty('display');
}

export function isElementVisible(element) {
  if (!element || element.hidden) return false;
  return getComputedStyle(element).display !== 'none';
}
