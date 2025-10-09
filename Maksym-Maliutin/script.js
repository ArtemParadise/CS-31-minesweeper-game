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
      }
    }
    renderGameBoard(gameState);
  }
  
  // ==== Прив'язка кнопки Start ====
  startGameButton.addEventListener("click", startGame);
  
  // ==== Генеруємо поле одразу при завантаженні ====
  gameState = generateField(10, 10, 10);
  renderGameBoard(gameState);
  