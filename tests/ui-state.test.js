import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, test, expect, beforeEach } from 'vitest';
import { showDropZone, showEditor, isElementVisible } from '../shared/ui-state.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function mountPage(htmlFile) {
  const html = readFileSync(join(root, htmlFile), 'utf8');
  const doc = new DOMParser().parseFromString(html, 'text/html');

  document.head.replaceChildren();
  document.body.replaceChildren();

  for (const node of doc.head.childNodes) {
    if (node.nodeName === 'LINK') continue;
    document.head.appendChild(node.cloneNode(true));
  }

  for (const node of doc.body.childNodes) {
    document.body.appendChild(node.cloneNode(true));
  }

  const css = readFileSync(join(root, 'styles.css'), 'utf8');
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

describe('initial page layout', () => {
  beforeEach(() => {
    mountPage('viewer.html');
  });

  test('shows only the drop zone on first load', () => {
    const dropZone = document.getElementById('dropZone');
    const editorContainer = document.getElementById('editorContainer');
    const uploadLoader = document.getElementById('uploadLoader');

    expect(dropZone).not.toBeNull();
    expect(editorContainer).not.toBeNull();
    expect(uploadLoader).not.toBeNull();

    expect(dropZone.hidden).toBe(false);
    expect(editorContainer.hidden).toBe(true);
    expect(uploadLoader.hidden).toBe(true);

    expect(isElementVisible(dropZone)).toBe(true);
    expect(isElementVisible(editorContainer)).toBe(false);
    expect(isElementVisible(uploadLoader)).toBe(false);
  });

  test('popup.html starts with the same initial layout', () => {
    mountPage('popup.html');

    const dropZone = document.getElementById('dropZone');
    const editorContainer = document.getElementById('editorContainer');

    expect(isElementVisible(dropZone)).toBe(true);
    expect(isElementVisible(editorContainer)).toBe(false);
  });
});

describe('ui-state transitions', () => {
  let dropZone;
  let editorContainer;

  beforeEach(() => {
    mountPage('viewer.html');
    dropZone = document.getElementById('dropZone');
    editorContainer = document.getElementById('editorContainer');
  });

  test('showEditor hides drop zone and shows editor', () => {
    showEditor(dropZone, editorContainer);

    expect(dropZone.hidden).toBe(true);
    expect(editorContainer.hidden).toBe(false);
    expect(isElementVisible(dropZone)).toBe(false);
    expect(isElementVisible(editorContainer)).toBe(true);
  });

  test('showDropZone restores the initial layout after reset', () => {
    showEditor(dropZone, editorContainer);
    showDropZone(dropZone, editorContainer);

    expect(isElementVisible(dropZone)).toBe(true);
    expect(isElementVisible(editorContainer)).toBe(false);
    expect(dropZone.style.display).toBe('');
    expect(editorContainer.style.display).toBe('');
  });
});
