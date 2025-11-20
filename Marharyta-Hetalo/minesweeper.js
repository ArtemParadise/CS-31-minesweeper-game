const ROWS = 10;
const COLS = 10;
const MINES = 10;


const COVERED = 0;   // закрита клітинка
const UNCOVERED = 1; // відкрита клітинка
const FLAGGED = 2;   // позначена прапорцем

const GAME_PLAYING = 0;
const GAME_WIN = 1;
const GAME_LOSE = -1;

let timerId = null;  
let seconds = 0;      


const makeCell = (row, col) => ({
    row,
    col,
    mine: false,
    adj: 0,
    state: COVERED
  });
  

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

const game_board = createBoard(10, 10);

// console.log(game_board);
// console.log(game_board[0][0]);  //перша клітинка
// console.log(game_board[5][5].adj);  //cуміжні для 5,5




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

//test generateField function
// console.log("generateField function");
// const testField = generateField(10, 10, 15);
// console.log(testField);

const inBounds = (r, c, rows, cols) =>
    r >= 0 && r < rows && c >= 0 && c < cols; // перевірка, чи клітинка в межах поля

function countNeighbourMines(field, row, col) {
    const rows = field.length, cols = field[0].length;
    let count = 0;
    for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
      for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
        if (!deltaRow && !deltaCol) continue;
        const rr = row + deltaRow, cc = col + deltaCol;
        if (inBounds(rr, cc, rows, cols) && field[rr][cc].mine) count++;
      }
    }
    return count;
}

//test countNeighbourMines function
// console.log("countNeighbourMines function");
// console.log(countNeighbourMines(testField, 4, 5));
// console.log(countNeighbourMines(testField, 0, 0));
// console.log(countNeighbourMines(testField, 2, 3));


function computeAllAdj(field) {
    for (let row = 0; row < field.length; row++) {
      for (let col = 0; col < field[0].length; col++) {
        field[row][col].adj = countNeighbourMines(field, row, col);
      }
    }
}


const game = {
    rows: ROWS,
    cols: COLS,
    mines: MINES,
    status: GAME_PLAYING,
    board: generateField(ROWS, COLS, MINES),
};  
computeAllAdj(game.board);


function isWin(board) {
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[0].length; c++) {
        const cell = board[r][c];
        if (!cell.mine && cell.state !== UNCOVERED) return false;
      }
    }
    return true;
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

  function openCell(row, col) {
    if (game.status !== GAME_PLAYING) return;      // нічого не відбувається, якщо гра вже не активна 

    const { board } = game;                         // дістаємо поле
    const cell = board[row][col];                   // беремо клітинку за координатами
  
    if (cell.state === UNCOVERED || cell.state === FLAGGED) return;
    //запуск таймера тільки коли точно будемо відкривати
    if (timerId === null) startTimer();

    //якщо тут міна то зупиняємо таймер, і пишемо програш
    if (cell.mine) {
      cell.state = UNCOVERED;
      game.status = GAME_LOSE;
      stopTimer();
      // показати усі міни
      for (let r = 0; r < game.rows; r++) {
        for (let c = 0; c < game.cols; c++) {
          if (board[r][c].mine && board[r][c].state !== UNCOVERED) {
            board[r][c].state = UNCOVERED;
          }
        }
      }
      showMessage('💥 Game Over! You hit a mine!');
      return;
    }
    const stack = [[row, col]];
    while (stack.length) {
      const [r, c] = stack.pop();
      const currentCell = board[r][c];
  
      if (currentCell.state === UNCOVERED || currentCell.state === FLAGGED) continue;
  
      currentCell.state = UNCOVERED;
  
      // якщо число навколо = 0, то додаємо всіх сусідів у стек на відкриття
      if (currentCell.adj === 0) {
        for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
          for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
            if (!deltaRow && !deltaCol) continue;
            const rr = r + deltaRow, cc = c + deltaCol; // координати сусідньої клітинки
            if (inBounds(rr, cc, game.rows, game.cols)) { //перевірка, чи клітинка в межах поля
              const neighbourCell = board[rr][cc]; //беремо клітинку за координатами
              if (neighbourCell.state === COVERED && !neighbourCell.mine) stack.push([rr, cc]); // якщо клітинка закрита і не міна, то додаємо в стек
            }
          }
        }
      }
    }
    if (isWin(game.board)) {
        game.status = GAME_WIN;
        stopTimer();                         
        showMessage('🏆 Congratulations! You won! 🏆');
      }
  }

