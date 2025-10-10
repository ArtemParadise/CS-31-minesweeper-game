// ==== КОНСТАНТИ ====
const CELL_STATE = {
    CLOSED: "closed",
    OPEN: "open",
    FLAGGED: "flagged",
  };
  
  // ==== КЛАСИ ====
  class Cell {
    constructor() {
      this.hasMine = false;
      this.neighborCount = 0;
      this.state = CELL_STATE.CLOSED;
    }
  }
  
  class GameState {
    constructor(rows, cols, mineCount) {
      this.rows = rows;
      this.cols = cols;
      this.mineCount = mineCount;
      this.gameBoard = this.createBoard(rows, cols);
      this.flags = 0;
      this.revealedCells = 0;
      this.status = "ready"; // ready | playing | won | lost
    }
  
    createBoard(rows, cols) {
      const board = [];
      for (let row = 0; row < rows; row++) {
        const rowArray = [];
// --- Константи станів клітинки ---
const CELL_STATE = Object.freeze({
    CLOSED: 'closed',
    OPEN: 'open',
    FLAGGED: 'flagged'
});

// --- Створюємо фабрику для клітинки ---
function createCell({ hasMine = false, neighborCount = 0, state = CELL_STATE.CLOSED } = {}) {
    return {
        hasMine: Boolean(hasMine),
        neighborCount: Number(neighborCount),
        state
        hasMine: Boolean(hasMine),        // булеве значення — наявність міни
        neighborCount: Number(neighborCount), // кількість сусідніх мін
        state                              // 'closed' | 'open' | 'flagged'
    };
}

// --- Ігровий стан (структура) ---
class GameState {
    constructor(rows = 10, cols = 10, mineCount = 10) {
        this.rows = rows;
        this.cols = cols;
        this.mineCount = mineCount;
        this.status = 'playing';
        this.rows = rows;            // розмірність: кількість рядків
        this.cols = cols;            // розмірність: кількість стовпчиків
        this.mineCount = mineCount;  // кількість мін на полі
        this.status = 'playing';     // поточний стан гри: 'playing' | 'won' | 'lost'

        // внутрішнє подання поля — двовимірний масив об'єктів-клітинок
        this.board = createEmptyBoard(rows, cols);
    }
}

// --- Створити пусте поле ---
// --- Створити пусте поле зі стандартними клітинками ---
function createEmptyBoard(rows, cols) {
    const board = new Array(rows);
    for (let row = 0; row < rows; row++) {
        board[row] = new Array(cols);
        for (let col = 0; col < cols; col++) {
          rowArray.push(new Cell());
        }
        board.push(rowArray);
      }
      return board;
    }
  }
  
  // ==== ГЕНЕРАЦІЯ ПОЛЯ ====
  function generateField(rows, cols, mineCount) {
    const gameState = new GameState(rows, cols, mineCount);
  
    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);
      if (!gameState.gameBoard[row][col].hasMine) {
        gameState.gameBoard[row][col].hasMine = true;
        minesPlaced++;
      }
    }
  
    computeNeighborCounts(gameState.gameBoard);
    return gameState;
  }
  
  function computeNeighborCounts(gameBoard) {
    const rows = gameBoard.length;
    const cols = gameBoard[0].length;
  
    function countNeighbors(row, col) {
      let count = 0;
      for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
        for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
          if (deltaRow === 0 && deltaCol === 0) continue;
          const neighborRow = row + deltaRow;
          const neighborCol = col + deltaCol;
          if (
            neighborRow >= 0 &&
            neighborRow < rows &&
            neighborCol >= 0 &&
            neighborCol < cols
          ) {
            if (gameBoard[neighborRow][neighborCol].hasMine) count++;
          }
    return board;
}

// --- Перевірка валідності позиції ---
function isValidPosition(board, row, col) {
    return row >= 0 && row < board.length && col >= 0 && col < board[0].length;
}

// --- Поставити міни у задані позиції ---
function placeMinesAtPositions(board, positions = []) {
    for (const [row, col] of positions) {
        if (isValidPosition(board, row, col)) board[row][col].hasMine = true;
    }
}

// --- Обчислити neighborCount ---
function computeNeighborCounts(board) {
    const rows = board.length;
    const cols = board[0].length;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cell = board[row][col];

            if (cell.hasMine) {
                cell.neighborCount = null;
                continue;
            }

            let count = 0;
// --- Поставити міни у задані позиції (для тестових даних) ---
// positions — масив пар [row, col]
function placeMinesAtPositions(board, positions = []) {
    for (const [row, col] of positions) {
        if (isValidPosition(board, row, col)) {
            board[row][col].hasMine = true;
        }
      }
      return count;
    }
  
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        gameBoard[row][col].neighborCount = countNeighbors(row, col);
      }
    }
  }
  
  // ==== ІГРОВА ЛОГІКА ====
  function revealCell(gameState, row, col) {
    const cell = gameState.gameBoard[row][col];
    if (cell.state !== CELL_STATE.CLOSED) return;
    cell.state = CELL_STATE.OPEN;
    gameState.revealedCells++;
  
    if (cell.hasMine) {
      gameState.status = "lost";
      return;
    }
  
    if (cell.neighborCount === 0) {
      for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
        for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
          if (deltaRow === 0 && deltaCol === 0) continue;
          const neighborRow = row + deltaRow;
          const neighborCol = col + deltaCol;
          if (
            neighborRow >= 0 &&
            neighborRow < gameState.rows &&
            neighborCol >= 0 &&
            neighborCol < gameState.cols
          ) {
            if (
              gameState.gameBoard[neighborRow][neighborCol].state ===
              CELL_STATE.CLOSED
            ) {
              revealCell(gameState, neighborRow, neighborCol);
}

// --- Обчислити neighborCount для кожної клітинки ---
function computeNeighborCounts(board) {
    const totalRows = board.length;
    const totalCols = board[0].length;

    for (let row = 0; row < totalRows; row++) {
        for (let col = 0; col < totalCols; col++) {
            const cell = board[row][col];

            if (cell.hasMine) {
                cell.neighborCount = null; // або -1, але null читабельніше
                continue;
            }

            let mineCount = 0;
            for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
                for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
                    if (deltaRow === 0 && deltaCol === 0) continue;
                    const neighborRow = row + deltaRow;
                    const neighborCol = col + deltaCol;
                    if (isValidPosition(board, neighborRow, neighborCol) && board[neighborRow][neighborCol].hasMine) {
                        count++;
                    }
                }
            }
            cell.neighborCount = count;
        }
    }
}

// --- Ініціалізація тестового поля ---
                        mineCount++;
                    }
                }
            }
          }
        }
      }
    }
  }
  
  function toggleFlagOnCell(gameState, row, col) {
    const cell = gameState.gameBoard[row][col];
    if (cell.state === CELL_STATE.CLOSED) {
      const flagsPlaced = gameState.gameBoard
        .flat()
        .filter((c) => c.state === CELL_STATE.FLAGGED).length;
      if (flagsPlaced >= gameState.mineCount) return;
      cell.state = CELL_STATE.FLAGGED;
    } else if (cell.state === CELL_STATE.FLAGGED) {
      cell.state = CELL_STATE.CLOSED;
    }
    updateFlagsCounter(gameState);
  }
  
  // ==== UI ЛОГІКА ====
  const boardWrapperElement = document.querySelector(".game-board");
  const flagsCounterElement = document.querySelector(
    ".game-board-header__flags_left"
  );
  const timerElement = document.querySelector(".game-board-header__timer");
  const startGameButton = document.querySelector(".start-button");
  
  let gameState = null;
  let timerId = null;
  let elapsedTime = 0;
  
  function formatTime(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  }
  
  // ==== Старт/рестарт гри ====
  function startGame() {
    stopUITimer();
    elapsedTime = 0;
    timerElement.textContent = "00:00";
  
    gameState = generateField(10, 10, 10);
    gameState.status = "playing";
  
    flagsCounterElement.textContent = String(gameState.mineCount).padStart(3, "0");
    renderGameBoard(gameState);
    startUITimer();
  }
  
  // ==== Рендеринг поля ====
  function renderGameBoard(gameState) {
    boardWrapperElement.innerHTML = "";
  
    for (let row = 0; row < gameState.rows; row++) {
      const rowElement = document.createElement("div");
      rowElement.classList.add("game-board-wrapper__row");
  
      for (let col = 0; col < gameState.cols; col++) {
        const cell = gameState.gameBoard[row][col];
        const cellElement = document.createElement("div");
        cellElement.classList.add("game-board__cell");
  
        if (cell.state === CELL_STATE.CLOSED) {
          cellElement.classList.add("closed-cell");
        } else if (cell.state === CELL_STATE.FLAGGED) {
          cellElement.classList.add("flagged-cell");
          if (gameState.status === "lost" && !cell.hasMine) {
            cellElement.classList.add("wrong-flag-cell");
          }
        } else if (cell.state === CELL_STATE.OPEN) {
          cellElement.classList.add("open-cell");
          if (cell.hasMine) {
            cellElement.classList.add("mine-cell");
          } else if (cell.neighborCount > 0) {
            cellElement.classList.add(`number-${cell.neighborCount}`);
            cellElement.textContent = cell.neighborCount;
          }
        }
  
        cellElement.addEventListener("click", () => {
          if (gameState.status !== "playing") return;
          revealCell(gameState, row, col);
          updateGameStatus();
          renderGameBoard(gameState);
        });
  
        cellElement.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          if (gameState.status !== "playing") return;
          toggleFlagOnCell(gameState, row, col);
          renderGameBoard(gameState);
        });
  
        rowElement.appendChild(cellElement);
      }
      boardWrapperElement.appendChild(rowElement);
    }
  }
  
  // ==== Оновлення лічильника флагів ====
  function updateFlagsCounter(gameState) {
    let placedFlags = 0;
    for (let row = 0; row < gameState.rows; row++) {
      for (let col = 0; col < gameState.cols; col++) {
        if (gameState.gameBoard[row][col].state === CELL_STATE.FLAGGED) placedFlags++;
      }
    }
    const flagsLeft = gameState.mineCount - placedFlags;
    flagsCounterElement.textContent = String(flagsLeft).padStart(3, "0");
  }
  
  // ==== Таймер ====
  function startUITimer() {
    if (timerId) return;
    timerId = setInterval(() => {
      elapsedTime++;
      timerElement.textContent = formatTime(elapsedTime);
    }, 1000);
  }
  
  function stopUITimer() {
    clearInterval(timerId);
    timerId = null;
  }
  
  // ==== Перевірка стану гри ====
  function updateGameStatus() {
    if (gameState.status === "lost") {
      stopUITimer();
      revealAllMines();
      startGameButton.textContent = "Restart";
      alert("Game Over!");
    } else if (checkWinCondition()) {
      gameState.status = "won";
      stopUITimer();
      startGameButton.textContent = "Restart";
      alert("You Win!");
    }
  }
  
  function checkWinCondition() {
    let closedOrFlagged = 0;
    for (let row = 0; row < gameState.rows; row++) {
      for (let col = 0; col < gameState.cols; col++) {
        const cell = gameState.gameBoard[row][col];
        if (cell.state !== CELL_STATE.OPEN) closedOrFlagged++;
      }
    }
    return closedOrFlagged === gameState.mineCount;
  }
  
  function revealAllMines() {
    for (let row = 0; row < gameState.rows; row++) {
      for (let col = 0; col < gameState.cols; col++) {
        const cell = gameState.gameBoard[row][col];
        if (cell.hasMine) {
          cell.state = CELL_STATE.OPEN;
}

// --- Ініціалізація прикладу ігрового поля з тестовими значеннями ---
function initTestGame(rows = 10, cols = 10, mines = []) {
    const game = new GameState(rows, cols, mines.length);
    placeMinesAtPositions(game.board, mines);
    computeNeighborCounts(game.board);
    return game;
}

// --- Вивід поля в консоль ---
function printBoardToConsole(board) {
    const rows = board.length;
    const cols = board[0].length;
    let out = '\n';
    for (let row = 0; row < rows; row++) {
        let line = '';
        for (let col = 0; col < cols; col++) {
            const cell = board[row][col];
            if (cell.hasMine) line += '💣';
            else line += ' ' + cell.neighborCount + ' ';
        }
        out += line + '\n';
    }
    console.log(out);
}

// --- Приклад тестового поля ---
const exampleMines = [
    [0, 3], [0, 6], [1, 8], [2, 2], [3, 0], [4, 5], [6, 9], [7, 7], [8, 1], [9, 4]
];
const testGame = initTestGame(10, 10, exampleMines);
console.log('Test game initialized. Game state:');
console.log({ rows: testGame.rows, cols: testGame.cols, mineCount: testGame.mineCount, status: testGame.status });
printBoardToConsole(testGame.board);

// --- Нові функції для логіки гри ---

// Генерація випадкового поля
function generateField(rows = 10, cols = 10, mineCount = 10) {
    const game = new GameState(rows, cols, mineCount);
    let minesPlaced = 0;

    while (minesPlaced < mineCount) {
        const randomRow = Math.floor(Math.random() * rows);
        const randomCol = Math.floor(Math.random() * cols);

        if (!game.board[randomRow][randomCol].hasMine) {
            game.board[randomRow][randomCol].hasMine = true;
            minesPlaced++;
        }
    }
    computeNeighborCounts(game.board);
    return game.board;
}

// Підрахунок мін навколо клітинки
function countNeighbourMines(board, row, col) {
    if (!isValidPosition(board, row, col)) return 0;
    return board[row][col].neighborCount;
}

// Відкриття клітинки
function openCell(game, row, col) {
    if (!isValidPosition(game.board, row, col)) return;
    const cell = game.board[row][col];

    if (cell.state !== CELL_STATE.CLOSED) return;

    if (cell.hasMine) {
        cell.state = CELL_STATE.OPEN;
        game.status = 'lost';
        return;
    }

    function reveal(currentRow, currentCol) {
        if (!isValidPosition(game.board, currentRow, currentCol)) return;
        const currentCell = game.board[currentRow][currentCol];

        if (currentCell.state === CELL_STATE.OPEN || currentCell.state === CELL_STATE.FLAGGED) return;

        currentCell.state = CELL_STATE.OPEN;

        if (currentCell.neighborCount === 0) {
            for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
                for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
                    if (deltaRow === 0 && deltaCol === 0) continue;
                    reveal(currentRow + deltaRow, currentCol + deltaCol);
                }
            }
        }
    }

    reveal(row, col);
}

// Встановлення / зняття прапорця
function toggleFlag(game, row, col) {
    if (!isValidPosition(game.board, row, col)) return;
    const cell = game.board[row][col];

    if (cell.state === CELL_STATE.CLOSED) {
        cell.state = CELL_STATE.FLAGGED;
    } else if (cell.state === CELL_STATE.FLAGGED) {
        cell.state = CELL_STATE.CLOSED;
    }
}

// Таймер
let timerId = null;
let timeElapsed = 0;

function startTimer() {
    if (timerId) return;
    timerId = setInterval(() => {
        timeElapsed++;
        console.log('Time:', timeElapsed);
    }, 1000);
}

function stopTimer() {
    clearInterval(timerId);
    timerId = null;
}

// --- Прив'язка до window для зручності тестування ---
// --- Утиліти для виводу в консоль (для перевірки) ---
function printBoardToConsole(board) {
    const totalRows = board.length;
    const totalCols = board[0].length;
    let output = '\n';

    for (let row = 0; row < totalRows; row++) {
        let line = '';
        for (let col = 0; col < totalCols; col++) {
            const cell = board[row][col];
            if (cell.hasMine) {
                line += ' M ';
            } else {
                line += ' ' + cell.neighborCount + ' ';
            }
        }
      }
    }
    renderGameBoard(gameState);
  }
  
  // ==== Прив'язка кнопки Start ====
  startGameButton.addEventListener("click", startGame);
  
  // ==== Генеруємо поле одразу при завантаженні ====
  gameState = generateField(10, 10, 10);
  renderGameBoard(gameState);
  

    console.log(output);
}

