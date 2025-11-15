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
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            row.push({
                hasMine: false,
                neighborMines: 0,
                state: "closed"
            });
        }
        board.push(row);
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