function toggleFlag(row, col) {
    if (game.status !== GAME_PLAYING) return;                    // якщо гра закінчена, то нічого не робимо
    if (!inBounds(row, col, game.rows, game.cols)) return;       
  
    const cell = game.board[row][col];
  
    if (cell.state === UNCOVERED) return;                        // на відкриту клітинку прапорець не ставиться
  
    const wasFlagged = (cell.state === FLAGGED);
    cell.state = wasFlagged ? COVERED : FLAGGED;               //якщо вже прапор стояв, то прибираємо, і навпаки
  
    //показ зміни у консолі
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

// //test toggleFlag function
// console.log("toggleFlag function");
// const testCell = game.board[0][1];
// console.log('Before flagging - state:', testCell.state === FLAGGED ? 'FLAGGED' : 'COVERED');
// toggleFlag(0,1);
// console.log('After flagging - state:', testCell.state === FLAGGED ? 'FLAGGED' : 'COVERED');
// toggleFlag(0,1);
// console.log('After unflagging - state:', testCell.state === FLAGGED ? 'FLAGGED' : 'COVERED');

// //test openCell function
// console.log("openCell function");
// draw();
// openCell(0,0)
// openCell(1,7)
// draw();


function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
    const timerElement = document.querySelector('.info-item:last-child .value');
    if (timerElement) {
        timerElement.textContent = formatTime(seconds);
    }
}

function startTimer() {
  if (timerId !== null) return;                // нічого не відбувається, якщо таймер вже запущений
  seconds = 0;
  updateTimerDisplay();
  timerId = setInterval(() => {
    seconds++;
    console.log(`Timer: ${seconds}s`);
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId);  //зупиняємо
    timerId = null;   //обнуляємо
  }
}

function resetTimer() {
  stopTimer();
  seconds = 0;
  updateTimerDisplay();
}

function updateMinesDisplay() {
    const minesElement = document.querySelector('.info-item:first-child .value');
    if (minesElement) {
        const remainingMines = game.mines - countFlags();
        minesElement.textContent = remainingMines;
    }
}

function showMessage(text) {
    const messageElement = document.querySelector('.message');
    if (messageElement) {
        messageElement.textContent = text;
    }
}

function newGame() {
    stopTimer();
    seconds = 0;
    updateTimerDisplay();
    
    game.status = GAME_PLAYING;
    game.board = generateField(ROWS, COLS, MINES);
    computeAllAdj(game.board);
    
    showMessage('');
    updateBoard();
    updateMinesDisplay();
}

function updateBoard() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const gameCell = game.board[row][col];
        
        cell.classList.remove('revealed', 'flagged', 'mine', 'clicked');
        cell.classList.remove('num0', 'num1', 'num2', 'num3', 'num4', 'num5', 'num6', 'num7', 'num8');
        cell.textContent = '';
        
        //Змінити стан базуючись на стан клітинки
        if (gameCell.state === FLAGGED) {
            cell.classList.add('flagged');
            cell.textContent = '🚩';
        } else if (gameCell.state === UNCOVERED) {
            cell.classList.add('revealed');
            if (gameCell.mine) {
                cell.classList.add('mine');
                if (game.status === GAME_LOSE) {
                    cell.classList.add('clicked');
                    cell.textContent = '💥';
                } else {
                    cell.textContent = '💣';
                }
            } else {
                if (gameCell.adj > 0) {
                    cell.classList.add(`num${gameCell.adj}`);
                    cell.textContent = gameCell.adj;
                }
            }
        }
    });
    updateMinesDisplay();
}

document.addEventListener('DOMContentLoaded', () => {
    const cells = document.querySelectorAll('.cell');
    const resetBtn = document.querySelector('.reset-btn');

     // Кнопка рестарту
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            newGame();
        });
    }

    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        cell.addEventListener('click', () => {
            openCell(row, col);
            updateBoard();
        });

        cell.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            toggleFlag(row, col);
            updateBoard();
        });
    });
    
    // вивести на дисплей дошку
    updateBoard();
    updateMinesDisplay();
    updateTimerDisplay();
});
