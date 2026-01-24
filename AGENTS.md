# Repository Guidelines

## Project Structure & Module Organization
This is a Chrome extension for viewing and editing CSV files.

- Source/UI: `popup.html`, `popup.css`, `app.js` (extension popup UI and logic)
- Viewer page: `viewer.html`, `viewer.css`, `viewer.js` (full-page viewer/editor)
- Extension config: `manifest.json`, `background.js`
- Assets: `icon16.png`, `icon48.png`, `icon128.png`
- Docs: `README.md`, `ICONS_INSTRUCTIONS.md`

## Build, Test, and Development Commands
There is no build system or automated test runner in this repo.

- Load locally: open `chrome://extensions`, enable Developer Mode, click “Load unpacked”, and select this folder.
- Quick manual check: open the extension, import a CSV, edit cells, apply currency format, and export CSV.

## Coding Style & Naming Conventions
- Language: vanilla JavaScript, HTML, CSS.
- Indentation: 2 spaces in JS/HTML/CSS.
- Naming: use `camelCase` for JS variables/functions, `kebab-case` for CSS classes, and descriptive IDs for DOM hooks (e.g., `currencyFormat`).
- Keep DOM selectors near the top of each JS file and avoid duplicating logic between `app.js` and `viewer.js` unless necessary.

## Testing Guidelines
No automated tests are present. If adding functionality, validate with manual scenarios:

- Import CSVs with both `,` and `;` delimiters.
- Currency parsing for `en-US` (e.g., `1,234.56`) and `pt-BR` (e.g., `1.234,56`).
- Ensure download preserves edits and formatting.

## Commit & Pull Request Guidelines
No established commit convention in history. Use clear, imperative subjects (e.g., “Fix USD parsing for decimals”).

For pull requests:
- Describe the user-visible change.
- Include before/after behavior or screenshots for UI changes.
- Note any manual test steps performed.

## Security & Configuration Tips
- Avoid handling untrusted files beyond local CSV parsing.
- Keep Chrome extension permissions minimal in `manifest.json`.
