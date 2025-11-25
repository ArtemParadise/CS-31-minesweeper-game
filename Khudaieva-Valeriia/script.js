
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

const board = createEmptyBoard(gameState.rows, gameState.cols);

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

function openCell(row, col) {
    const cell = board[row][col];

    if (cell.state !== CellState.CLOSED) return;

    if (cell.hasMine) {
        cell.state = CellState.OPEN;
        gameState.status = GameStatus.LOSE;
        return;
    }

    cell.state = CellState.OPEN;

    if (cell.neighborMines === 0) {
        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (
                    r >= 0 && r < gameState.rows &&
                    c >= 0 && c < gameState.cols
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
    }, 1000);
}

function stopTimer() {
    clearInterval(gameState.timerId);
    gameState.timerId = null;
}

const boardElement = document.querySelector(".board");
const startBtn = document.querySelector(".start-btn");
const timerEl = document.querySelector(".timer");
const flagCounterEl = document.querySelector(".counter");
const statusMessageEl = document.querySelector("#gameStatusMessage");

let flagsLeft = gameState.mineCount;

function hideStatusMessage() {
    statusMessageEl.textContent = "";
    statusMessageEl.classList.remove("win-message", "lose-message");
    statusMessageEl.style.display = "none";
}

statusMessageEl.addEventListener("click", hideStatusMessage);
function resetGame() {
    stopTimer();
    gameState.timer = 0;
    gameState.status = GameStatus.IN_PROGRESS;

    hideStatusMessage();

    timerEl.textContent = "00:00";

    flagsLeft = gameState.mineCount;
    flagCounterEl.textContent = flagsLeft.toString().padStart(3, "0");

    const newBoard = generateField(gameState.rows, gameState.cols, gameState.mineCount);

    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            board[r][c] = newBoard[r][c];
        }
    }

    renderBoard();
}


function renderBoard() {
    boardElement.innerHTML = "";
    boardElement.style.gridTemplateColumns = `repeat(${gameState.cols}, 35px)`;

    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            const cellEl = document.createElement("div");
            cellEl.classList.add("cell");

            const data = board[r][c];

            if (data.state === CellState.OPEN) {
                cellEl.classList.add("open");
                if (data.hasMine) {
                    cellEl.classList.add("mine");
                    cellEl.textContent = "💣";
                } else if (data.neighborMines > 0) {
                    cellEl.textContent = data.neighborMines;
                    cellEl.classList.add(`n${data.neighborMines}`);
                }
            } else if (data.state === CellState.FLAGGED) {
                cellEl.classList.add("flag");
                cellEl.textContent = "🚩";  
            } else {
                cellEl.classList.add("closed");
            }

            cellEl.addEventListener("click", () => handleLeftClick(r, c));
            cellEl.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                handleRightClick(r, c);
            });

            boardElement.appendChild(cellEl);
        }
    }
}

function handleLeftClick(r, c) {
    if (gameState.status !== GameStatus.IN_PROGRESS) return;

    startTimer();

    const cell = board[r][c];

    if (cell.state === CellState.FLAGGED) return;

    openCell(r, c);

    if (cell.hasMine) {
        gameState.status = GameStatus.LOSE;
        revealMines();
        stopTimer();
        setTimeout(() => {
            statusMessageEl.textContent = "💣 You Lost!";
            statusMessageEl.classList.add("lose-message");
            statusMessageEl.style.display = "block"; 
        }, 50);
    }

    checkWin();
    renderBoard();
}

function handleRightClick(r, c) {
    if (gameState.status !== GameStatus.IN_PROGRESS) return;

    const cell = board[r][c];

    if (cell.state === CellState.OPEN) return;

    if (cell.state === CellState.CLOSED && flagsLeft > 0) {
        toggleFlag(r, c);
        flagsLeft--;
    } 
    else if (cell.state === CellState.FLAGGED) {
        toggleFlag(r, c);
        flagsLeft++;
    }

    flagCounterEl.textContent = flagsLeft.toString().padStart(3, "0");

    renderBoard();
}

function revealMines() {
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            if (board[r][c].hasMine) {
                board[r][c].state = CellState.OPEN;
            }
        }
    }
}

function checkWin() {
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            const cell = board[r][c];
            if (!cell.hasMine && cell.state !== CellState.OPEN) return;
        }
    }

    gameState.status = GameStatus.WIN;
    stopTimer();
    setTimeout(() => {
        statusMessageEl.textContent = "🎉 You Won! 🎉";
        statusMessageEl.classList.add("win-message");
        statusMessageEl.style.display = "block";
    }, 50);
}

setInterval(() => {
    const min = String(Math.floor(gameState.timer / 60)).padStart(2, "0");
    const sec = String(gameState.timer % 60).padStart(2, "0");
    timerEl.textContent = `${min}:${sec}`;
}, 200);

startBtn.addEventListener("click", resetGame);

resetGame();