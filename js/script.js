
let selectedCell = null;

document.querySelectorAll('td').forEach(td => {
  td.addEventListener('click', () => {
    selectedCell = td;
    updateStatusBar();
  });
  td.addEventListener('input', () => {
    if (td.innerText.startsWith("=")) {
      try {
        const expr = td.innerText.substring(1).replace(/[A-Z]+[0-9]+/g, ref => {
          const [col, row] = [ref.charCodeAt(0) - 65, parseInt(ref.substring(1)) - 1];
          const cell = document.querySelector(`#spreadsheet tbody`).rows[row]?.cells[col];
          return cell ? cell.innerText || "0" : "0";
        });
        td.dataset.value = eval(expr);
      } catch (e) {
        td.dataset.value = "Error";
      }
    } else {
      td.dataset.value = td.innerText;
    }
  });
});

function updateStatusBar() {
  const status = document.getElementById("statusBar");
  if (!selectedCell) {
    status.innerText = "Selected Cell: None";
    return;
  }
  const row = selectedCell.parentNode.rowIndex + 1;
  const col = selectedCell.cellIndex;
  const colLetter = String.fromCharCode(65 + col);
  status.innerText = `Selected Cell: ${colLetter}${row}`;
}

function getSelectedCell() {
  return selectedCell;
}

function addRow() {
  const table = document.querySelector('#spreadsheet tbody');
  const cols = table.rows[0].cells.length;
  const newRow = table.insertRow();
  for (let i = 0; i < cols; i++) {
    const cell = newRow.insertCell(i);
    cell.contentEditable = true;
    cell.addEventListener('click', () => { selectedCell = cell; updateStatusBar(); });
    cell.addEventListener('input', () => {});
  }
}

function addRowAbove() {
  const cell = getSelectedCell();
  if (!cell) return;
  const row = cell.parentNode;
  const newRow = row.parentNode.insertRow(row.rowIndex - 1);
  for (let i = 0; i < row.cells.length; i++) {
    const newCell = newRow.insertCell(i);
    newCell.contentEditable = true;
    newCell.addEventListener('click', () => { selectedCell = newCell; updateStatusBar(); });
  }
}

function addRowBelow() {
  const cell = getSelectedCell();
  if (!cell) return;
  const row = cell.parentNode;
  const newRow = row.parentNode.insertRow(row.rowIndex);
  for (let i = 0; i < row.cells.length; i++) {
    const newCell = newRow.insertCell(i);
    newCell.contentEditable = true;
    newCell.addEventListener('click', () => { selectedCell = newCell; updateStatusBar(); });
  }
}

function deleteRow() {
  const cell = getSelectedCell();
  if (!cell) return;
  const row = cell.parentNode;
  const table = row.parentNode;
  if (table.rows.length > 1) {
    table.deleteRow(row.rowIndex - 1);
  }
}

function addColumn() {
  let table = document.querySelector('#spreadsheet thead');
  for (let row of table.rows) {
    const newCell = row.insertCell(-1);
    newCell.contentEditable = true;
    newCell.addEventListener('click', () => { selectedCell = newCell; updateStatusBar(); })
  }


  table = document.querySelector('#spreadsheet tbody');
  for (let row of table.rows) {
    const newCell = row.insertCell(-1);
    newCell.contentEditable = true;
    newCell.addEventListener('click', () => { selectedCell = newCell; updateStatusBar(); });
  }
}

function deleteColumn() {
  const cell = getSelectedCell();
  if (!cell) return;
  const colIndex = cell.cellIndex;
  let table = document.querySelector('#spreadsheet thead');
  for (let row of table.rows) {
    if (row.cells.length) row.deleteCell(colIndex);
  }

  table = document.querySelector('#spreadsheet tbody');
  for (let row of table.rows) {
    if (row.cells.length > 1) row.deleteCell(colIndex);
  }
}

function colorRow() {
  const color = document.getElementById("colorPicker").value;
  const cell = getSelectedCell();
  if (!cell) return;
  const row = cell.parentNode;
  for (let td of row.cells) {
    td.style.backgroundColor = color;
  }
}

function colorColumn() {
  const color = document.getElementById("colorPicker").value;
  const cell = getSelectedCell();
  if (!cell) return;
  const colIndex = cell.cellIndex;
  const table = document.querySelector('#spreadsheet tbody');
  for (let row of table.rows) {
    row.cells[colIndex].style.backgroundColor = color;
  }
}

function exportCSV() {
  let csv = [];
  const rows = document.querySelectorAll("table tr");
  for (let row of rows) {
    let cells = row.querySelectorAll("td");
    let rowData = Array.from(cells).map(td => `"${td.innerText.replace(/"/g, '""')}"`);
    csv.push(rowData.join(","));
  }
  const csvContent = "data:text/csv;charset=utf-8," + csv.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "spreadsheet.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function importCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    const rows = text.trim().split(/\r?\n/).map(line => line.split(","));
    const tbody = document.querySelector("#spreadsheet tbody");
    tbody.innerHTML = "";

    for (let row of rows) {
      const tr = document.createElement("tr");
      for (let cell of row) {
        const td = document.createElement("td");
        td.contentEditable = true;
        td.innerText = cell.replace(/(^"|"$)/g, "").replace(/""/g, '"');
        td.addEventListener('click', () => { selectedCell = td; updateStatusBar(); });
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  };
  reader.readAsText(file);
}

function toggleTheme() {
  document.body.classList.toggle("dark-mode");
}


// OLD search removed
function oldSearchTable() {
  const searchTerm = document.getElementById("searchInput").value.trim().toLowerCase();
  const cells = document.querySelectorAll("#spreadsheet td");

  cells.forEach(cell => {
    cell.style.outline = "";  // Clear previous highlights
    if (searchTerm && cell.innerText.toLowerCase().includes(searchTerm)) {
      cell.style.outline = "3px solid orange";
    }
  });
}



function searchTable() {
  const searchTerm = document.getElementById("searchInput").value.trim();
  const cells = document.querySelectorAll("#spreadsheet td");

  // Clear previous highlights
  cells.forEach(cell => {
    cell.style.outline = "";
    cell.parentNode.style.display = "";
  });

  if (!searchTerm) return;

  let regex;
  try {
    regex = new RegExp(searchTerm, "i");
  } catch (e) {
    alert("Invalid regex pattern");
    return;
  }

  let rowsMatched = new Set();

  cells.forEach(cell => {
    if (regex.test(cell.innerText)) {
      cell.style.outline = "1px solid burlywood";
      cell.style.borderRadius = ".5rem"
      rowsMatched.add(cell.parentNode);
    }
  });

  // Optional: hide unmatched rows
  document.querySelectorAll("#spreadsheet tbody tr").forEach(row => {
    if (!rowsMatched.has(row)) {
      row.style.display = "none";
    }
  });
}
