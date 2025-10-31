// ==== Константи (enum) ====
const CELL_STATE = {
  OPEN: "open",
  CLOSED: "closed",
  FLAG: "flag"
};

const GAME_STATUS = {
  PLAYING: "playing",
  WIN: "win",
  LOSE: "lose"
};

// Використовуйте CELL_STATE та GAME_STATUS замість рядкових значень
// для кращої читабельності та уникнення помилок у написанні.


// ==== 1. Генерація ігрового поля ====
function createCell(hasMine = false) {
  return {
    hasMine,
    neighborMines: 0,
    state: CELL_STATE.CLOSED
  };
}

function createGame(rowCount, colCount, mineCount) {
  return {
    rowCount,
    colCount,
    mineCount,
    status: GAME_STATUS.PLAYING,
    field: []
  };
}

function generateField(rowCount = 10, colCount = 10, mineCount = 15) {
  const game = createGame(rowCount, colCount, mineCount);
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    game.field[rowIndex] = [];
    for (let colIndex = 0; colIndex < colCount; colIndex++) {
      game.field[rowIndex][colIndex] = createCell();
    }
  }
  return game;
}

function placeMines(game, safeRow, safeCol) {
  let placedMines = 0;

  while (placedMines < game.mineCount) {
    const randomRow = Math.floor(Math.random() * game.rowCount);
    const randomCol = Math.floor(Math.random() * game.colCount);

    if (Math.abs(randomRow - safeRow) <= 1 && Math.abs(randomCol - safeCol) <= 1) continue;

    if (!game.field[randomRow][randomCol].hasMine) {
      game.field[randomRow][randomCol].hasMine = true;
      placedMines++;
    }
  }

  for (let rowIndex = 0; rowIndex < game.rowCount; rowIndex++) {
    for (let colIndex = 0; colIndex < game.colCount; colIndex++) {
      if (!game.field[rowIndex][colIndex].hasMine) {
        game.field[rowIndex][colIndex].neighborMines = countNeighbourMines(game.field, rowIndex, colIndex);
      }
    }
  }
}

// ==== 2. Підрахунок мін навколо ====
function countNeighbourMines(field, rowIndex, colIndex) {
  let mineCount = 0;

  for (let neighborRowOffset = -1; neighborRowOffset <= 1; neighborRowOffset++) {
    for (let neighborColOffset = -1; neighborColOffset <= 1; neighborColOffset++) {
      if (neighborRowOffset === 0 && neighborColOffset === 0) continue;

      const neighborRow = rowIndex + neighborRowOffset;
      const neighborCol = colIndex + neighborColOffset;

      if (
        neighborRow >= 0 &&
        neighborRow < field.length &&
        neighborCol >= 0 &&
        neighborCol < field[0].length
      ) {
        if (field[neighborRow][neighborCol].hasMine) mineCount++;
      }
    }
  }
  return mineCount;
}

// ==== 3. Відкриття клітинки ====
function openCell(game, rowIndex, colIndex) {
  if (
    rowIndex < 0 || rowIndex >= game.rowCount ||
    colIndex < 0 || colIndex >= game.colCount
  ) return;

  const cell = game.field[rowIndex][colIndex];
  if (cell.state === CELL_STATE.OPEN || cell.state === CELL_STATE.FLAG) return;

  cell.state = CELL_STATE.OPEN;

  if (cell.hasMine) {
    game.status = GAME_STATUS.LOSE;
    revealAllMines(game);
    stopTimer();
    setTimeout(() => alert("💥 Ви натрапили на міну! Гра закінчена."), 200);
    return;
  }

  if (cell.neighborMines === 0) {
    for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
      for (let colOffset = -1; colOffset <= 1; colOffset++) {
        if (rowOffset !== 0 || colOffset !== 0) {
          openCell(game, rowIndex + rowOffset, colIndex + colOffset);
        }
      }
    }
  }

  if (checkWin(game)) {
    game.status = GAME_STATUS.WIN;
    stopTimer();
    setTimeout(() => alert("🎉 Вітаю! Ви виграли!"), 200);
  }
}

function checkWin(game) {
  for (let row of game.field) {
    for (let cell of row) {
      if (!cell.hasMine && cell.state !== CELL_STATE.OPEN) return false;
    }
  }
  return true;
}

// ==== 4. Прапорці ====
function toggleFlag(game, rowIndex, colIndex) {
  const cell = game.field[rowIndex][colIndex];
  if (cell.state === CELL_STATE.OPEN) return;

  if (cell.state === CELL_STATE.CLOSED) {
    cell.state = CELL_STATE.FLAG;
  } else if (cell.state === CELL_STATE.FLAG) {
    cell.state = CELL_STATE.CLOSED;
  }
}

