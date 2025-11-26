// -----------------------------
// Minesweeper logic + UI integration
// -----------------------------

// ensure default CSS variable exists
document.documentElement.style.setProperty('--cell-size', '35px');

// --- Classes ---
class Cell {
  constructor() {
      this.hasMine = false;
      this.neighborMines = 0;
      this.state = "closed"; // "closed", "open", "flagged"
  }
}

class GameState {
  constructor(rows, cols, mineCount) {
      this.rows = rows;
      this.cols = cols;
      this.mineCount = mineCount;
      this.currentState = "inProgress"; // inProgress / won / lost
      this.timer = 0;
      this.timerInterval = null;
      this.started = false;
  }
}

// --- Game object ---
const game = {
  board: [],
  gameState: null,
};

// --- DOM elements ---
const scaleSlider = document.getElementById('scale');
const scaleValue = document.getElementById('scale-value');
const selectBtn = document.querySelector('.select-btn');
const options = document.querySelector('.options');
const selected = document.querySelector('.selected');
const optionItems = document.querySelectorAll('.options li');

const mineCountDisplay = document.getElementById('mine-count');
const gameStatusDisplay = document.getElementById('game-status'); // optional
const timerDisplay = document.getElementById('timer');
const gameBoardContainer = document.getElementById('game-board');
const restartButton = document.getElementById('restart-button');
const revealSafeButton = document.getElementById('reveal-safe');

// --- UI helpers ---
function setCellSizeByScale(value) {
  const base = 35;
  const size = Math.round(base * (0.7 + value * 0.06)); // ~22..59
  document.documentElement.style.setProperty('--cell-size', `${size}px`);
  if (scaleValue) scaleValue.textContent = Math.round((size / base) * 100) + '%';
  // update grid columns to current cols (if game exists)
  if (game.gameState) {
    gameBoardContainer.style.gridTemplateColumns = `repeat(${game.gameState.cols}, var(--cell-size))`;
  }
}

if (scaleSlider) {
  setCellSizeByScale(scaleSlider.value);
  scaleSlider.addEventListener('input', (e) => {
    setCellSizeByScale(e.target.value);
  });
}

// dropdown difficulty
if (selectBtn) {
  selectBtn.addEventListener('click', () => {
    options.style.display = options.style.display === 'block' ? 'none' : 'block';
  });
}
optionItems.forEach(option => {
  option.addEventListener('click', () => {
    optionItems.forEach(o => o.classList.remove('active'));
    option.classList.add('active');
    selected.textContent = option.textContent;
    options.style.display = 'none';

    const rows = parseInt(option.dataset.rows, 10) || 9;
    const cols = parseInt(option.dataset.cols, 10) || 9;
    const mines = parseInt(option.dataset.mines, 10) || 10;
    initializeGame(rows, cols, mines);
  });
});

// close dropdown when click outside
document.addEventListener('click', (e) => {
  if (!document.querySelector('.difficulty-select').contains(e.target)) {
    options.style.display = 'none';
  }
});

// --- Core functions ---
function generateField(rows, cols, mines) {
  const field = [];
  for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < cols; j++) {
          row.push(new Cell());
      }
      field.push(row);
  }

  let minesPlaced = 0;
  while (minesPlaced < mines) {
      const randomRow = Math.floor(Math.random() * rows);
      const randomCol = Math.floor(Math.random() * cols);

      if (!field[randomRow][randomCol].hasMine) {
          field[randomRow][randomCol].hasMine = true;
          minesPlaced++;
      }
  }

  for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
          if (!field[i][j].hasMine) {
              field[i][j].neighborMines = countNeighbourMines(field, i, j);
          }
      }
  }

  console.log("Generated Game Field with Neighbor Mines:", field);
  return field;
}

function countNeighbourMines(field, row, col) {
  let count = 0;
  const rows = field.length;
  const cols = field[0].length;

  for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue;

          const newRow = row + i;
          const newCol = col + j;

          if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
              if (field[newRow][newCol].hasMine) {
                  count++;
              }
          }
      }
  }
  return count;
}

function openCell(row, col) {
  const { board, gameState } = game;
  const { rows, cols } = gameState;

  if (!gameState.started) {
    startTimer();
    gameState.started = true;
  }

  if (row < 0 || row >= rows || col < 0 || col >= cols) return;
  const target = board[row][col];

  if (target.state === "open" || target.state === "flagged" || gameState.currentState !== "inProgress") return;

  target.state = "open";

  if (target.hasMine) {
      gameState.currentState = "lost";
      revealAllMines();
      updateGameInfoDisplay();
      console.log("Game State: Lost - You hit a mine at (", row, ",", col, ")!");
      return;
  }

  if (target.neighborMines === 0) {
      for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
              if (i === 0 && j === 0) continue;
              openCell(row + i, col + j);
          }
      }
  }

  // Check for win condition
  let closedOrFlagged = 0;
  for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
          const s = board[i][j].state;
          if (s === "closed" || s === "flagged") closedOrFlagged++;
      }
  }
  if (closedOrFlagged === gameState.mineCount) {
      gameState.currentState = "won";
      revealAllMines(true);
      updateGameInfoDisplay();
      console.log("Game State: Won!");
  }

  renderBoard();
  updateGameInfoDisplay();
}

