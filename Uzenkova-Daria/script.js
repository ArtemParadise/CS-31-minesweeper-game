const CellState = {
  CLOSED: "closed",
  OPEN: "open",
  FLAGGED: "flagged",
};

const GameStatus = {
  IN_PROGRESS: "in-progress",
  WIN: "win",
  LOSE: "lose",
};

let timerInterval = null;
let elapsedSeconds = 0;

function formatTime(seconds) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainingSeconds = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function startTimer() {
  clearInterval(timerInterval);
  elapsedSeconds = 0;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    elapsedSeconds++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function updateTimerDisplay() {
  const timerElement = document.querySelector(".timer");
  if (timerElement) timerElement.textContent = `⏱ ${formatTime(elapsedSeconds)}`;
}

function createCell(hasMine = false) {
  return {
    hasMine: Boolean(hasMine),
    adjacentMines: 0,
    state: CellState.CLOSED,
    exploded: false,
  };
}

function createEmptyBoard(totalRows, totalCols) {
  return Array.from({ length: totalRows }, () =>
    Array.from({ length: totalCols }, () => createCell())
  );
}

function placeMines(board, minePositions) {
  for (const { row, col } of minePositions) {
    if (board[row] && board[row][col]) board[row][col].hasMine = true;
  }
}

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
      for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
        for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
          if (deltaRow === 0 && deltaCol === 0) continue;
          const neighborRow = row + deltaRow;
          const neighborCol = col + deltaCol;
          if (
            neighborRow >= 0 &&
            neighborRow < totalRows &&
            neighborCol >= 0 &&
            neighborCol < totalCols
          ) {
            if (board[neighborRow][neighborCol].hasMine) mineCount++;
          }
        }
      }
      board[row][col].adjacentMines = mineCount;
    }
  }
}

function createGame(totalRows, totalCols, totalMines) {
  const minePositions = [];
  while (minePositions.length < totalMines) {
    const randomRow = Math.floor(Math.random() * totalRows);
    const randomCol = Math.floor(Math.random() * totalCols);
    if (!minePositions.some(pos => pos.row === randomRow && pos.col === randomCol))
      minePositions.push({ row: randomRow, col: randomCol });
  }

  const board = createEmptyBoard(totalRows, totalCols);
  placeMines(board, minePositions);
  computeAdjacentCounts(board);

  return {
    totalRows,
    totalCols,
    totalMines,
    flagsLeft: totalMines,
    status: GameStatus.IN_PROGRESS,
    board,
  };
}

function revealAllMines(game) {
  for (let row = 0; row < game.totalRows; row++) {
    for (let col = 0; col < game.totalCols; col++) {
      const cell = game.board[row][col];
      if (cell.hasMine) cell.state = CellState.OPEN;
    }
  }
}

function openCell(game, row, col) {
  if (row < 0 || row >= game.totalRows || col < 0 || col >= game.totalCols) return;
  if (game.status !== GameStatus.IN_PROGRESS) return;

  const cell = game.board[row][col];
  if (cell.state !== CellState.CLOSED) return;

  cell.state = CellState.OPEN;

  if (cell.hasMine) {
    cell.exploded = true;
    game.status = GameStatus.LOSE;
    revealAllMines(game);
    return;
  }

  if (cell.adjacentMines === 0) {
    for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
      for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
        if (deltaRow === 0 && deltaCol === 0) continue;
        openCell(game, row + deltaRow, col + deltaCol);
      }
    }
  }

  const unopenedSafeCells = game.board
    .flat()
    .filter(cell => !cell.hasMine && cell.state !== CellState.OPEN).length;

  if (unopenedSafeCells === 0) {
    game.status = GameStatus.WIN;
    revealAllMines(game);
  }
}

function toggleFlag(game, row, col) {
  if (game.status !== GameStatus.IN_PROGRESS) return;
  const cell = game.board[row][col];
  if (cell.state === CellState.OPEN) return;

  if (cell.state === CellState.FLAGGED) {
    cell.state = CellState.CLOSED;
    game.flagsLeft++;
  } else {
    if (game.flagsLeft <= 0) return;
    cell.state = CellState.FLAGGED;
    game.flagsLeft--;
  }
}

