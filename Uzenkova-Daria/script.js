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
  for (let row = 0; row < rows; row++) {
    board[row] = new Array(cols);
    for (let col = 0; col < cols; col++) {
      board[row][col] = createCell(false);
    }
  }
  return board;
}

// Розміщення мін
function placeMines(board, positions) {
  for (const position of positions) {
    const { r: row, c: col } = position;
    if (board[row] && board[row][col]) {
      board[row][col].hasMine = true;
    }
  }
}

// Підрахунок кількості сусідніх мін
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
      for (let dRow = -1; dRow <= 1; dRow++) {
        for (let dCol = -1; dCol <= 1; dCol++) {
          if (dRow === 0 && dCol === 0) continue;
          const newRow = row + dRow;
          const newCol = col + dCol;
          if (newRow >= 0 && newRow < totalRows && newCol >= 0 && newCol < totalCols) {
            if (board[newRow][newCol].hasMine) mineCount++;
          }
        }
      }
      board[row][col].adjacentMines = mineCount;
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