function toggleFlag(row, col) {
  const { board, gameState } = game;
  const { rows, cols } = gameState;

  if (row < 0 || row >= rows || col < 0 || col >= cols || gameState.currentState !== "inProgress") return;
  const cell = board[row][col];

  if (cell.state === "open") return;

  cell.state = cell.state === "flagged" ? "closed" : "flagged";

  renderBoard();
  updateGameInfoDisplay();
  console.log("Cell (", row, ",", col, ") flag state updated to:", cell.state);
}

function revealAllMines(markFlagsCorrect=false) {
  const { board, gameState } = game;
  for (let i = 0; i < gameState.rows; i++) {
    for (let j = 0; j < gameState.cols; j++) {
      const c = board[i][j];
      if (c.hasMine) {
        if (c.state !== 'flagged') c.state = 'open';
      }
    }
  }
  renderBoard();
}

// Timer
function startTimer() {
  const { gameState } = game;
  if (!gameState) return;
  if (gameState.timerInterval) return;
  gameState.timerInterval = setInterval(() => {
    gameState.timer++;
    updateGameInfoDisplay();
  }, 1000);
}

function stopTimer() {
  const { gameState } = game;
  if (gameState && gameState.timerInterval) {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
  }
}

// UI updates
function updateGameInfoDisplay() {
  const { gameState } = game;
  if (!gameState) return;
  mineCountDisplay.textContent = gameState.mineCount;
  const statusEl = document.getElementById('game-status');
  if (statusEl) statusEl.textContent = gameState.currentState;
  if (timerDisplay) timerDisplay.textContent = gameState.timer;
  if (gameState.currentState === "won") {
      stopTimer();
      if (statusEl) statusEl.style.color = "green";
  } else if (gameState.currentState === "lost") {
      stopTimer();
      if (statusEl) statusEl.style.color = "red";
  } else {
      if (statusEl) statusEl.style.color = "#111";
  }
}

// Render board
function renderBoard() {
    const { board, gameState } = game;
    if (!gameState) return;
    const { rows, cols } = gameState;

    gameBoardContainer.innerHTML = '';
    gameBoardContainer.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
    gameBoardContainer.style.gridAutoRows = `var(--cell-size)`;
    gameBoardContainer.style.gap = '2px';

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const cellElement = document.createElement('div');
            cellElement.classList.add('cell');
            cellElement.dataset.row = i;
            cellElement.dataset.col = j;

            const cell = board[i][j];

            if (cell.state === "open") {
                cellElement.classList.add('open');
                if (cell.hasMine) {
                    cellElement.classList.add('bomb');
                    cellElement.textContent = '💣';
                } else if (cell.neighborMines > 0) {
                    cellElement.classList.add(`num${cell.neighborMines}`);
                    cellElement.textContent = cell.neighborMines;
                } else {
                    cellElement.textContent = '';
                }
            } else if (cell.state === "flagged") {
                cellElement.classList.add('flag');
                cellElement.textContent = '🚩';
            } else {
                cellElement.textContent = '';
            }

            cellElement.title = `r:${i} c:${j}`;
            gameBoardContainer.appendChild(cellElement);
        }
    }
}

// Initialization
function initializeGame(rows = 9, cols = 9, mines = 10) {
    if (game.gameState && game.gameState.timerInterval) clearInterval(game.gameState.timerInterval);
    game.board = generateField(rows, cols, mines);
    game.gameState = new GameState(rows, cols, mines);
    game.gameState.started = false;
    // adjust grid columns
    gameBoardContainer.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
    setCellSizeByScale(scaleSlider ? scaleSlider.value : 5);
    renderBoard();
    updateGameInfoDisplay();
}

// Start with default easy
initializeGame(9, 9, 10);

// Events
gameBoardContainer.addEventListener('click', (event) => {
    const cellElement = event.target.closest('.cell');
    if (!cellElement) return;
    const row = parseInt(cellElement.dataset.row, 10);
    const col = parseInt(cellElement.dataset.col, 10);
    if (isNaN(row) || isNaN(col)) return;
    openCell(row, col);
});

gameBoardContainer.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    const cellElement = event.target.closest('.cell');
    if (!cellElement) return;
    const row = parseInt(cellElement.dataset.row, 10);
    const col = parseInt(cellElement.dataset.col, 10);
    if (isNaN(row) || isNaN(col)) return;
    toggleFlag(row, col);
});

// Spacebar + hover flagging
let hoveredCell = null;
gameBoardContainer.addEventListener('pointerover', (e) => {
  const cell = e.target.closest('.cell');
  hoveredCell = cell;
});
gameBoardContainer.addEventListener('pointerout', (e) => {
  hoveredCell = null;
});
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && hoveredCell) {
    e.preventDefault();
    const row = parseInt(hoveredCell.dataset.row, 10);
    const col = parseInt(hoveredCell.dataset.col, 10);
    toggleFlag(row, col);
  }
});

// Restart button
restartButton.addEventListener('click', () => {
  const gs = game.gameState;
  initializeGame(gs.rows, gs.cols, gs.mineCount);
});

// Reveal safe
revealSafeButton.addEventListener('click', () => {
  const { board, gameState } = game;
  for (let i = 0; i < gameState.rows; i++) {
    for (let j = 0; j < gameState.cols; j++) {
      const c = board[i][j];
      if (c.state === 'closed' && !c.hasMine && c.neighborMines === 0) {
        openCell(i,j);
      }
    }
  }
  renderBoard();
  updateGameInfoDisplay();
});
