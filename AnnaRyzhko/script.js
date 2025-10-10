// Стани клітинки та гри
const CellState = Object.freeze({ Closed: 'closed', Open: 'open', Flagged: 'flagged' });
const GameStatus = Object.freeze({ InProgress: 'in_progress', Win: 'win', Lose: 'lose' });

// Фабрика клітинки
function createCell() {
    return { hasMine: false, adjacentMines: 0, state: CellState.Closed };
}

// Двовимірний масив
function createMatrix(rows, cols, factory) {
    const matrix = new Array(rows);
    for (let row = 0; row < rows; row++) {
        matrix[row] = new Array(cols);
        for (let col = 0; col < cols; col++) matrix[row][col] = factory();
    }
    return matrix;
}

// Структура стану гри
function createGameState(rows, cols, mineCount) {
    return {
        rows,
        cols,
        mineCount,
        status: GameStatus.InProgress,
        board: createMatrix(rows, cols, createCell),
    };
}

// Допоміжне для підрахунку сусідів
function inBounds(gameState, row, col) {
    return row >= 0 && row < gameState.rows && col >= 0 && col < gameState.cols;
}

function neighbors(gameState, row, col) {
    const result = [];
    for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
        for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
            if (deltaRow === 0 && deltaCol === 0) continue;
            const neighborRow = row + deltaRow;
            const neighborCol = col + deltaCol;
            if (inBounds(gameState, neighborRow, neighborCol)) {
                result.push([neighborRow, neighborCol]);
            }
        }
    }
    return result;
}

// Приклад ініціалізації тестового поля 10x11 з фіксованими “мінами”
function createTestState() {
    const gameState = createGameState(10, 11, 15);
    // фіксовані прикладні міни (координати в межах 10x11)
    const mines = [[0, 2], [1, 7], [2, 5], [3, 3], [4, 9], [5, 1], [6, 6], [7, 4], [8, 8], [9, 0],
    [0, 10], [2, 0], [4, 4], [6, 10], [9, 7]];
    for (const [rowIndex, colIndex] of mines) {
        gameState.board[rowIndex][colIndex].hasMine = true;
    }


    // підрахунок adjacentMines
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            if (gameState.board[row][col].hasMine) continue;

            let mineCount = 0;
            for (const [neighborRow, neighborCol] of neighbors(gameState, row, col)) {
                if (gameState.board[neighborRow][neighborCol].hasMine) mineCount++;
            }
            gameState.board[row][col].adjacentMines = mineCount;
        }
    }
    return gameState;
}

// Для перевірки в консолі:
const game = createTestState();
console.log('Test game ready:', game);

function boardToPrintable(gameState) {
    return gameState.board.map(row =>
        row.map(cell => (cell.hasMine ? '💣' : String(cell.adjacentMines)))
    );
}
console.table(boardToPrintable(game));
