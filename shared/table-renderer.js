export function applyFilters(state, dom) {
  const rows = dom.tableBody.querySelectorAll('tr');
  rows.forEach((tr) => {
    const rowIndex = parseInt(tr.dataset.rowIndex, 10);
    const row = state.csvData[rowIndex] || [];
    const matches = state.columnFilters.every((filterValue, colIndex) => {
      if (!filterValue) return true;
      const cell = row[colIndex] || '';
      return cell.toString().toLowerCase().includes(filterValue.toLowerCase());
    });
    tr.style.display = matches ? '' : 'none';
  });
}

export function updateSums(state, dom, formatNumberForCell, parseNumber, sourceFormat) {
  dom.tableFoot.innerHTML = '';
  const footerRow = document.createElement('tr');

  const spacer = document.createElement('td');
  spacer.className = 'row-number-cell';
  footerRow.appendChild(spacer);

  state.headers.forEach((_, colIndex) => {
    const td = document.createElement('td');
    const sum = calculateColumnSum(state.csvData, colIndex, parseNumber, sourceFormat);
    td.className = 'sum-cell';
    td.textContent = sum !== null ? formatNumberForCell(sum, 2) : '';
    footerRow.appendChild(td);
  });

  dom.tableFoot.appendChild(footerRow);
}

function calculateColumnSum(rows, columnIndex, parseNumber, sourceFormat) {
  let sum = 0;
  let hasNumbers = false;

  rows.forEach((row) => {
    const value = row[columnIndex];
    if (value) {
      const num = parseNumber(value, sourceFormat);
      if (num !== null) {
        sum += num;
        hasNumbers = true;
      }
    }
  });

  return hasNumbers ? sum : null;
}

export function renderTable({
  state,
  dom,
  cellSelection,
  onToggleSort,
  onHeaderCellSetup,
  rowClassName,
  formatNumberForCell,
  parseNumber,
  sourceFormat,
  onAfterRender
}) {
  dom.tableHead.innerHTML = '';
  dom.tableBody.innerHTML = '';
  dom.tableFoot.innerHTML = '';

  if (cellSelection) cellSelection.reset();

  const headerRow = document.createElement('tr');
  const rowNumberHeader = document.createElement('th');
  rowNumberHeader.textContent = '#';
  rowNumberHeader.classList.add('row-number-header');
  headerRow.appendChild(rowNumberHeader);

  state.headers.forEach((header, index) => {
    const th = document.createElement('th');
    th.dataset.columnIndex = index;
    th.classList.add('column-header');

    const headerContent = document.createElement('div');
    headerContent.className = 'header-content';
    const headerLabel = document.createElement('span');
    headerLabel.className = 'header-label';
    const headerText = header || `Coluna ${index + 1}`;
    headerLabel.textContent = headerText;

    const sortButton = document.createElement('button');
    sortButton.type = 'button';
    sortButton.className = 'sort-button';
    sortButton.dataset.columnIndex = index;
    sortButton.setAttribute('aria-label', `Ordenar coluna ${headerText}`);
    sortButton.title = 'Ordenar';
    const sortDirection = state.sortState.columnIndex === index ? state.sortState.direction : null;
    sortButton.textContent = sortDirection === 'asc' ? '^' : sortDirection === 'desc' ? 'v' : '^v';
    if (sortDirection) sortButton.classList.add('active');

    sortButton.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
    sortButton.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      onToggleSort(index);
    });

    headerContent.appendChild(headerLabel);
    headerContent.appendChild(sortButton);
    th.appendChild(headerContent);

    if (onHeaderCellSetup) {
      onHeaderCellSetup({ th, index, headerText });
    }

    headerRow.appendChild(th);
  });
  dom.tableHead.appendChild(headerRow);

  const filterRow = document.createElement('tr');
  filterRow.classList.add('column-filter-row');
  const filterSpacer = document.createElement('th');
  filterSpacer.classList.add('row-number-header');
  filterRow.appendChild(filterSpacer);
  state.headers.forEach((_, index) => {
    const th = document.createElement('th');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'column-filter';
    input.placeholder = 'Filtrar...';
    input.value = state.columnFilters[index] || '';
    input.addEventListener('input', (e) => {
      state.columnFilters[index] = e.target.value;
      applyFilters(state, dom);
    });
    th.appendChild(input);
    filterRow.appendChild(th);
  });
  dom.tableHead.appendChild(filterRow);

  state.csvData.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
    tr.dataset.rowIndex = rowIndex;
    if (rowClassName) tr.className = rowClassName;

    const rowNumberCell = document.createElement('td');
    rowNumberCell.textContent = `${rowIndex + 1}`;
    rowNumberCell.className = 'row-number-cell';
    rowNumberCell.dataset.rowIndex = rowIndex;
    tr.appendChild(rowNumberCell);

    state.headers.forEach((_, colIndex) => {
      const td = document.createElement('td');
      td.contentEditable = false;
      td.className = 'editable';
      td.textContent = row[colIndex] || '';
      td.tabIndex = -1;
      td.dataset.rowIndex = rowIndex;
      td.dataset.columnIndex = colIndex;

      td.addEventListener('blur', (e) => {
        if (!cellSelection.isEditingCell(e.target)) return;
        const rIdx = parseInt(e.target.dataset.rowIndex, 10);
        const cIdx = parseInt(e.target.dataset.columnIndex, 10);
        if (state.csvData[rIdx]) {
          state.csvData[rIdx][cIdx] = e.target.textContent;
        }
        cellSelection.finishEditingCell(e.target);
        updateSums(state, dom, formatNumberForCell, parseNumber, sourceFormat);
        applyFilters(state, dom);
      });

      td.addEventListener('keydown', (e) => {
        if (!cellSelection.isEditingCell(e.target)) return;
        if (e.key === 'Enter') {
          e.preventDefault();
          cellSelection.finishEditingCell(e.target);
          const nextRow = tr.nextElementSibling;
          if (nextRow) {
            const nextCell = nextRow.querySelector(`td[data-column-index="${colIndex}"]`);
            if (nextCell) {
              const nextRowIndex = parseInt(nextRow.dataset.rowIndex, 10);
              cellSelection.setCellSelectionRange(
                { row: nextRowIndex, col: colIndex },
                { row: nextRowIndex, col: colIndex },
                false
              );
              nextCell.focus();
            }
          }
        }
      });

      td.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        if (cellSelection.isEditingCell(td)) return;
        e.preventDefault();
        cellSelection.handleCellMouseDown(e, rowIndex, colIndex);
      });

      td.addEventListener('mouseenter', () => {
        if (!cellSelection.isSelectingActive()) return;
        const start = cellSelection.getSelectionStart();
        if (!start) return;
        cellSelection.setCellSelectionRange(start, { row: rowIndex, col: colIndex }, false);
      });

      td.addEventListener('dblclick', () => {
        cellSelection.startEditingCell(td);
      });

      tr.appendChild(td);
    });

    dom.tableBody.appendChild(tr);
  });

  updateSums(state, dom, formatNumberForCell, parseNumber, sourceFormat);
  applyFilters(state, dom);
  if (onAfterRender) onAfterRender();
}
