
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
      this.board = this.createBoard(rows, cols);
      this.flags = 0;
      this.revealedCells = 0;
      this.status = "ready"; // ready | playing | won | lost
    }
  
    createBoard(rows, cols) {
      const board = [];
      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
          row.push(new Cell());
        }
        board.push(row);
      }
      return board;
    }
  }
  
  // ==== ГЕНЕРАЦІЯ ПОЛЯ ====
  function generateField(rows, cols, mineCount) {
    const game = new GameState(rows, cols, mineCount);
  
    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      if (!game.board[r][c].hasMine) {
        game.board[r][c].hasMine = true;
        minesPlaced++;
      }
    }
  
    computeNeighborCounts(game.board);
    return game;
  }
  
  function computeNeighborCounts(board) {
    const rows = board.length;
    const cols = board[0].length;
  
    function countNeighbors(r, c) {
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            if (board[nr][nc].hasMine) count++;
          }
        }
      }
      return count;
    }
  
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        board[r][c].neighborCount = countNeighbors(r, c);
      }
    }
  }
  
  // ==== ІГРОВА ЛОГІКА ====
  function openCell(game, r, c) {
    const cell = game.board[r][c];
    if (cell.state !== CELL_STATE.CLOSED) return;
    cell.state = CELL_STATE.OPEN;
    game.revealedCells++;
  
    if (cell.hasMine) {
      game.status = "lost";
      return;
    }
  
    if (cell.neighborCount === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < game.rows && nc >= 0 && nc < game.cols) {
            if (game.board[nr][nc].state === CELL_STATE.CLOSED) {
              openCell(game, nr, nc);
            }
          }
        }
      }
    }
  }
  
  function toggleFlag(game, r, c) {
    const cell = game.board[r][c];
    if (cell.state === CELL_STATE.CLOSED) {
      const flagsPlaced = game.board.flat().filter(c => c.state === CELL_STATE.FLAGGED).length;
      if (flagsPlaced >= game.mineCount) return;
      cell.state = CELL_STATE.FLAGGED;
    } else if (cell.state === CELL_STATE.FLAGGED) {
      cell.state = CELL_STATE.CLOSED;
    }
    updateFlagsCounter();
  }
  
  // ==== UI ЛОГІКА ====
  const boardWrapper = document.querySelector(".game-board");
  const headerFlags = document.querySelector(".game-board-header__flags_left");
  const headerTimer = document.querySelector(".game-board-header__timer");
  const startButton = document.querySelector(".start-button");
  
  let game = null;
  let uiTimerId = null;
  let uiTimeElapsed = 0;
  
  function formatTime(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  }
  
  // ==== Старт/рестарт гри ====
  function startGame() {
    stopUITimer();
    uiTimeElapsed = 0;
    headerTimer.textContent = "00:00";
  
    // Генеруємо нове поле
    game = generateField(10, 10, 10);
    game.status = "playing";
  
    headerFlags.textContent = String(game.mineCount).padStart(3, "0");
    renderBoard(game);
    startUITimer();
  }
  
  // ==== Рендеринг поля ====
  function renderBoard(game) {
    boardWrapper.innerHTML = "";
  
    for (let r = 0; r < game.rows; r++) {
      const rowDiv = document.createElement("div");
      rowDiv.classList.add("game-board-wrapper__row");
  
      for (let c = 0; c < game.cols; c++) {
        const cell = game.board[r][c];
        const cellDiv = document.createElement("div");
        cellDiv.classList.add("game-board__cell");
  
        if (cell.state === CELL_STATE.CLOSED) {
          cellDiv.classList.add("closed-cell");
        } else if (cell.state === CELL_STATE.FLAGGED) {
          cellDiv.classList.add("flagged-cell");
          if (game.status === "lost" && !cell.hasMine) {
            cellDiv.classList.add("wrong-flag-cell");
          }
        } else if (cell.state === CELL_STATE.OPEN) {
          cellDiv.classList.add("open-cell");
          if (cell.hasMine) {
            cellDiv.classList.add("mine-cell");
          } else if (cell.neighborCount > 0) {
            cellDiv.classList.add(`number-${cell.neighborCount}`);
            cellDiv.textContent = cell.neighborCount;
          }
        }
  
        cellDiv.addEventListener("click", () => {
          if (game.status !== "playing") return;
          openCell(game, r, c);
          checkGameStatus();
          renderBoard(game);
        });
  
        cellDiv.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          if (game.status !== "playing") return;
          toggleFlag(game, r, c);
          renderBoard(game);
        });
  
        rowDiv.appendChild(cellDiv);
      }
      boardWrapper.appendChild(rowDiv);
    }
  }
  
  // ==== Оновлення лічильника флагів ====
  function updateFlagsCounter() {
    let placedFlags = 0;
    for (let r = 0; r < game.rows; r++) {
      for (let c = 0; c < game.cols; c++) {
        if (game.board[r][c].state === CELL_STATE.FLAGGED) placedFlags++;
      }
    }
    const flagsLeft = game.mineCount - placedFlags;
    headerFlags.textContent = String(flagsLeft).padStart(3, "0");
  }
  
  // ==== Таймер ====
  function startUITimer() {
    if (uiTimerId) return;
    uiTimerId = setInterval(() => {
      uiTimeElapsed++;
      headerTimer.textContent = formatTime(uiTimeElapsed);
    }, 1000);
  }
  
  function stopUITimer() {
    clearInterval(uiTimerId);
    uiTimerId = null;
  }
  
  // ==== Перевірка стану гри ====
  function checkGameStatus() {
    if (game.status === "lost") {
      stopUITimer();
      revealAllMines();
      startButton.textContent = "Restart";
      alert("Game Over!");
    } else if (isWin()) {
      game.status = "won";
      stopUITimer();
      startButton.textContent = "Restart";
      alert("You Win!");
    }
  }
  
  function isWin() {
    let closedOrFlagged = 0;
    for (let r = 0; r < game.rows; r++) {
      for (let c = 0; c < game.cols; c++) {
        const cell = game.board[r][c];
        if (cell.state !== CELL_STATE.OPEN) closedOrFlagged++;
      }
    }
    return closedOrFlagged === game.mineCount;
  }
  
  function revealAllMines() {
    for (let r = 0; r < game.rows; r++) {
      for (let c = 0; c < game.cols; c++) {
        const cell = game.board[r][c];
        if (cell.hasMine) {
          cell.state = CELL_STATE.OPEN;
        }
      }
    }
    renderBoard(game);
  }
  
  // ==== Прив'язка кнопки Start ====
  startButton.addEventListener("click", startGame);
  
  // ==== Генеруємо поле одразу при завантаженні (видно, але неактивно) ====
  game = generateField(10, 10, 10);
  renderBoard(game);
  
