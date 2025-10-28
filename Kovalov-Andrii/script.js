// ==== 1. Генерація ігрового поля ====
function createCell(hasMine = false) {
  return {
    hasMine,
    neighborMines: 0,
    state: "closed" // "closed", "open", "flag"
  };
}

function createGame(rowCount, colCount, mineCount) {
  return {
    rowCount,
    colCount,
    mineCount,
    status: "playing", // "playing", "win", "lose"
    field: []
  };
}

function generateField(rowCount = 10, colCount = 10, mineCount = 15) {
  const game = createGame(rowCount, colCount, mineCount);
  for (let row = 0; row < rowCount; row++) {
    game.field[row] = [];
    for (let col = 0; col < colCount; col++) {
      game.field[row][col] = createCell();
    }
  }
  return game;
}

function placeMines(game, safeRow, safeCol) {
  let placedMines = 0;
  while (placedMines < game.mineCount) {
    const row = Math.floor(Math.random() * game.rowCount);
    const col = Math.floor(Math.random() * game.colCount);
    if (Math.abs(row - safeRow) <= 1 && Math.abs(col - safeCol) <= 1) continue;
    if (!game.field[row][col].hasMine) {
      game.field[row][col].hasMine = true;
      placedMines++;
    }
  }

  for (let row = 0; row < game.rowCount; row++) {
    for (let col = 0; col < game.colCount; col++) {
      if (!game.field[row][col].hasMine) {
        game.field[row][col].neighborMines = countNeighbourMines(game.field, row, col);
      }
    }
  }
}

// ==== 2. Підрахунок мін навколо ====
function countNeighbourMines(field, row, col) {
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr, nc = col + dc;
      if (nr >= 0 && nr < field.length && nc >= 0 && nc < field[0].length) {
        if (field[nr][nc].hasMine) count++;
      }
    }
  }
  return count;
}

// ==== 3. Відкриття клітинки ====
function openCell(game, row, col) {
  if (row < 0 || row >= game.rowCount || col < 0 || col >= game.colCount) return;
  const cell = game.field[row][col];
  if (cell.state === "open" || cell.state === "flag") return;

  cell.state = "open";
  if (cell.hasMine) {
    game.status = "lose";
    revealAllMines(game);
    stopTimer();
    setTimeout(() => alert("💥 Ви натрапили на міну! Гра закінчена."), 200);
    return;
  }

  if (cell.neighborMines === 0) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr !== 0 || dc !== 0) openCell(game, row + dr, col + dc);
      }
    }
  }

  if (checkWin(game)) {
    game.status = "win";
    stopTimer();
    setTimeout(() => alert("🎉 Вітаю! Ви виграли!"), 200);
  }
}

function checkWin(game) {
  for (let row of game.field) {
    for (let cell of row) {
      if (!cell.hasMine && cell.state !== "open") return false;
    }
  }
  return true;
}

// ==== 4. Прапорці ====
function toggleFlag(game, row, col) {
  const cell = game.field[row][col];
  if (cell.state === "open") return;
  if (cell.state === "closed") {
    cell.state = "flag";
  } else if (cell.state === "flag") {
    cell.state = "closed";
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
  const grid = document.querySelector(".grid");
  grid.innerHTML = "";
  for (let row = 0; row < game.rowCount; row++) {
    for (let col = 0; col < game.colCount; col++) {
      const cell = game.field[row][col];
      const div = document.createElement("div");
      div.classList.add("cell", cell.state);
      div.dataset.row = row;
      div.dataset.col = col;

      if (cell.state === "open") {
        if (cell.hasMine) div.classList.add("mine");
        else if (cell.neighborMines > 0) div.textContent = cell.neighborMines;
      }
      if (cell.state === "flag") div.classList.add("flag");
      grid.appendChild(div);
    }
  }
  updateFlagsDisplay();
}

function revealAllMines(game) {
  for (let row of game.field) {
    for (let cell of row) {
      if (cell.hasMine) cell.state = "open";
    }
  }
  renderGame(game);
}

// ==== 7. Події ====
let currentGame = null;
let flagsLeft = 0;
let firstClick = true;

function updateFlagsDisplay() {
  document.querySelector(".flags").textContent = `🚩 ${flagsLeft.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
  const timerDiv = document.querySelector(".timer");
  const m = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
  const s = (timerSeconds % 60).toString().padStart(2, '0');
  timerDiv.textContent = `⏱ ${m}:${s}`;
}

function handleCellClick(event) {
  if (!currentGame || currentGame.status !== "playing") return;
  const cellDiv = event.target.closest(".cell");
  if (!cellDiv) return;
  const row = +cellDiv.dataset.row, col = +cellDiv.dataset.col;

  if (firstClick) {
    placeMines(currentGame, row, col);
    startTimer();
    firstClick = false;
  }

  openCell(currentGame, row, col);
  renderGame(currentGame);
  if (["win", "lose"].includes(currentGame.status)) document.querySelector(".new-game").textContent = "Restart";
}

function handleCellRightClick(event) {
  event.preventDefault();
  if (!currentGame || currentGame.status !== "playing") return;
  const cellDiv = event.target.closest(".cell");
  if (!cellDiv) return;
  const row = +cellDiv.dataset.row, col = +cellDiv.dataset.col;
  const cell = currentGame.field[row][col];

  if (cell.state === "flag") {
    flagsLeft++;
  } else if (flagsLeft > 0) {
    flagsLeft--;
  } else return;

  toggleFlag(currentGame, row, col);
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