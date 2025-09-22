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
  for (let r = 0; r < rows; r++) {
    board[r] = new Array(cols);
    for (let c = 0; c < cols; c++) {
      board[r][c] = createCell(false);
    }
  }
  return board;
}

// Розміщення мін
function placeMines(board, positions) {
  for (const pos of positions) {
    const { r, c } = pos;
    if (board[r] && board[r][c]) board[r][c].hasMine = true;
  }
}

// Підрахунок кількості сусідніх мін
function computeAdjacentCounts(board) {
  const rows = board.length;
  const cols = board[0].length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].hasMine) {
        board[r][c].adjacentMines = -1; 
        continue;
      }
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
      board[r][c].adjacentMines = count;
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