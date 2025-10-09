// --- Константи станів клітинки ---
const CELL_STATE = Object.freeze({
    CLOSED: 'closed',
    OPEN: 'open',
    FLAGGED: 'flagged'
});

// --- Створюємо фабрику для клітинки ---
function createCell({ hasMine = false, neighborCount = 0, state = CELL_STATE.CLOSED } = {}) {
    return {
        hasMine: Boolean(hasMine),        // булеве значення — наявність міни
        neighborCount: Number(neighborCount), // кількість сусідніх мін
        state                              // 'closed' | 'open' | 'flagged'
    };
}

// --- Ігровий стан (структура) ---
class GameState {
    constructor(rows = 10, cols = 10, mineCount = 10) {
        this.rows = rows;            // розмірність: кількість рядків
        this.cols = cols;            // розмірність: кількість стовпчиків
        this.mineCount = mineCount;  // кількість мін на полі
        this.status = 'playing';     // поточний стан гри: 'playing' | 'won' | 'lost'

        // внутрішнє подання поля — двовимірний масив об'єктів-клітинок
        this.board = createEmptyBoard(rows, cols);
    }
}

// --- Створити пусте поле зі стандартними клітинками ---
function createEmptyBoard(rows, cols) {
    const board = new Array(rows);
    for (let row = 0; row < rows; row++) {
        board[row] = new Array(cols);
        for (let col = 0; col < cols; col++) {
            board[row][col] = createCell();
        }
    }
    return board;
}

// --- Перевірка валідності позиції ---
function isValidPosition(board, row, col) {
    return row >= 0 && row < board.length && col >= 0 && col < board[0].length;
}

// --- Поставити міни у задані позиції (для тестових даних) ---
// positions — масив пар [row, col]
function placeMinesAtPositions(board, positions = []) {
    for (const [row, col] of positions) {
        if (isValidPosition(board, row, col)) {
            board[row][col].hasMine = true;
        }
    }
}

// --- Обчислити neighborCount для кожної клітинки ---
function computeNeighborCounts(board) {
    const totalRows = board.length;
    const totalCols = board[0].length;

    for (let row = 0; row < totalRows; row++) {
        for (let col = 0; col < totalCols; col++) {
            const cell = board[row][col];

            if (cell.hasMine) {
                cell.neighborCount = null; // або -1, але null читабельніше
                continue;
            }

            let mineCount = 0;
            for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
                for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
                    if (deltaRow === 0 && deltaCol === 0) continue;
                    const neighborRow = row + deltaRow;
                    const neighborCol = col + deltaCol;
                    if (isValidPosition(board, neighborRow, neighborCol) && board[neighborRow][neighborCol].hasMine) {
                        mineCount++;
                    }
                }
            }
            cell.neighborCount = mineCount;
        }
    }
}

// --- Ініціалізація прикладу ігрового поля з тестовими значеннями ---
function initTestGame(rows = 10, cols = 10, mines = []) {
    const game = new GameState(rows, cols, mines.length);
    placeMinesAtPositions(game.board, mines);
    computeNeighborCounts(game.board);
    return game;
}

// --- Утиліти для виводу в консоль (для перевірки) ---
function printBoardToConsole(board) {
    const totalRows = board.length;
    const totalCols = board[0].length;
    let output = '\n';

    for (let row = 0; row < totalRows; row++) {
        let line = '';
        for (let col = 0; col < totalCols; col++) {
            const cell = board[row][col];
            if (cell.hasMine) {
                line += ' M ';
            } else {
                line += ' ' + cell.neighborCount + ' ';
            }
        }
        output += line + '\n';
    }

    console.log(output);
}

// --- Приклад: тестове поле 10x10 з кількома минами ---
const exampleMines = [
    [0, 3], [0, 6], [1, 8], [2, 2], [3, 0], [4, 5], [6, 9], [7, 7], [8, 1], [9, 4]
];

// Ініціалізуємо тестову гру і виведемо в консоль
const testGame = initTestGame(10, 10, exampleMines);
console.log('Test game initialized. Game state:');
console.log({
    rows: testGame.rows,
    cols: testGame.cols,
    mineCount: testGame.mineCount,
    status: testGame.status
});
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
