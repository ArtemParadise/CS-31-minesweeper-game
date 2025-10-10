// ==== 1. Генерація ігрового поля ====
function createCell(hasMine = false) {
  return {
    hasMine: hasMine,          // чи є міна
    neighborMines: 0,          // кількість сусідніх мін
    state: "closed"            // "closed", "open", "flag"
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
  // створюємо поле
  for (let row = 0; row < rowCount; row++) {
    game.field[row] = [];
    for (let col = 0; col < colCount; col++) {
      game.field[row][col] = createCell();
    }
  }
  // Міни розставляються після першого кліку!
  return game;
}

function placeMines(game, safeRow, safeCol) {
  let placedMines = 0;
  while (placedMines < game.mineCount) {
    const row = Math.floor(Math.random() * game.rowCount);
    const col = Math.floor(Math.random() * game.colCount);
    // Не ставимо міну на першу клітинку і її сусідів
    if (Math.abs(row - safeRow) <= 1 && Math.abs(col - safeCol) <= 1) continue;
    if (!game.field[row][col].hasMine) {
      game.field[row][col].hasMine = true;
      placedMines++;
    }
  }
  // Після розміщення мін рахуємо сусідів
  for (let row = 0; row < game.rowCount; row++) {
    for (let col = 0; col < game.colCount; col++) {
      if (!game.field[row][col].hasMine) {
        game.field[row][col].neighborMines = countNeighbourMines(game.field, row, col);
      }
    }
  }
}

// ==== 2. Підрахунок кількості мін навколо клітинки ====
function countNeighbourMines(field, row, col) {
  let count = 0;
  for (let dRow = -1; dRow <= 1; dRow++) {
    for (let dCol = -1; dCol <= 1; dCol++) {
      if (dRow === 0 && dCol === 0) continue;
      const neighborRow = row + dRow;
      const neighborCol = col + dCol;
      if (
        neighborRow >= 0 && neighborRow < field.length &&
        neighborCol >= 0 && neighborCol < field[0].length
      ) {
        if (field[neighborRow][neighborCol].hasMine) count++;
      }
    }
  }
  return count;
}

// ==== 3. Відкриття клітинки ====

function openCell(game, row, col) {
  if (
    row < 0 || row >= game.rowCount ||
    col < 0 || col >= game.colCount
  ) return;

  const cell = game.field[row][col];

  if (cell.state === "open" || cell.state === "flag") return;

  cell.state = "open";

  if (cell.hasMine) {
    game.status = "lose";
    console.log("Game Over! You hit a mine.");
    return;
  }

  if (cell.neighborMines === 0) {
    // Рекурсивно відкриваємо сусідні клітинки
    for (let dRow = -1; dRow <= 1; dRow++) {
      for (let dCol = -1; dCol <= 1; dCol++) {
        if (dRow === 0 && dCol === 0) continue;
        openCell(game, row + dRow, col + dCol);
      }
    }
  }

  // Перевірка на перемогу
  if (checkWin(game)) {
    game.status = "win";
    stopTimer();
    setTimeout(() => alert('Вітаю! Ви виграли!'), 100);
  }
}

function checkWin(game) {
  for (let row = 0; row < game.rowCount; row++) {
    for (let col = 0; col < game.colCount; col++) {
      const cell = game.field[row][col];
      if (!cell.hasMine && cell.state !== "open") {
        return false;
      }
    }
  }
  return true;
}

// ==== 4. Встановлення/зняття прапорця ====
function toggleFlag(game, row, col) {
  const cell = game.field[row][col];
  if (cell.state === "closed") {
    cell.state = "flag";
  } else if (cell.state === "flag") {
    cell.state = "closed";
  }
  console.log(`Flag at (${row}, ${col}): ${cell.state === "flag"}`);
}

// ==== 5. Логіка таймера ====
let timerInterval = null;
let timerSeconds = 0;

function startTimer() {
  if (timerInterval) return;
  timerSeconds = 0;
  timerInterval = setInterval(() => {
    timerSeconds++;
    console.log(`Timer: ${timerSeconds} сек`);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  console.log("Timer stopped.");
}

// ==== Інтерактивна логіка гри ====
let currentGame = null;
let flagsLeft = 0;
let timerStarted = false;
let firstClick = true;

function updateFlagsDisplay() {
  const flagsDiv = document.querySelector('.flags');
  flagsDiv.textContent = `🚩 ${flagsLeft.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
  const timerDiv = document.querySelector('.timer');
  const min = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
  const sec = (timerSeconds % 60).toString().padStart(2, '0');
  timerDiv.textContent = `⏱ ${min}:${sec}`;
}


function handleCellClick(event) {
  if (!currentGame || currentGame.status !== 'playing') return;
  const cellDiv = event.target.closest('.cell');
  if (!cellDiv) return;
  const row = Number(cellDiv.dataset.row);
  const col = Number(cellDiv.dataset.col);
  if (!timerStarted) {
    startTimer();
    timerStarted = true;
  }
  if (firstClick) {
    placeMines(currentGame, row, col);
    firstClick = false;
  }
  openCell(currentGame, row, col);
  renderGame(currentGame);
  if (currentGame.status === 'lose') {
    stopTimer();
    setTimeout(() => alert('Game Over!'), 100);
  }
}

function handleCellRightClick(event) {
  event.preventDefault();
  if (!currentGame || currentGame.status !== 'playing') return;
  const cellDiv = event.target.closest('.cell');
  if (!cellDiv) return;
  const row = Number(cellDiv.dataset.row);
  const col = Number(cellDiv.dataset.col);
  const cell = currentGame.field[row][col];
  if (cell.state === 'open') return;
  if (cell.state === 'flag') {
    flagsLeft++;
  } else if (flagsLeft > 0) {
    flagsLeft--;
  } else {
    return;
  }
  toggleFlag(currentGame, row, col);
  updateFlagsDisplay();
  renderGame(currentGame);
}

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
        if (cell.hasMine) {
          div.classList.add("mine");
        } else if (cell.neighborMines > 0) {
          div.textContent = cell.neighborMines;
        }
      }

      if (cell.state === "flag") {
        div.classList.add("flag");
      }

      grid.appendChild(div);
    }
  }
}


function newGame(rowCount = 10, colCount = 10, mineCount = 20) {
  currentGame = generateField(rowCount, colCount, mineCount);
  flagsLeft = mineCount;
  timerStarted = false;
  firstClick = true;
  stopTimer();
  timerSeconds = 0;
  updateFlagsDisplay();
  updateTimerDisplay();
  renderGame(currentGame);
}

document.addEventListener('DOMContentLoaded', () => {
  newGame();
  document.querySelector('.grid').addEventListener('click', handleCellClick);
  document.querySelector('.grid').addEventListener('contextmenu', handleCellRightClick);
  document.querySelector('.new-game').addEventListener('click', () => newGame());
  updateFlagsDisplay();
  updateTimerDisplay();
});

// Оновлення таймера на екрані
let timerDisplayInterval = null;
function startTimer() {
  if (timerInterval) return;
  timerSeconds = 0;
  timerInterval = setInterval(() => {
    timerSeconds++;
  }, 1000);
  if (!timerDisplayInterval) {
    timerDisplayInterval = setInterval(updateTimerDisplay, 500);
  }
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  clearInterval(timerDisplayInterval);
  timerDisplayInterval = null;
  updateTimerDisplay();
}


/*
====================
// Тестування основних функцій Minesweeper
====================

// 1. Генерація ігрового поля
const testGame1 = generateField(5, 5, 5);
placeMines(testGame1, 0, 0); // Додає міни, уникаючи (0,0) та сусідів
console.log('1. Згенероване поле (масив з мінами):', testGame1.field.map(row => row.map(cell => cell.hasMine ? '💣' : '.')));

// 2. Підрахунок кількості мін навколо клітинки
console.log('2. Міни навколо (2,2):', countNeighbourMines(testGame1.field, 2, 2));
console.log('2. Міни навколо (0,0):', countNeighbourMines(testGame1.field, 0, 0));

// 3. Відкриття клітинки
openCell(testGame1, 1, 1);
console.log('3. Стан гри після openCell(1,1):', testGame1.field.map(row => row.map(cell => cell.state)));

// 4. Встановлення/зняття прапорця
toggleFlag(testGame1, 2, 2);
console.log('4. Прапорець на (2,2):', testGame1.field[2][2].state);
toggleFlag(testGame1, 2, 2);
console.log('4. Прапорець знято з (2,2):', testGame1.field[2][2].state);

// 5. Логіка таймера
startTimer();
setTimeout(() => {
  stopTimer();
  console.log('5. Таймер зупинено.');
}, 4000);
*/