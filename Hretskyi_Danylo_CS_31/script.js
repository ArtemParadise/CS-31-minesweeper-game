// ===============================
// Константи поля
// ===============================
const ROWS = 9;
const COLS = 9;
const MINES = 10;

// Стани клітинки
const CELL_STATE = Object.freeze({
  COVERED: 0,    // закрита клітинка
  UNCOVERED: 1,  // відкрита клітинка
  FLAGGED: 2     // прапор
});

// Стани гри
const GAME_STATE = Object.freeze({
  PLAYING: 0,  // гра в процесі
  WIN: 1,      // гра виграна
  LOSE: -1     // гра програна
});

// Об’єкт гри (model)
const game = {
  rows: ROWS,
  cols: COLS,
  mines: MINES,
  status: GAME_STATE.PLAYING,
  board: [],
  explodedCell: null, // координати клітинки, де підірвалися
};

// Таймер
let timerId = null;
let seconds = 0;

// ===============================
// Модель: створення поля, мін, підрахунок сусідів
// ===============================

// Фабрика клітинки
const makeCell = (row, col) => ({
  row,
  col,
  mine: false,                    // чи є міна
  adj: 0,                         // кількість мін навколо
  state: CELL_STATE.COVERED       // поточний стан
});

// Двовимірний масив поля
function createBoard(all_rows = ROWS, all_cols = COLS) {
  const board = [];
  for (let r = 0; r < all_rows; r++) {
    const rowArr = [];
    for (let c = 0; c < all_cols; c++) {
      rowArr.push(makeCell(r, c));
    }
    board.push(rowArr);
  }
  return board;
}

const inBounds = (r, c, rows, cols) =>
  r >= 0 && r < rows && c >= 0 && c < cols;

// Розставити міни випадково
function generateField(rows = ROWS, cols = COLS, mines = MINES) {
  const field = createBoard(rows, cols);
  const total = rows * cols;
  const toPlace = Math.min(mines, total);

  let placed = 0;
  while (placed < toPlace) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    if (field[row][col].mine) continue;
    field[row][col].mine = true;
    placed++;
  }
  return field;
}

// Порахувати кількість мін навколо клітинки
function countNeighbourMines(field, row, col) {
  const rows = field.length, cols = field[0].length;
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = row + dr, cc = col + dc;
      if (inBounds(rr, cc, rows, cols) && field[rr][cc].mine) count++;
    }
  }
  return count;
}

// Записати adj для всіх клітинок
function computeAllAdj(field) {
  for (let r = 0; r < field.length; r++) {
    for (let c = 0; c < field[0].length; c++) {
      field[r][c].adj = countNeighbourMines(field, r, c);
    }
  }
}

// Перевірка виграшу
function isWin(board) {
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      const cell = board[r][c];
      if (!cell.mine && cell.state !== CELL_STATE.UNCOVERED) return false;
    }
  }
  return true;
}

// ===============================
// Логіка відкриття клітинки
// ===============================
function openCell(row, col) {
  if (game.status !== GAME_STATE.PLAYING) return;
  if (!inBounds(row, col, game.rows, game.cols)) return;

  const { board } = game;
  const cell = board[row][col];

  // якщо вже відкрита або тут прапор — ігноруємо
  if (cell.state === CELL_STATE.UNCOVERED || cell.state === CELL_STATE.FLAGGED) return;

  // запуск таймера при першому реальному відкритті
  if (timerId === null) startTimer();

  // якщо тут міна — програш
  if (cell.mine) {
    cell.state = CELL_STATE.UNCOVERED;
    game.status = GAME_STATE.LOSE;
    game.explodedCell = { row, col };
    stopTimer();
    return;
  }

  // Flood fill (стек) для відкриття пустих клітинок
  const stack = [[row, col]];
  while (stack.length) {
    const [r, c] = stack.pop();
    const currentCell = board[r][c];

    if (currentCell.state === CELL_STATE.UNCOVERED || currentCell.state === CELL_STATE.FLAGGED) continue;

    currentCell.state = CELL_STATE.UNCOVERED;

    if (currentCell.adj === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const rr = r + dr, cc = c + dc;
          if (inBounds(rr, cc, game.rows, game.cols)) {
            const neighbourCell = board[rr][cc];
            if (neighbourCell.state === CELL_STATE.COVERED && !neighbourCell.mine) {
              stack.push([rr, cc]);
            }
          }
        }
      }
    }
  }

  // Перевірка виграшу
  if (isWin(game.board)) {
    game.status = GAME_STATE.WIN;
    stopTimer();
  }
}

