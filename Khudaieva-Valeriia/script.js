const CellState = {
    CLOSED: "closed",
    OPEN: "open",
    FLAGGED: "flagged"
};

const GameStatus = {
    IN_PROGRESS: "in_progress",
    WIN: "win",
    LOSE: "lose"
};

function createCell(hasMine = false, neighborMines = 0, state = CellState.CLOSED) {
    return {
        hasMine,
        neighborMines,
        state
    };
}

function createEmptyBoard(rows, cols) {
    const board = [];
    for (let row = 0; row < rows; row++) {
        const currentRow = [];
        for (let col = 0; col < cols; col++) {
            currentRow.push({
                hasMine: false,
                neighborMines: 0,
                state: CellState.CLOSED
            });
        }
        board.push(currentRow);
    }
    return board;
}

const gameState = {
    rows: 10,
    cols: 10,
    mineCount: 15,
    status: "in_progress"
};

const board = createEmptyBoard(gameState.rows, gameState.cols);
console.table(board);
console.log(board);