function renderBoard(game) {
  const gridElement = document.querySelector(".grid");
  if (!gridElement) return;
  gridElement.innerHTML = "";

  for (let row = 0; row < game.totalRows; row++) {
    for (let col = 0; col < game.totalCols; col++) {
      const cell = game.board[row][col];
      const cellDiv = document.createElement("div");
      cellDiv.classList.add("cell");

      if (cell.state === CellState.CLOSED) {
        cellDiv.classList.add("cell-closed");
      } else if (cell.state === CellState.FLAGGED) {
        cellDiv.classList.add("cell-flag");
        cellDiv.textContent = "🚩";
      } else if (cell.state === CellState.OPEN && cell.hasMine) {
        cellDiv.classList.add(cell.exploded ? "cell-mine-clicked" : "cell-mine");
        cellDiv.textContent = "💣";
      } else if (cell.state === CellState.OPEN) {
        cellDiv.classList.add("cell-open");
        if (cell.adjacentMines > 0) {
          cellDiv.classList.add(`cell-num${cell.adjacentMines}`);
          cellDiv.textContent = cell.adjacentMines;
        }
      }

      cellDiv.addEventListener("click", () => {
        openCell(currentGame, row, col);
        renderBoard(currentGame);
        if (currentGame.status !== GameStatus.IN_PROGRESS) endGame(currentGame);
      });

      cellDiv.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        toggleFlag(currentGame, row, col);
        renderBoard(currentGame);
      });

      gridElement.appendChild(cellDiv);
    }
  }

  const flagsElement = document.querySelector(".flags");
  if (flagsElement)
    flagsElement.textContent = `🚩 ${String(game.flagsLeft).padStart(3, "0")}`;
  updateTimerDisplay();
}

function showModal(status, formattedTime, game) {
  const existingModal = document.querySelector(".modal-overlay");
  if (existingModal) existingModal.remove();

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
  <div class="modal-window">
    <h2>${status === GameStatus.WIN ? "🎉 You Win!" : "💥 You Lose!"}</h2>
    <p>⏱ Time: <b>${formattedTime}</b></p>
    <p>🚩 Flags remaining: <b>${game.flagsLeft}</b> / ${game.totalMines}</p>
    <div style="margin-top:12px;">
      <button class="modal-btn-restart">🔄 Restart</button>
      <button class="modal-btn-close" style="margin-left:8px;">Close</button>
    </div>
  </div>
`;

  document.body.appendChild(overlay);

  overlay.querySelector(".modal-btn-close").addEventListener("click", () => {
    overlay.remove();
  });

  overlay.querySelector(".modal-btn-restart").addEventListener("click", () => {
    overlay.remove();
    startNewGame(lastConfig.totalRows, lastConfig.totalCols, lastConfig.totalMines);
  });
}

function endGame(game) {
  stopTimer();
  renderBoard(game);

  const winSound = new Audio(
    "https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg"
  );
  const loseSound = new Audio(
    "https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg"
  );

  if (game.status === GameStatus.WIN) winSound.play();
  else loseSound.play();

  showModal(game.status, formatTime(elapsedSeconds), game);
  updateStartButton("🔄 Restart");
}

let currentGame = null;
let lastConfig = { totalRows: 10, totalCols: 10, totalMines: 10 };

function updateStartButton(text) {
  const button = document.querySelector(".start-btn");
  if (button) button.textContent = text;
}

function startNewGame(totalRows = 10, totalCols = 10, totalMines = 10) {
  lastConfig = { totalRows, totalCols, totalMines };
  const modal = document.querySelector(".modal-overlay");
  if (modal) modal.remove();

  stopTimer();
  currentGame = createGame(totalRows, totalCols, totalMines);
  renderBoard(currentGame);
  startTimer();
  updateStartButton("🔄 Restart");
}

document.addEventListener("DOMContentLoaded", () => {
  const startButton = document.querySelector(".start-btn");
  if (startButton) startButton.addEventListener("click", () => startNewGame());

  document.querySelector(".flags").textContent = `🚩 010`;
  document.querySelector(".timer").textContent = `⏱ 00:00`;
});