// ==== 5. Таймер ====
let timerInterval = null;
let timerSeconds = 0;
let timerDisplayInterval = null;

function startTimer() {
  if (timerInterval) return;
  timerSeconds = 0;
  timerInterval = setInterval(() => timerSeconds++, 1000);
  timerDisplayInterval = setInterval(updateTimerDisplay, 500);
}

function stopTimer() {
  clearInterval(timerInterval);
  clearInterval(timerDisplayInterval);
  timerInterval = null;
  timerDisplayInterval = null;
  updateTimerDisplay();
}

// ==== 6. Рендеринг ====
function renderGame(game) {
  const gridContainer = document.querySelector(".grid");
  gridContainer.innerHTML = "";

  for (let rowIndex = 0; rowIndex < game.rowCount; rowIndex++) {
    for (let colIndex = 0; colIndex < game.colCount; colIndex++) {
      const cell = game.field[rowIndex][colIndex];
      const cellElement = document.createElement("div");
      cellElement.classList.add("cell", cell.state);
      cellElement.dataset.row = rowIndex;
      cellElement.dataset.col = colIndex;

      if (cell.state === CELL_STATE.OPEN) {
        if (cell.hasMine) cellElement.classList.add("mine");
        else if (cell.neighborMines > 0) cellElement.textContent = cell.neighborMines;
      }

      if (cell.state === CELL_STATE.FLAG) cellElement.classList.add("flag");
      gridContainer.appendChild(cellElement);
    }
  }

  updateFlagsDisplay();
}

function revealAllMines(game) {
  for (let row of game.field) {
    for (let cell of row) {
      if (cell.hasMine) cell.state = CELL_STATE.OPEN;
    }
  }
  renderGame(game);
}

// ==== 7. Події ====
let currentGame = null;
let flagsLeft = 0;
let firstClick = true;

function updateFlagsDisplay() {
  document.querySelector(".flags").textContent =
    `🚩 ${flagsLeft.toString().padStart(2, "0")}`;
}

function updateTimerDisplay() {
  const timerElement = document.querySelector(".timer");
  const minutes = Math.floor(timerSeconds / 60).toString().padStart(2, "0");
  const seconds = (timerSeconds % 60).toString().padStart(2, "0");
  timerElement.textContent = `⏱ ${minutes}:${seconds}`;
}

function handleCellClick(event) {
  if (!currentGame || currentGame.status !== GAME_STATUS.PLAYING) return;
  const cellElement = event.target.closest(".cell");
  if (!cellElement) return;

  const rowIndex = +cellElement.dataset.row;
  const colIndex = +cellElement.dataset.col;

  if (firstClick) {
    placeMines(currentGame, rowIndex, colIndex);
    startTimer();
    firstClick = false;
  }

  openCell(currentGame, rowIndex, colIndex);
  renderGame(currentGame);

  if ([GAME_STATUS.WIN, GAME_STATUS.LOSE].includes(currentGame.status)) {
    document.querySelector(".new-game").textContent = "Restart";
  }
}

function handleCellRightClick(event) {
  event.preventDefault();
  if (!currentGame || currentGame.status !== GAME_STATUS.PLAYING) return;

  const cellElement = event.target.closest(".cell");
  if (!cellElement) return;

  const rowIndex = +cellElement.dataset.row;
  const colIndex = +cellElement.dataset.col;
  const cell = currentGame.field[rowIndex][colIndex];

  if (cell.state === CELL_STATE.FLAG) {
    flagsLeft++;
  } else if (flagsLeft > 0) {
    flagsLeft--;
  } else return;

  toggleFlag(currentGame, rowIndex, colIndex);
  updateFlagsDisplay();
  renderGame(currentGame);
}

// ==== 8. Нова гра ====
function newGame(rowCount = 10, colCount = 10, mineCount = 15) {
  currentGame = generateField(rowCount, colCount, mineCount);
  flagsLeft = mineCount;
  firstClick = true;
  stopTimer();
  timerSeconds = 0;
  document.querySelector(".new-game").textContent = "Start";
  updateTimerDisplay();
  updateFlagsDisplay();
  renderGame(currentGame);
}

// ==== 9. Ініціалізація ====
document.addEventListener("DOMContentLoaded", () => {
  newGame();
  document.querySelector(".grid").addEventListener("click", handleCellClick);
  document.querySelector(".grid").addEventListener("contextmenu", handleCellRightClick);
  document.querySelector(".new-game").addEventListener("click", () => newGame());
});