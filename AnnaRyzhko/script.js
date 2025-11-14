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
        timerId: null, // Для логіки таймера
        secondsElapsed: 0, // Для логіки таймера
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

// 1. Генерація ігрового поля
/**
 * Генерує ігрове поле з випадково розташованими мінами.
 * @param {number} rows К-сть рядків.
 * @param {number} cols К-сть стовпців.
 * @param {number} mines К-сть мін.
 * @returns {object} Об'єкт стану гри (gameState).
 */
function generateField(rows, cols, mines) {
    const gameState = createGameState(rows, cols, mines);
    const totalCells = rows * cols;

    if (mines >= totalCells) {
        console.error("Кількість мін повинна бути меншою за загальну кількість клітинок.");
        return gameState;
    }

    // Розташування мін
    const minePositions = new Set();
    while (minePositions.size < mines) {
        const randomPos = Math.floor(Math.random() * totalCells);
        minePositions.add(randomPos);
    }

    let currentMineIndex = 0;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (minePositions.has(currentMineIndex)) {
                gameState.board[row][col].hasMine = true;
            }
            currentMineIndex++;
        }
    }

    // Підрахунок сусідніх мін для всіх клітинок
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (!gameState.board[row][col].hasMine) {
                gameState.board[row][col].adjacentMines = countNeighbourMines(gameState, row, col);
            }
        }
    }
    return gameState;
}

// 2. Підрахунок кількості мін навколо клітинки
/**
 * Підраховує кількість мін у сусідніх клітинках.
 * @param {object} gameState Поточний стан гри.
 * @param {number} row Рядок клітинки.
 * @param {number} col Стовпець клітинки.
 * @returns {number} К-сть сусідніх мін.
 */
function countNeighbourMines(gameState, row, col) {
    if (!inBounds(gameState, row, col)) return 0;

    let mineCount = 0;
    for (const [neighborRow, neighborCol] of neighbors(gameState, row, col)) {
        if (gameState.board[neighborRow][neighborCol].hasMine) {
            mineCount++;
        }
    }
    return mineCount;
}

// 3. Відкриття клітинки (з рекурсією)
/**
 * Відкриває клітинку та реалізує основну логіку гри.
 * @param {object} gameState Поточний стан гри.
 * @param {number} row Рядок клітинки.
 * @param {number} col Стовпець клітинки.
 */
function openCell(gameState, row, col) {
    if (gameState.status !== GameStatus.InProgress || !inBounds(gameState, row, col)) return;

    const cell = gameState.board[row][col];

    // Якщо клітинка вже відкрита або помічена прапорцем, нічого не робимо
    if (cell.state === CellState.Open || cell.state === CellState.Flagged) return;

    // Міна -> Програш
    if (cell.hasMine) {
        cell.state = CellState.Open; // Відкриваємо міну, яка вибухнула
        gameState.status = GameStatus.Lose;
        stopTimer(gameState);
        console.log(`💥 Програш! Ви відкрили міну на [${row}, ${col}].`);
        return;
    }

    // Без міни -> Відкриття
    cell.state = CellState.Open;

    // Перевірка на перемогу
    if (checkWin(gameState)) {
        gameState.status = GameStatus.Win;
        stopTimer(gameState);
        console.log("🎉 Перемога! Ви розмінували поле.");
        return;
    }

    // Рекурсивне відкриття для 0
    if (cell.adjacentMines === 0) {
        for (const [nRow, nCol] of neighbors(gameState, row, col)) {
            // Рекурсивний виклик тільки для закритих клітинок без прапорця
            const neighborCell = gameState.board[nRow][nCol];
            if (neighborCell.state === CellState.Closed) {
                openCell(gameState, nRow, nCol);
            }
        }
    }
}

// Перевірка на перемогу: всі клітинки без мін відкриті
function checkWin(gameState) {
    const totalCells = gameState.rows * gameState.cols;
    const openedCells = gameState.board.flat().filter(cell => cell.state === CellState.Open).length;

    return openedCells === (totalCells - gameState.mineCount);
}

// 4. Встановлення/зняття прапорця
/**
 * Перемикає стан прапорця для клітинки.
 * @param {object} gameState Поточний стан гри.
 * @param {number} row Рядок клітинки.
 * @param {number} col Стовпець клітинки.
 */
