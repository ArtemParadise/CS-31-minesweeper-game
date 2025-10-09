// Стани клітинки
const CellState = {
  CLOSED: "closed",
  OPEN: "open",
  FLAGGED: "flagged"
};

// Стани гри
const GameStatus = {
  IN_PROGRESS: "in-progress",
  WIN: "win",
  LOSE: "lose"
};

// Створення клітинки
function createCell(hasMine = false) {
  return {
    hasMine: Boolean(hasMine),   // чи є міна
    adjacentMines: 0,            // кількість сусідніх мін
    state: CellState.CLOSED      // стан клітинки
  };
}

// Створення пустого поля (2D масив)
function createEmptyBoard(rows, cols) {
  const board = new Array(rows);
  for (let row = 0; row < rows; row++) {
    board[row] = new Array(cols);
    for (let col = 0; col < cols; col++) {
      board[row][col] = createCell(false);
    }
  }
  return board;
}

// Розміщення мін
function placeMines(board, positions) {
  for (const position of positions) {
    const { r: row, c: col } = position;
    if (board[row] && board[row][col]) {
      board[row][col].hasMine = true;
    }
  }
}

// Підрахунок кількості сусідніх мін
function computeAdjacentCounts(board) {
  const totalRows = board.length;
  const totalCols = board[0].length;
  for (let row = 0; row < totalRows; row++) {
    for (let col = 0; col < totalCols; col++) {
      if (board[row][col].hasMine) {
        board[row][col].adjacentMines = -1;
        continue;
      }
      let mineCount = 0;
      for (let dRow = -1; dRow <= 1; dRow++) {
        for (let dCol = -1; dCol <= 1; dCol++) {
          if (dRow === 0 && dCol === 0) continue;
          const newRow = row + dRow;
          const newCol = col + dCol;
          if (newRow >= 0 && newRow < totalRows && newCol >= 0 && newCol < totalCols) {
            if (board[newRow][newCol].hasMine) mineCount++;
          }
        }
      }
      board[row][col].adjacentMines = mineCount;
    }
  }
}

// Структура гри
function createGame(rows, cols, minePositions = []) {
  const board = createEmptyBoard(rows, cols);
  placeMines(board, minePositions);
  computeAdjacentCounts(board);
  return {
    rows,
    cols,
    mines: minePositions.length,
    status: GameStatus.IN_PROGRESS,
    board
  };
}

const sampleMines = [
  { r: 2, c: 2 },
  { r: 3, c: 3 },
  { r: 4, c: 8 },
  { r: 7, c: 4 },
  { r: 9, c: 7 }
];

const game = createGame(10, 10, sampleMines);

function boardToPrintable(game) {
  return game.board.map(row =>
    row.map(cell => (cell.hasMine ? "💣" : String(cell.adjacentMines)))
  );
}

console.log("Minesweeper game state (JS model):", game);
console.table(boardToPrintable(game));

window._MINE_GAME = game;

function generateField(rows, cols, mineCount) {
  const positions = [];
  while (positions.length < mineCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!positions.some(pos => pos.r === r && pos.c === c)) {
      positions.push({ r, c });
    }
  }
  return createGame(rows, cols, positions);
}

const randomGame = generateField(10, 10, 10);
console.table(boardToPrintable(randomGame));

function countNeighbourMines(field, row, col) {
  const totalRows = field.length;
  const totalCols = field[0].length;
  let count = 0;
  for (let dRow = -1; dRow <= 1; dRow++) {
    for (let dCol = -1; dCol <= 1; dCol++) {
      if (dRow === 0 && dCol === 0) continue;
      const newRow = row + dRow;
      const newCol = col + dCol;
      if (newRow >= 0 && newRow < totalRows && newCol >= 0 && newCol < totalCols) {
        if (field[newRow][newCol].hasMine) count++;
      }
    }
  }
  return count;
}

console.log(countNeighbourMines(game.board, 0, 0)); // пример

