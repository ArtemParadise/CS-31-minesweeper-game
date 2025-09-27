// --- Константи станів клітинки ---
const CELL_STATE = Object.freeze({
    CLOSED: 'closed',
    OPEN: 'open',
    FLAGGED: 'flagged'
});

// --- Створюємо фабрику для клітинки ---
function createCell({ hasMine = false, neighborCount = 0, state = CELL_STATE.CLOSED } = {}) {
    return {
        hasMine: Boolean(hasMine),
        neighborCount: Number(neighborCount),
        state
    };
}

// --- Ігровий стан (структура) ---
class GameState {
    constructor(rows = 10, cols = 10, mineCount = 10) {
        this.rows = rows;
        this.cols = cols;
        this.mineCount = mineCount;
        this.status = 'playing';
        this.board = createEmptyBoard(rows, cols);
    }
}

// --- Створити пусте поле ---
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

// --- Перевірка валідності позиції ---
function isValidPos(board, r, c) {
    return r >= 0 && r < board.length && c >= 0 && c < board[0].length;
}

// --- Поставити міни у задані позиції ---
function placeMinesAtPositions(board, positions = []) {
    for (const [r, c] of positions) {
        if (isValidPos(board, r, c)) board[r][c].hasMine = true;
    }
}

// --- Обчислити neighborCount ---
function computeNeighborCounts(board) {
    const rows = board.length;
    const cols = board[0].length;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c].hasMine) {
                board[r][c].neighborCount = null;
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

// --- Ініціалізація тестового поля ---
function initTestGame(rows = 10, cols = 10, mines = []) {
    const game = new GameState(rows, cols, mines.length);
    placeMinesAtPositions(game.board, mines);
    computeNeighborCounts(game.board);
    return game;
}

// --- Вивід поля в консоль ---
function printBoardToConsole(board) {
    const rows = board.length;
    const cols = board[0].length;
    let out = '\n';
    for (let r = 0; r < rows; r++) {
        let line = '';
        for (let c = 0; c < cols; c++) {
            const cell = board[r][c];
            if (cell.hasMine) line += '💣';
            else line += ' ' + cell.neighborCount + ' ';
        }
        out += line + '\n';
    }
    console.log(out);
}

// --- Приклад тестового поля ---
const exampleMines = [
    [0, 3], [0, 6], [1, 8], [2, 2], [3, 0], [4, 5], [6, 9], [7, 7], [8, 1], [9, 4]
];
const testGame = initTestGame(10, 10, exampleMines);
console.log('Test game initialized. Game state:');
console.log({ rows: testGame.rows, cols: testGame.cols, mineCount: testGame.mineCount, status: testGame.status });
printBoardToConsole(testGame.board);

// --- Нові функції для логіки гри ---
// Генерація випадкового поля
function generateField(rows = 10, cols = 10, mineCount = 10) {
    const game = new GameState(rows, cols, mineCount);
    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);
        if (!game.board[r][c].hasMine) {
            game.board[r][c].hasMine = true;
            minesPlaced++;
        }
    }
    computeNeighborCounts(game.board);
    return game.board;
}

// Підрахунок мін навколо клітинки
function countNeighbourMines(board, row, col) {
    if (!isValidPos(board, row, col)) return 0;
    return board[row][col].neighborCount;
}

// Відкриття клітинки
function openCell(game, row, col) {
    if (!isValidPos(game.board, row, col)) return;
    const cell = game.board[row][col];
    if (cell.state !== CELL_STATE.CLOSED) return;
    if (cell.hasMine) {
        cell.state = CELL_STATE.OPEN;
        game.status = 'lost';
        return;
    }
    function reveal(r, c) {
        if (!isValidPos(game.board, r, c)) return;
        const ccell = game.board[r][c];
        if (ccell.state === CELL_STATE.OPEN || ccell.state === CELL_STATE.FLAGGED) return;
        ccell.state = CELL_STATE.OPEN;
        if (ccell.neighborCount === 0) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    reveal(r + dr, c + dc);
                }
            }
        }
    }
    reveal(row, col);
}

// Встановлення / зняття прапорця
function toggleFlag(game, row, col) {
    if (!isValidPos(game.board, row, col)) return;
    const cell = game.board[row][col];
    if (cell.state === CELL_STATE.CLOSED) cell.state = CELL_STATE.FLAGGED;
    else if (cell.state === CELL_STATE.FLAGGED) cell.state = CELL_STATE.CLOSED;
}

// Таймер
let timerId = null;
let timeElapsed = 0;

function startTimer() {
    if (timerId) return;
    timerId = setInterval(() => {
        timeElapsed++;
        console.log('Time:', timeElapsed);
    }, 1000);
}

function stopTimer() {
    clearInterval(timerId);
    timerId = null;
}

// --- Прив'язка до window для зручності тестування ---
window.minesweeperGame = {
    CELL_STATE,
    createCell,
    createEmptyBoard,
    placeMinesAtPositions,
    computeNeighborCounts,
    initTestGame,
    printBoardToConsole,
    testGame,
    generateField,
    countNeighbourMines,
    openCell,
    toggleFlag,
    startTimer,
    stopTimer,
    timeElapsed
};
