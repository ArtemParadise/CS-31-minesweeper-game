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
let seconds = 0;

function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function startTimer() {
  clearInterval(timerInterval);
  seconds = 0;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    seconds++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function updateTimerDisplay() {
  const timerEl = document.querySelector(".timer");
  if (timerEl) timerEl.textContent = `⏱ ${formatTime(seconds)}`;
}

function createCell(hasMine = false) {
  return {
    hasMine: Boolean(hasMine),
    adjacentMines: 0,
    state: CellState.CLOSED,
    exploded: false,
  };
}

function createEmptyBoard(rows, cols) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => createCell())
  );
}

function placeMines(board, positions) {
  for (const { r, c } of positions) {
    if (board[r] && board[r][c]) board[r][c].hasMine = true;
  }
}

function computeAdjacentCounts(board) {
  const rows = board.length;
  const cols = board[0].length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].hasMine) {
        board[r][c].adjacentMines = -1;
        continue;
      }
      let cnt = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            if (board[nr][nc].hasMine) cnt++;
          }
        }
      }
      board[r][c].adjacentMines = cnt;
    }
  }
}

function createGame(rows, cols, minesCount) {
  const positions = [];
  while (positions.length < minesCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!positions.some(p => p.r === r && p.c === c)) positions.push({ r, c });
  }

  const board = createEmptyBoard(rows, cols);
  placeMines(board, positions);
  computeAdjacentCounts(board);

  return {
    rows,
    cols,
    mines: minesCount,
    flagsLeft: minesCount,
    status: GameStatus.IN_PROGRESS,
    board,
  };
}

function revealAllMines(game) {
  for (let r = 0; r < game.rows; r++) {
    for (let c = 0; c < game.cols; c++) {
      const cell = game.board[r][c];
      if (cell.hasMine) cell.state = CellState.OPEN;
    }
  }
}

function openCell(game, row, col) {
  if (row < 0 || row >= game.rows || col < 0 || col >= game.cols) return;
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
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        openCell(game, row + dr, col + dc);
      }
    }
  }

  const unopenedSafe = game.board
    .flat()
    .filter(c => !c.hasMine && c.state !== CellState.OPEN).length;

  if (unopenedSafe === 0) {
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
  const grid = document.querySelector(".grid");
  if (!grid) return;
  grid.innerHTML = "";

  for (let r = 0; r < game.rows; r++) {
    for (let c = 0; c < game.cols; c++) {
      const cell = game.board[r][c];
      const div = document.createElement("div");
      div.classList.add("cell");

      if (cell.state === CellState.CLOSED) {
        div.classList.add("cell-closed");
      } else if (cell.state === CellState.FLAGGED) {
        div.classList.add("cell-flag");
        div.textContent = "🚩";
      } else if (cell.state === CellState.OPEN && cell.hasMine) {
        div.classList.add(cell.exploded ? "cell-mine-clicked" : "cell-mine");
        div.textContent = "💣";
      } else if (cell.state === CellState.OPEN) {
        div.classList.add("cell-open");
        if (cell.adjacentMines > 0) {
          div.classList.add(`cell-num${cell.adjacentMines}`);
          div.textContent = cell.adjacentMines;
        }
      }

      div.addEventListener("click", () => {
        openCell(currentGame, r, c);
        renderBoard(currentGame);
        if (currentGame.status !== GameStatus.IN_PROGRESS) endGame(currentGame);
      });

      div.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        toggleFlag(currentGame, r, c);
        renderBoard(currentGame);
      });

      grid.appendChild(div);
    }
  }

  const flagsEl = document.querySelector(".flags");
  if (flagsEl) flagsEl.textContent = `🚩 ${String(game.flagsLeft).padStart(3, "0")}`;
  updateTimerDisplay();
}

function showModal(status, timeStr, game) {
  const existing = document.querySelector(".modal-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
  <div class="modal-window">
    <h2>${status === GameStatus.WIN ? "🎉 You Win!" : "💥 You Lose!"}</h2>
    <p>⏱ Time: <b>${timeStr}</b></p>
    <p>🚩 Flags remaining: <b>${game.flagsLeft}</b> / ${game.mines}</p>
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
    startNewGame(lastConfig.rows, lastConfig.cols, lastConfig.mines);
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

  showModal(game.status, formatTime(seconds), game);
  updateStartButton("🔄 Restart");
}


let currentGame = null;
let lastConfig = { rows: 10, cols: 10, mines: 10 };

function updateStartButton(text) {
  const btn = document.querySelector(".start-btn");
  if (btn) btn.textContent = text;
}

function startNewGame(rows = 10, cols = 10, mines = 10) {
  lastConfig = { rows, cols, mines };
  const modal = document.querySelector(".modal-overlay");
  if (modal) modal.remove();

  stopTimer();
  currentGame = createGame(rows, cols, mines);
  renderBoard(currentGame);
  startTimer();
  updateStartButton("🔄 Restart");
}

document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.querySelector(".start-btn");
  if (startBtn) startBtn.addEventListener("click", () => startNewGame());

  document.querySelector(".flags").textContent = `🚩 010`;
  document.querySelector(".timer").textContent = `⏱ 00:00`;
});
