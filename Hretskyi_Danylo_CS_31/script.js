// Розмір поля
const ROWS = 10;
const COLS = 10;

const MINES = 10;

// Стани клітинки
const COVERED = 0;
const UNCOVERED = 1;
const FLAGGED = 2;

//Ігровий стан
const GAME_PLAYING = 0;
const GAME_WIN     = 1;
const GAME_LOSE    = -1;

// Фабрика клітинки
const makeCell = (row, col) => ({
  row,                // рядок
  col,                // колонка
  mine: false,      // чи є міна
  adj: 0,           // кількість мін навколо
  state: COVERED    // поточний стан
});

// Двовимірний масив поля
function createBoard(rows = ROWS, cols = COLS) {
    const board = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push(makeCell(r, c));
      }
      board.push(row);
    }
    return board;
  }

const board = createBoard(10, 10);
console.log(board);
// приклад доступу:
console.log(board[0][0]);      // перша клітинка
console.log(board[2][3].adj);  // adj для (2,3)