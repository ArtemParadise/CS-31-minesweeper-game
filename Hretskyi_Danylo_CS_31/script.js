// Розмір поля
const ROWS = 9;
const COLS = 9;

const MINES = 10;

// Стани клітинки
const COVERED = 0; // закрита клітинка
const UNCOVERED = 1; // відкрита клітинка
const FLAGGED = 2; // прапор

//Ігровий стан
const GAME_PLAYING = 0; // гра в процесі
const GAME_WIN     = 1; // гра виграна
const GAME_LOSE    = -1; // гра програна
let timerId = null;   // setInterval handler
let seconds = 0;      // скільки секунд іде гра

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

//-------------------lab 3----------------------

const inBounds = (r, c, rows, cols) =>
    r >= 0 && r < rows && c >= 0 && c < cols; // перевірка, чи клітинка в межах поля
  
function generateField(rows = ROWS, cols = COLS, mines = MINES) {
    const field = createBoard(rows, cols);
    const total = rows * cols;
    const toPlace = Math.min(mines, total); //ще одна перевірка, чи кількість мін не перевищує кількість клітинок
  
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
//test-test-test--------------------------------
testField = generateField(10, 10, 20);
console.log(testField);
//test-test-test--------------------------------

function countNeighbourMines(field, row, col) { //НЕ ЗАПИСУЄ adj
    const rows = field.length, cols = field[0].length;
    let count = 0;
    for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
      for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
        if (!deltaRow && !deltaCol) continue; // якщо deltaRow і deltaCol дорівнюють 0, то пропускаємо
        const rr = row + deltaRow, cc = col + deltaCol;
        if (inBounds(rr, cc, rows, cols) && field[rr][cc].mine) count++; // перевірка, чи клітинка в межах поля і чи є міна
      }
    }
    return count;
  }

//test-test-test--------------------------------
console.log(countNeighbourMines(testField, 0, 0));
//test-test-test--------------------------------

function computeAllAdj(field) { //ЗАПИСУЄ adj
    for (let row = 0; row < field.length; row++) {
      for (let col = 0; col < field[0].length; col++) {
        field[row][col].adj = countNeighbourMines(field, row, col);
      }
    }
  }

//test-test-test--------------------------------
computeAllAdj(testField);
console.log(testField);

const testField2 = generateField(10, 10, 20);
console.log('field with mines:', testField2.map(r => r.map(c => c.mine ? '💣' : '.')));

computeAllAdj(testField2);
console.log('adj filled:');
console.table(testField2.map(row => row.map(c => c.adj)));

console.log('cell(0,0):', testField2[0][0]);
//test-test-test--------------------------------

//test-test-test--------------------------------
const game = {
    rows: ROWS,
    cols: COLS,
    mines: MINES,
    status: GAME_PLAYING,
    board: generateField(ROWS, COLS, MINES),
};  

computeAllAdj(game.board);

//test-test-test--------------------------------

function isWin(board) {
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      const cell = board[r][c];
      if (!cell.mine && cell.state !== UNCOVERED) return false;
    }
  }
  return true;
}