// --- Приклад: тестове поле 10x10 з кількома минами ---
const exampleMines = [
    [0, 3], [0, 6], [1, 8], [2, 2], [3, 0], [4, 5], [6, 9], [7, 7], [8, 1], [9, 4]
];

// Ініціалізуємо тестову гру і виведемо в консоль
const testGame = initTestGame(10, 10, exampleMines);
console.log('Test game initialized. Game state:');
console.log({
    rows: testGame.rows,
    cols: testGame.cols,
    mineCount: testGame.mineCount,
    status: testGame.status
});
printBoardToConsole(testGame.board);

// Зручно — прив'яжемо до window для доступу з консолі браузера
window.minesweeperGame = {
    CELL_STATE,
    createCell,
    createEmptyBoard,
    placeMinesAtPositions,
    computeNeighborCounts,
    initTestGame,
    printBoardToConsole,
    testGame,
    generateField,
    countNeighbourMines,
    openCell,
    toggleFlag,
    startTimer,
    stopTimer,
    timeElapsed
};


// --- Як тестувати реалізовані функції ---

// 1. Генерація випадкового поля
// const randomBoard = minesweeperGame.generateField(10, 10, 15);
// console.log(randomBoard);
// Кожен запуск має створювати поле 10x10 з 15 випадковими мінами

// 2. Підрахунок кількості мін навколо клітинки
// console.log(minesweeperGame.countNeighbourMines(testGame.board, 0, 0));
// console.log(minesweeperGame.countNeighbourMines(testGame.board, 1, 8));
// Повинно показувати правильну кількість сусідніх мін

// 3. Відкриття клітинки
// minesweeperGame.openCell(testGame, 2, 3);
// console.log(testGame.board[2][3].state);
// Якщо клітинка без міни — відкривається, якщо 0 — відкриваються сусідні
// Якщо клітинка з міною — testGame.status = 'lost'

// 4. Встановлення / зняття прапорця
// minesweeperGame.toggleFlag(testGame, 0, 0);
// console.log(testGame.board[0][0].state);
// Повинно змінювати стан між 'closed' і 'flagged'

// 5. Таймер
// minesweeperGame.startTimer();
// setTimeout(() => { minesweeperGame.stopTimer(); console.log('Час гри:', minesweeperGame.timeElapsed); }, 5000);
// Починає відлік часу і зупиняє через 5 секунд, виводить пройдений час
    testGame
};