// ===============================
// Логіка прапорців
// ===============================
function toggleFlag(row, col) {
  if (game.status !== GAME_STATE.PLAYING) return;
  if (!inBounds(row, col, game.rows, game.cols)) return;

  const cell = game.board[row][col];

  // по відкритій клітинці прапор не ставимо
  if (cell.state === CELL_STATE.UNCOVERED) return;

  const wasFlagged = (cell.state === CELL_STATE.FLAGGED);

  // якщо хочемо ПОСТАВИТИ новий прапор,
  // перевіряємо, чи не закінчились
  if (!wasFlagged) {
    const used = countFlags(game.board); // скільки вже прапорців стоїть
    if (used >= game.mines) {
      // всі прапори вже використані – нічого не робимо
      return;
    }
  }

  // якщо прапор був — знімаємо, якщо не було — ставимо
  cell.state = wasFlagged ? CELL_STATE.COVERED : CELL_STATE.FLAGGED;
}


function countFlags(board = game.board) {
  let n = 0;
  for (let r = 0; r < board.length; r++)
    for (let c = 0; c < board[0].length; c++)
      if (board[r][c].state === CELL_STATE.FLAGGED) n++;
  return n;
}

// ===============================
// Таймер
// ===============================
function updateTimerDisplay() {
  if (!timerEl) return;
  const clamped = Math.min(seconds, 999);
  timerEl.textContent = String(clamped).padStart(3, '0');
}

function startTimer() {
  if (timerId !== null) return;
  // seconds обнуляється в newGame, тут не чіпаємо
  timerId = setInterval(() => {
    seconds++;
    updateTimerDisplay();
  }, 1000);
  updateTimerDisplay();
}

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function resetTimer() {
  stopTimer();
  seconds = 0;
  updateTimerDisplay();
}

// ===============================
// Нова гра (модель)
// ===============================
function newGame(rows = ROWS, cols = COLS, mines = MINES) {
  resetTimer();
  game.rows = rows;
  game.cols = cols;
  game.mines = mines;
  game.status = GAME_STATE.PLAYING;
  game.explodedCell = null;
  game.board = generateField(rows, cols, mines);
  computeAllAdj(game.board);
}

// ===============================
// DOM інтеграція
// ===============================

let boardEl = null;
let flagsEl = null;
let timerEl = null;
let resetBtnEl = null;
let difficultyEl = null;
let pauseBtnEl = null;
let hintBtnEl = null;
let helpBtnEl = null;

// Пресети складності
const DIFFICULTY_PRESETS = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

// Запуск після завантаження DOM
document.addEventListener('DOMContentLoaded', () => {
  boardEl = document.querySelector('.game-board-wrapper__content');
  flagsEl = document.getElementById('flagsLeft');
  timerEl = document.getElementById('timer');
  resetBtnEl = document.getElementById('resetBtn');
  difficultyEl = document.getElementById('difficulty');
  pauseBtnEl = document.getElementById('pauseBtn');
  hintBtnEl = document.getElementById('hintBtn');
  helpBtnEl = document.getElementById('helpBtn');

  // Кнопка нової гри
  if (resetBtnEl) {
    resetBtnEl.addEventListener('click', () => {
      startNewGameFromUI();
    });
  }

  // Зміна складності
  if (difficultyEl) {
    difficultyEl.addEventListener('change', () => {
      startNewGameFromUI();
    });
  }

  // Додаткові кнопки поки просто логують (для бажаючих можна доробити)
  if (pauseBtnEl) {
    pauseBtnEl.addEventListener('click', () => {
      alert('Pause/Resume can be implemented as additional');
    });
  }
  if (hintBtnEl) {
    hintBtnEl.addEventListener('click', () => {
      alert('Hint can be implemented as finding a safe cell.');
    });
  }
  if (helpBtnEl) {
    helpBtnEl.addEventListener('click', () => {
      alert('Left click — open a cell, right click — toggle a flag.\nDon\'t click on the cactus 🌵!');
    });
  }

  // Стартова гра
  startNewGameFromUI();
});

// Прив’язати розмір борда до CSS змінних
function applyBoardSize(rows, cols) {
  const root = document.documentElement;
  root.style.setProperty('--rows', rows);
  root.style.setProperty('--cols', cols);
}

// Старт нової гри відповідно до вибраної складності
function startNewGameFromUI() {
  let value = difficultyEl ? difficultyEl.value : 'beginner';
  let cfg = DIFFICULTY_PRESETS[value] || DIFFICULTY_PRESETS.beginner;

  if (value === 'custom') {
    const rows = parseInt(prompt('Number of rows (5–24):', '9'), 10);
    const cols = parseInt(prompt('Number of columns (5–30):', '9'), 10);
    const mines = parseInt(prompt('Number of mines:', '10'), 10);

    if (
      Number.isFinite(rows) && rows >= 5 && rows <= 24 &&
      Number.isFinite(cols) && cols >= 5 && cols <= 30 &&
      Number.isFinite(mines) && mines > 0 && mines < rows * cols
    ) {
      cfg = { rows, cols, mines };
    } else {
      alert('Invalid parameters. Using Beginner level.');
      cfg = DIFFICULTY_PRESETS.beginner;
      if (difficultyEl) difficultyEl.value = 'beginner';
    }
  }

  applyBoardSize(cfg.rows, cfg.cols);
  newGame(cfg.rows, cfg.cols, cfg.mines);
  renderBoard();
  updateHeaderCounters();
  updateResetButtonState();
}

