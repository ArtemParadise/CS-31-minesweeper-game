let field = [];
let gameState = {
  rows: 6,
  cols: 5,
  mines: 6,
  status: "idle" 
};

let timerInterval = null;
let seconds = 0;
const board = document.getElementById("gameboard");
const startButton = document.getElementById("start-btn");
const timerDisplay = document.getElementById("timer");
const flagsDisplay = document.getElementById("flags");

function generateField(rows, cols, mines) {
  const field = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        hasMine: false,
        neighbourMines: 0,
        isOpen: false,
        isFlagged: false
      });
    }
    field.push(row);
  }

  let placed = 0;
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!field[r][c].hasMine) {
      field[r][c].hasMine = true;
      placed++;
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      field[r][c].neighbourMines = countNeighbourMines(field, r, c);
    }
  }
  console.log("Поле з мінами:", field);
  return field;
}

function countNeighbourMines(field, row, col) {
  const dirs = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1], [1, 0], [1, 1]
  ];
  let count = 0;
  for (const [dr, dc] of dirs) {
    const r = row + dr;
    const c = col + dc;
    if (r >= 0 && r < field.length && c >= 0 && c < field[0].length) {
      if (field[r][c].hasMine) count++;
    }
  }
  return count;
}

function openCell(row, col) {
  const cell = field[row][col];
  if (cell.isOpen || cell.isFlagged) return;
  cell.isOpen = true;

  if (cell.hasMine) {
    gameState.status = "lose";
    stopTimer();
    alert("Ви програли!");
    revealAll();
    return;
  }
  if (cell.neighbourMines === 0) {
    const dirs = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];
    for (const [dr, dc] of dirs) {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < gameState.rows && c >= 0 && c < gameState.cols) {
        if (!field[r][c].isOpen) openCell(r, c);
      }
    }
  }
  checkWin();
  renderField();
}

function toggleFlag(row, col) {
  const cell = field[row][col];
  if (cell.isOpen) return;
  cell.isFlagged = !cell.isFlagged;
  updateFlagsCount();
  renderField();
}
function updateFlagsCount() {
  const used = field.flat().filter(c => c.isFlagged).length;
  const remaining = gameState.mines - used;
  flagsDisplay.textContent = remaining.toString().padStart(3, "0");
}

function checkWin() {
  const closedCells = field.flat().filter(c => !c.isOpen).length;
  const mines = field.flat().filter(c => c.hasMine).length;
  if (closedCells === mines) {
    gameState.status = "win";
    stopTimer();
    alert("Ви перемогли!");
  }
}

function revealAll() {
  field.flat().forEach(c => (c.isOpen = true));
  renderField();
}

function renderField() {
  board.innerHTML = "";
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      const data = field[r][c];
    
      if (gameState.status === "win" || gameState.status === "lose") {
        if (data.hasMine && data.isFlagged) {
          cell.textContent = "⚑";
          cell.classList.add("flag-on-mine");
        } else if (!data.hasMine && data.isFlagged) {
          cell.textContent = "✖";
          cell.classList.add("flag-wrong");
        } else if (data.hasMine) {
          cell.textContent = "💣";
          cell.classList.add(gameState.status === "lose" ? "mine-clicked" : "mine");
        } else if (data.neighbourMines > 0) {
          cell.textContent = data.neighbourMines;
          cell.classList.add("opened");
        } else {
          cell.classList.add("empty");
        }
      } else { 
        if (data.isFlagged) {
          cell.textContent = "⚑";
          cell.classList.add("flag-on-mine");
        } else if (!data.isOpen) {
          cell.classList.add("closed");
        } else if (data.hasMine) {
          cell.textContent = "💣";
          cell.classList.add("mine");
        } else if (data.neighbourMines > 0) {
          cell.textContent = data.neighbourMines;
          cell.classList.add("opened");
        } else {
          cell.classList.add("empty");
        }

        cell.addEventListener("click", () => openCell(r, c));
        cell.addEventListener("contextmenu", e => {
          e.preventDefault();
          toggleFlag(r, c);
        });
      }
      board.appendChild(cell);
    }
  }
}

function startTimer() {
  stopTimer();
  seconds = 0;
  timerDisplay.textContent = "000";
  timerInterval = setInterval(() => {
    seconds++;
    timerDisplay.textContent = seconds.toString().padStart(3, "0");
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function startGame() {
  gameState.status = "in-progress";
  field = generateField(gameState.rows, gameState.cols, gameState.mines);
  updateFlagsCount();
  renderField();
  startTimer();
  startButton.textContent = "Restart";
}
startButton.addEventListener("click", () => {
  startGame();
});