function openCell(game, row, col) {
  const cell = game.board[row][col];
  if (cell.state === CellState.OPEN || cell.state === CellState.FLAGGED) return;

  cell.state = CellState.OPEN;

  if (cell.hasMine) {
    game.status = GameStatus.LOSE;
    console.log("Game Over! 💥");
    return;
  }

  if (cell.adjacentMines === 0) {
    const totalRows = game.rows;
    const totalCols = game.cols;
    for (let dRow = -1; dRow <= 1; dRow++) {
      for (let dCol = -1; dCol <= 1; dCol++) {
        if (dRow === 0 && dCol === 0) continue;
        const newRow = row + dRow;
        const newCol = col + dCol;
        if (newRow >= 0 && newRow < totalRows && newCol >= 0 && newCol < totalCols) {
          openCell(game, newRow, newCol);
        }
      }
    }
  }

  // Перевірка перемоги
  const closedCells = game.board.flat().filter(c => c.state === CellState.CLOSED);
  if (closedCells.length === game.mines) {
    game.status = GameStatus.WIN;
    console.log("You Win! 🎉");
  }
}

openCell(game, 0, 0);
console.table(boardToPrintable(game));

function toggleFlag(game, row, col) {
  const cell = game.board[row][col];
  if (cell.state === CellState.OPEN) return;

  cell.state = cell.state === CellState.FLAGGED ? CellState.CLOSED : CellState.FLAGGED;
}

toggleFlag(game, 0, 1);
console.log(game.board[0][1]);

let timerInterval;
let seconds = 0;

function startTimer() {
  clearInterval(timerInterval);
  seconds = 0;
  timerInterval = setInterval(() => {
    seconds++;
    console.log("Time:", seconds);
    document.querySelector(".timer").textContent = `⏱ ${seconds}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

document.querySelector(".start-btn").addEventListener("click", () => {
  startTimer();
});

function renderBoard(game) {
  const cells = document.querySelectorAll(".grid .cell");
  let i = 0;
  for (let row = 0; row < game.rows; row++) {
    for (let col = 0; col < game.cols; col++) {
      const cell = game.board[row][col];
      const div = cells[i++];
      div.className = "cell"; // сброс классов
      if (cell.state === CellState.CLOSED) div.classList.add("cell-closed");
      else if (cell.state === CellState.FLAGGED) div.classList.add("cell-flag");
      else if (cell.hasMine) div.classList.add("cell-mine");
      else div.classList.add(`cell-num${cell.adjacentMines}`);
      div.textContent = cell.state === CellState.OPEN && !cell.hasMine ? cell.adjacentMines || "" : div.textContent;
    }
  }
}


// перевірка роботи функції

// console.log("=== Тестування Minesweeper ===");

// // 1. Генерація поля
// const testGame = generateField(5, 5, 5);
// console.log("Згенероване поле:");
// console.table(boardToPrintable(testGame));

// // 2. Перевірка countNeighbourMines
// console.log("Сусідні міни для клітинок:");
// for (let r = 0; r < 5; r++) {
//   for (let c = 0; c < 5; c++) {
//     console.log(`Клітинка [${r},${c}]:`, countNeighbourMines(testGame.board, r, c));
//   }
// }

// // 3. Відкриття клітинок
// console.log("Відкриваємо клітинку [0,0]");
// openCell(testGame, 0, 0);
// console.table(boardToPrintable(testGame));

// // 4. Встановлення та зняття прапорця
// console.log("Встановлюємо прапорець на клітинку [1,1]");
// toggleFlag(testGame, 1, 1);
// console.log(testGame.board[1][1]);

// console.log("Знімаємо прапорець з клітинки [1,1]");
// toggleFlag(testGame, 1, 1);
// console.log(testGame.board[1][1]);

// // 5. Таймер
// console.log("Запуск таймера на 3 секунди...");
// startTimer();
// setTimeout(() => {
//   stopTimer();
//   console.log("Таймер зупинено");
// }, 3000);