function toggleFlag(gameState, row, col) {
    if (gameState.status !== GameStatus.InProgress || !inBounds(gameState, row, col)) return;

    const cell = gameState.board[row][col];

    if (cell.state === CellState.Open) return; // Не можна ставити прапорець на відкриту

    if (cell.state === CellState.Closed) {
        cell.state = CellState.Flagged;
        console.log(`🚩 Прапорець встановлено на [${row}, ${col}]`);
    } else if (cell.state === CellState.Flagged) {
        cell.state = CellState.Closed;
        console.log(`❌ Прапорець знято з [${row}, ${col}]`);
    }
}

// 5. Логіка таймера
/**
 * Запускає ігровий таймер.
 * @param {object} gameState Поточний стан гри.
 */
function startTimer(gameState) {
    if (gameState.timerId) return; // Таймер вже запущено

    gameState.secondsElapsed = 0;
    console.log("⏱️ Таймер запущено!");

    gameState.timerId = setInterval(() => {
        gameState.secondsElapsed++;
        // Для консолі:
        console.log(`Секунд минуло: ${gameState.secondsElapsed}`);
    }, 1000);
}

/**
 * Зупиняє ігровий таймер.
 * @param {object} gameState Поточний стан гри.
 */
function stopTimer(gameState) {
    if (gameState.timerId) {
        clearInterval(gameState.timerId);
        gameState.timerId = null;
        console.log(`🛑 Таймер зупинено на: ${gameState.secondsElapsed} секунді.`);
    }
}

// Допоміжні функції для консольного відображення
function boardToPrintable(gameState) {
    return gameState.board.map(row =>
        row.map(cell => {
            if (cell.state === CellState.Open) {
                if (cell.hasMine) return '💥';
                return cell.adjacentMines === 0 ? ' ' : String(cell.adjacentMines);
            }
            if (cell.state === CellState.Flagged) return '🚩';
            return '?';
        })
    );
}

// Тестування
const ROWS = 10;
const COLS = 11;
const MINES = 15;

let game = generateField(ROWS, COLS, MINES);
console.log('--- СТАРТ ГРИ ---');
console.log('Стан гри:', game.status);
console.table(boardToPrintable(game));


// Очікуваний результат 1 & 2: Генерація та підрахунок
console.log('\n--- Тест 1 & 2: Початковий стан ---');
console.log('Клітинка [0, 0] містить міну?', game.board[0][0].hasMine);
console.log('Кількість сусідніх мін для [0, 0] (якщо не міна):', countNeighbourMines(game, 0, 0));
console.log('Кількість сусідніх мін для [1, 5] (якщо не міна):', countNeighbourMines(game, 1, 5));
console.table(boardToPrintable(game)); // Початковий стан

// Очікуваний результат 5: Логіка таймера
console.log('\n--- Тест 5: Таймер ---');
startTimer(game);
// (В консолі відображатимуться секунди щосекунди)

// Очікуваний результат 4: Встановлення/зняття прапорця
console.log('\n--- Тест 4: Прапорці ---');
toggleFlag(game, 5, 5);
toggleFlag(game, 5, 5);
toggleFlag(game, 9, 10);
console.table(boardToPrintable(game));
console.log('Стан [9, 10]:', game.board[9][10].state);

// Очікуваний результат 3: Відкриття клітинки
console.log('\n--- Тест 3: Відкриття ---');
// Припустимо, [0, 0] це безпечна клітинка з 0 сусідніми мінами
openCell(game, 0, 0);
console.log('Стан гри після відкриття [0, 0]:', game.status);
console.table(boardToPrintable(game));

// Припустимо, [0, 5] це безпечна клітинка з >0 сусідніми мінами
openCell(game, 0, 5);
console.log('Стан гри після відкриття [0, 5]:', game.status);
console.table(boardToPrintable(game));

// Спроба відкрити клітинку з міною (для тесту програшу)
// Знаходження міни:
// let mineRow, mineCol;
// for (let r = 0; r < ROWS; r++) {
//     for (let c = 0; c < COLS; c++) {
//         if (game.board[r][c].hasMine) {
//             mineRow = r;
//             mineCol = c;
//             break;
//         }
//     }
//     if (mineRow !== undefined) break;
// }

// if (mineRow !== undefined) {
//     console.log(`\n Тест 3: Програш `);
//     openCell(game, mineRow, mineCol);
//     console.log('Фінальний стан гри:', game.status);
//     console.table(boardToPrintable(game));
//     // (Таймер зупиниться при програші)
// } else {
//     // Зупиняємо таймер вручну, якщо не програли
//     stopTimer(game);
// }

// Експорт для можливості використання в іншому модулі (якщо потрібне підключення до DOM)
export { generateField, openCell, toggleFlag, startTimer, stopTimer, GameStatus, CellState };