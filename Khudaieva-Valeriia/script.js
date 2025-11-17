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
            row.push(createCell());
        }
        board.push(row);
    }
    return board;
}

const gameState = {
    rows: 10,
    cols: 10,
    mineCount: 15,
    status: GameStatus.IN_PROGRESS,
    timer: 0,
    timerId: null
};

function generateField(rows, cols, mines) {
    const field = createEmptyBoard(rows, cols);

    let placed = 0;
    while (placed < mines) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);

        if (!field[r][c].hasMine) {
            field[r][c].hasMine = true;
            placed++;
        }
    }

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            field[r][c].neighborMines = countNeighbourMines(field, r, c);
        }
    }

    return field;
}

function countNeighbourMines(field, row, col) {
    let count = 0;

    for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
            if (
                r >= 0 &&
                r < gameState.rows &&
                c >= 0 &&
                c < gameState.cols &&
                !(r === row && c === col)
            ) {
                if (field[r][c].hasMine) count++;
            }
        }
    }

    return count;
}

const board = generateField(gameState.rows, gameState.cols, gameState.mineCount);

function openCell(row, col) {
    const cell = board[row][col];

    if (cell.state !== CellState.CLOSED) return;

    if (cell.hasMine) {
        cell.state = CellState.OPEN;
        gameState.status = GameStatus.LOSE;
        console.log("Mine! You lost");
        return;
    }

    const mines = countNeighbourMines(board, row, col);
    cell.neighborMines = mines;
    cell.state = CellState.OPEN;
    if (mines === 0) {
        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (
                    r >= 0 &&
                    r < gameState.rows &&
                    c >= 0 &&
                    c < gameState.cols
                ) {
                    openCell(r, c);
                }
            }
        }
    }
}

function toggleFlag(row, col) {
    const cell = board[row][col];

    if (cell.state === CellState.OPEN) return;

    if (cell.state === CellState.CLOSED) {
        cell.state = CellState.FLAGGED;
    } else if (cell.state === CellState.FLAGGED) {
        cell.state = CellState.CLOSED;
    }
}

function startTimer() {
    if (gameState.timerId !== null) return;

    gameState.timerId = setInterval(() => {
        gameState.timer++;
        console.log(`⏱️ ${gameState.timer} sec`);
    }, 1000);
}

function stopTimer() {
    clearInterval(gameState.timerId);
    gameState.timerId = null;
    console.log(" Timer stopped");
}