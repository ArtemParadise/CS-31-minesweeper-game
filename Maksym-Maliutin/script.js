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
  