// Перемалювати борд з моделі
function renderBoard() {
  if (!boardEl) return;
  boardEl.innerHTML = '';

  for (let r = 0; r < game.rows; r++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'game-board-wrapper__row';

    for (let c = 0; c < game.cols; c++) {
      const cell = game.board[r][c];
      const cellDiv = document.createElement('div');
      cellDiv.classList.add('game-board__cell');
      cellDiv.dataset.row = String(r);
      cellDiv.dataset.col = String(c);

      const isFlagged = cell.state === CELL_STATE.FLAGGED;
      const isCovered = cell.state === CELL_STATE.COVERED;

      if (game.status === GAME_STATE.LOSE && cell.mine && !isFlagged) {
        // програш: показуємо всі не-помічені міни
        cellDiv.classList.add('open-cell', 'mine-cell');
        if (game.explodedCell &&
            game.explodedCell.row === r &&
            game.explodedCell.col === c) {
          cellDiv.classList.add('exploded');
        }
      } else if (isFlagged) {
        cellDiv.classList.add('closed-cell', 'flagged-cell');
        if (cell.mine) cellDiv.classList.add('mine-cell');
      } else if (isCovered) {
        cellDiv.classList.add('closed-cell');
        if (cell.mine) cellDiv.classList.add('mine-cell');
      } else {
        // UNCOVERED
        cellDiv.classList.add('open-cell');
        if (cell.mine) {
          cellDiv.classList.add('mine-cell');
          if (game.explodedCell &&
              game.explodedCell.row === r &&
              game.explodedCell.col === c &&
              game.status === GAME_STATE.LOSE) {
            cellDiv.classList.add('exploded');
          }
        } else if (cell.adj > 0) {
          cellDiv.textContent = String(cell.adj);
          cellDiv.classList.add(`number-${cell.adj}`);
        }
      }

      // Обробники кліків мишкою
      cellDiv.addEventListener('click', handleCellLeftClick);
      cellDiv.addEventListener('contextmenu', handleCellRightClick);

      rowDiv.appendChild(cellDiv);
    }

    boardEl.appendChild(rowDiv);
  }
}

// ЛКМ – відкрити клітинку
function handleCellLeftClick(e) {
  const target = e.currentTarget;
  const row = Number(target.dataset.row);
  const col = Number(target.dataset.col);
  if (Number.isNaN(row) || Number.isNaN(col)) return;

  openCell(row, col);
  renderBoard();
  updateHeaderCounters();
  updateResetButtonState();
  maybeShowEndAlert();
}

// ПКМ – поставити/зняти прапорець
function handleCellRightClick(e) {
  e.preventDefault();
  const target = e.currentTarget;
  const row = Number(target.dataset.row);
  const col = Number(target.dataset.col);
  if (Number.isNaN(row) || Number.isNaN(col)) return;

  toggleFlag(row, col);
  renderBoard();
  updateHeaderCounters();
}

// Оновлюємо лічильники у шапці
function updateHeaderCounters() {
  if (flagsEl) {
    const used = countFlags(game.board);
    const left = Math.max(game.mines - used, 0);
    flagsEl.textContent = `🚩 ${String(left).padStart(3, '0')}`;
  }
  updateTimerDisplay();
}

// Статус кнопки NEW GAME (виграв / програв / граємо)
function updateResetButtonState() {
  if (!resetBtnEl) return;
  resetBtnEl.classList.remove('state-win', 'state-lose', 'state-idle');

  if (game.status === GAME_STATE.WIN) {
    resetBtnEl.classList.add('state-win');
    resetBtnEl.textContent = 'YOU WIN';
  } else if (game.status === GAME_STATE.LOSE) {
    resetBtnEl.classList.add('state-lose');
    resetBtnEl.textContent = 'BOOM!';
  } else {
    resetBtnEl.classList.add('state-idle');
    resetBtnEl.textContent = 'NEW GAME';
  }
}

// Показати алерт при завершенні гри
function maybeShowEndAlert() {
  if (game.status === GAME_STATE.WIN) {
    setTimeout(() => alert('Congratulations! You won 🏆'), 50);
  } else if (game.status === GAME_STATE.LOSE) {
    setTimeout(() => alert('OUCH! You hit the cactus 🌵'), 50);
  }
}