function openCell(row, col) {
    if (game.status !== GAME_PLAYING) return;      // 1) якщо гра вже не активна — нічого не робимо

    const { board } = game;                         // 2) дістаємо поле
    const cell = board[row][col];                   // 3) беремо клітинку за координатами
  
    // 4) якщо клітинка вже відкрита або тут прапор — ігноруємо
    if (cell.state === UNCOVERED || cell.state === FLAGGED) return;

    // запуск таймера тільки коли точно будемо відкривати
    if (timerId === null) startTimer();

    // 5) якщо тут міна — відкриваємо її, ставимо програш і зупиняємо таймер
    if (cell.mine) {
      cell.state = UNCOVERED;
      game.status = GAME_LOSE;
      stopTimer();
      console.log('Boom! Loser.');
      return;
    }
  
    // 6) "Flood fill (DFS через стек): відкриваємо область порожніх клітинок (adj===0),
    //    і їхніх сусідів, поки стек не спорожніє
    const stack = [[row, col]];
    while (stack.length) {
      const [r, c] = stack.pop();
      const currentCell = board[r][c];
  
      // могли вже відкрити раніше або стоїть прапорець — пропускаємо
      if (currentCell.state === UNCOVERED || currentCell.state === FLAGGED) continue;
  
      currentCell.state = UNCOVERED;
  
      // якщо число навколо = 0 — додаємо всіх сусідів у стек на відкриття
      if (currentCell.adj === 0) {
        for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
          for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
            if (!deltaRow && !deltaCol) continue;
            const rr = r + deltaRow, cc = c + deltaCol; // координати сусідньої клітинки (ВІД ПОТОЧНОЇ r,c)
            if (inBounds(rr, cc, game.rows, game.cols)) { // перевірка, чи клітинка в межах поля
              const neighbourCell = board[rr][cc]; // беремо клітинку за координатами
              if (neighbourCell.state === COVERED && !neighbourCell.mine) stack.push([rr, cc]); // якщо клітинка закрита і не міна, то додаємо в стек
            }
          }
        }
      }
    }
    if (isWin(game.board)) {
        game.status = GAME_WIN;
        stopTimer();                          // ← зупинка на перемозі
        console.log('🏆 Win!');
      }
  }
  
  function draw() {
    console.table(
      game.board.map(row => row.map(c =>
        c.state === FLAGGED ? '🚩' :
        c.state === COVERED ? '■' :
        (c.mine ? '💣' : c.adj)
      ))
    );
    console.log('status:', game.status);
  }

//test-test-test--------------------------------
draw();
openCell(0,0)
draw();
//test-test-test--------------------------------

function toggleFlag(row, col) {
    if (game.status !== GAME_PLAYING) return;                    // гра має бути активна
    if (!inBounds(row, col, game.rows, game.cols)) return;       // перевірка меж
  
    const cell = game.board[row][col];
  
    if (cell.state === UNCOVERED) return;                        // відкриті не флагуємо
  
    const wasFlagged = (cell.state === FLAGGED);
    cell.state = wasFlagged ? COVERED : FLAGGED;
  
    // лог для перевірки
    const isFlagged = (cell.state === FLAGGED);
    console.log(`toggleFlag(${row}, ${col}) -> isFlagged: ${isFlagged}`);
  }

  function countFlags(board = game.board) {
    let n = 0;
    for (let r = 0; r < board.length; r++)
      for (let c = 0; c < board[0].length; c++)
        if (board[r][c].state === FLAGGED) n++;
    return n;
  }
  
//test-test-test--------------------------------
  toggleFlag(0,1);
  console.log('flags:', countFlags());
  draw();
  toggleFlag(0,1);
  console.log('flags:', countFlags());
  draw();
//test-test-test--------------------------------

function startTimer() {
  if (timerId !== null) return;                // вже тікає — не запускаємо вдруге
  seconds = 0;
  console.log('Timer: 0s');
  timerId = setInterval(() => {
    seconds++;
    console.log(`Timer: ${seconds}s`);
  }, 1000);
}

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
    console.log(`Timer stopped at ${seconds}s`);
  }
}

function resetTimer() {
  stopTimer();
  seconds = 0;
  console.log('Timer reset to 0s');
}

function newGame(rows = ROWS, cols = COLS, mines = MINES) {
    stopTimer();                // гарантовано зупинити попередній
    seconds = 0;                // обнулити лічильник
    game.rows = rows;
    game.cols = cols;
    game.mines = mines;
    game.status = GAME_PLAYING;
    game.board = generateField(rows, cols, mines);
    computeAllAdj(game.board);
    console.log('New game. Timer reset to 0s');
  }
  
//test-test-test--------------------------------
  draw();
  openCell(4,3)
  openCell(3,2)
  draw();
  //test-test-test--------------------------------