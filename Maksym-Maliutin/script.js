// script.js

// --- Константи станів клітинки ---
const CELL_STATE = Object.freeze({
    CLOSED: 'closed',
    OPEN: 'open',
    FLAGGED: 'flagged'
  });
  
  // --- Створюємо фабрику для клітинки ---
  function createCell({ hasMine = false, neighborCount = 0, state = CELL_STATE.CLOSED } = {}) {
    return {
      hasMine: Boolean(hasMine),       // булеве значення — наявність міни
      neighborCount: Number(neighborCount), // кількість сусідніх мін
      state                                  // 'closed' | 'open' | 'flagged'
    };
  }
  
  // --- Ігровий стан (структура) ---
  class GameState {
    constructor(rows = 10, cols = 10, mineCount = 10) {
      this.rows = rows;           // розмірність: кількість рядків
      this.cols = cols;           // розмірність: кількість стовпчиків
      this.mineCount = mineCount; // кількість мін на полі
      this.status = 'playing';    // поточний стан гри: 'playing' | 'won' | 'lost'
  
      // внутрішнє подання поля — двовимірний масив об'єктів-клітинок
      this.board = createEmptyBoard(rows, cols);
    }
  }
  
  // --- Створити пусте поле зі стандартними клітинками ---
  function createEmptyBoard(rows, cols) {
    const board = new Array(rows);
    for (let r = 0; r < rows; r++) {
      board[r] = new Array(cols);
      for (let c = 0; c < cols; c++) {
        board[r][c] = createCell();
      }
    }
    return board;
  }
  
  // --- Поставити міни у задані позиції (для тестових даних) ---
  // positions — масив пар [r, c]
  function placeMinesAtPositions(board, positions = []) {
    for (const [r, c] of positions) {
      if (isValidPos(board, r, c)) board[r][c].hasMine = true;
    }
  }
  
  function isValidPos(board, r, c) {
    return r >= 0 && r < board.length && c >= 0 && c < board[0].length;
  }
  
  // --- Обчислити neighborCount для кожної клітинки ---
  function computeNeighborCounts(board) {
    const rows = board.length;
    const cols = board[0].length;
  
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (board[r][c].hasMine) {
          board[r][c].neighborCount = null; // або -1 — але використаємо null для міни
          continue;
        }
  
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (isValidPos(board, nr, nc) && board[nr][nc].hasMine) count++;
          }
        }
        board[r][c].neighborCount = count;
      }
    }
  }
  
  // --- Ініціалізація прикладу ігрового поля з тестовими значеннями ---
  // Повертає об'єкт GameState, де board заповнено тестовими даними
  function initTestGame(rows = 10, cols = 10, mines = []) {
    // mines — масив позицій [r, c] для тесту
    const game = new GameState(rows, cols, mines.length);
    placeMinesAtPositions(game.board, mines);
    computeNeighborCounts(game.board);
    // За замовчуванням всі клітинки закриті (state = 'closed') — відповідає умовам
    return game;
  }
  
  // --- Утиліти для виводу в консоль (для перевірки) ---
  function printBoardToConsole(board) {
    const rows = board.length;
    const cols = board[0].length;
    let out = '\n';
    for (let r = 0; r < rows; r++) {
      let line = '';
      for (let c = 0; c < cols; c++) {
        const cell = board[r][c];
        if (cell.hasMine) line += ' M ';
        else line += ' ' + cell.neighborCount + ' ';
      }
      out += line + '\n';
    }
    console.log(out);
  }
  
  // --- Приклад: тестове поле 10x10 з кількома минами ---
  const exampleMines = [
    [0, 3], [0, 6], [1, 8], [2, 2], [3, 0], [4, 5], [6, 9], [7, 7], [8, 1], [9, 4]
  ];
  
  // Ініціалізуємо тестову гру і виведемо в консоль
  const testGame = initTestGame(10, 10, exampleMines);
  console.log('Test game initialized. Game state:');
  console.log({ rows: testGame.rows, cols: testGame.cols, mineCount: testGame.mineCount, status: testGame.status });
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
  