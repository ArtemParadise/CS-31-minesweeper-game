// Структура клітинки
function createCell(hasMine = false, adjacentMines = 0, state = "closed") {
    return {
        hasMine: hasMine,
        adjacentMines: adjacentMines,
        state: state
    };
}

// Структура поля
function createField(rows, cols) {
    const field = [];

    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            row.push(createCell());
        }
        field.push(row);
    }

    return field;
}

// Структура гри
function createGameState(rows, cols, mines) {
    return {
        rows: rows,
        cols: cols,
        mines: mines,
        status: "in_progress",
        field: createField(rows, cols)
    };
}

// Генерація випадкового поля
function generateField(rows, cols, mines) {
    const field = createField(rows, cols);

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
            field[r][c].adjacentMines = countNeighbourMines(field, r, c);
        }
    }

    console.log("Згенероване поле:", field);
    return field;
}

// Підрахунок кількості мін навколо клітинки
function countNeighbourMines(field, row, col) {
    const dirs = [-1, 0, 1];
    let count = 0;

    dirs.forEach(dr => {
        dirs.forEach(dc => {
            if (dr === 0 && dc === 0) return;

            const r = row + dr;
            const c = col + dc;

            if (field[r] && field[r][c] && field[r][c].hasMine) {
                count++;
            }
        });
    });

    return count;
}

// Відкриття клітинки
function openCell(game, row, col) {
    const cell = game.field[row][col];

    if (cell.state === "open" || cell.state === "flag") return;

    if (cell.hasMine) {
        cell.state = "open";
        game.status = "lost";
        console.log("Міна! Гру закінчено.");
        console.log(game);
        return;
    }

    cell.state = "open";

    if (cell.adjacentMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;

                const r = row + dr;
                const c = col + dc;

                if (game.field[r] && game.field[r][c] && game.field[r][c].state === "closed") {
                    openCell(game, r, c);
                }
            }
        }
    }

    console.log("Стан гри:", game);
}

// Встановлення / зняття прапорця
function toggleFlag(game, row, col) {
    const cell = game.field[row][col];

    if (cell.state === "open") return;

    cell.state = cell.state === "flag" ? "closed" : "flag";

    console.log(`Прапорець змінено (${row}, ${col})`, cell);
}

// Таймер
let timerInterval = null;
let timerValue = 0;

function startTimer() {
    if (timerInterval) return;

    timerValue = 0;
    timerInterval = setInterval(() => {
        timerValue++;
        console.log("Секунди:", timerValue);
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    console.log("Таймер зупинено.");
}

console.log("Поточний стан гри:", "Готово до використання");