=======
// --- Константи станів клітинки ---
const CELL_STATE = Object.freeze({
    CLOSED: 'closed',
    OPEN: 'open',
    FLAGGED: 'flagged'
});

// --- Створюємо фабрику для клітинки ---
function createCell({ hasMine = false, neighborCount = 0, state = CELL_STATE.CLOSED } = {}) {
    return {
        hasMine: Boolean(hasMine),        // булеве значення — наявність міни
        neighborCount: Number(neighborCount), // кількість сусідніх мін
        state                              // 'closed' | 'open' | 'flagged'
    };
}

// --- Ігровий стан (структура) ---
class GameState {
    constructor(rows = 10, cols = 10, mineCount = 10) {
        this.rows = rows;            // розмірність: кількість рядків
        this.cols = cols;            // розмірність: кількість стовпчиків
        this.mineCount = mineCount;  // кількість мін на полі
        this.status = 'playing';     // поточний стан гри: 'playing' | 'won' | 'lost'

        // внутрішнє подання поля — двовимірний масив об'єктів-клітинок
        this.board = createEmptyBoard(rows, cols);
    }
}

// --- Створити пусте поле зі стандартними клітинками ---
function createEmptyBoard(rows, cols) {
    const board = new Array(rows);
    for (let row = 0; row < rows; row++) {
        board[row] = new Array(cols);
        for (let col = 0; col < cols; col++) {
            board[row][col] = createCell();
        }
    }
    return board;
}

// --- Перевірка валідності позиції ---
function isValidPosition(board, row, col) {
    return row >= 0 && row < board.length && col >= 0 && col < board[0].length;
}

// --- Поставити міни у задані позиції (для тестових даних) ---
// positions — масив пар [row, col]
function placeMinesAtPositions(board, positions = []) {
    for (const [row, col] of positions) {
        if (isValidPosition(board, row, col)) {
            board[row][col].hasMine = true;
        }
    }
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
                        mineCount++;
                    }
                }
            }
            cell.neighborCount = mineCount;
        }
    }
}

// --- Ініціалізація прикладу ігрового поля з тестовими значеннями ---
function initTestGame(rows = 10, cols = 10, mines = []) {
    const game = new GameState(rows, cols, mines.length);
    placeMinesAtPositions(game.board, mines);
    computeNeighborCounts(game.board);
    return game;
}

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
        output += line + '\n';
    }

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
    testGame
};
