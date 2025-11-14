// Стани клітинки та гри
const CellState = Object.freeze({ Closed: 'closed', Open: 'open', Flagged: 'flagged' });
const GameStatus = Object.freeze({ InProgress: 'in_progress', Win: 'win', Lose: 'lose' });

// --- КОНФІГУРАЦІЯ ГРИ ---
const ROWS = 10;
const COLS = 11;
const MINES = 15;
// -----------------------

// Елементи DOM:
let boardElement;
let startButton;
let timerElement;
let flagsCountElement;
// Елементи повідомлення
let messageOverlay;
let messageTitle;
let messageText;
let restartMessageButton;
let closeMessageButton;

// Поточний стан гри
let game = null;

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
        flagsRemaining: mineCount, // К-сть доступних прапорців
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
        revealAllMines(gameState, row, col); // Показати всі міни
        updateBoardUI(gameState);
        startButton.textContent = "Restart";
        startButton.classList.add('restart');

        // ВИКЛИК ПОВІДОМЛЕННЯ ПРО ПОРАЗКУ
        showResult(GameStatus.Lose, formatTime(gameState.secondsElapsed));

        console.log(`💥 Програш! Ви відкрили міну на [${row}, ${col}].`);
        return;
    }

    // Без міни -> Відкриття
    cell.state = CellState.Open;

    // Перевірка на перемогу
    if (checkWin(gameState)) {
        gameState.status = GameStatus.Win;
        stopTimer(gameState);
        updateBoardUI(gameState);
        startButton.textContent = "Start";
        startButton.classList.remove('restart');

        // ВИКЛИК ПОВІДОМЛЕННЯ ПРО ПЕРЕМОГУ
        showResult(GameStatus.Win, formatTime(gameState.secondsElapsed));

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

    updateBoardUI(gameState); // Оновити UI після відкриття
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

    if (cell.state === CellState.Closed && gameState.flagsRemaining > 0) {
        cell.state = CellState.Flagged;
        gameState.flagsRemaining--;
        console.log(`🚩 Прапорець встановлено на [${row}, ${col}]`);
    } else if (cell.state === CellState.Flagged) {
        cell.state = CellState.Closed;
        gameState.flagsRemaining++;
        console.log(`❌ Прапорець знято з [${row}, ${col}]`);
    }
    updateFlagsCountUI(gameState); // Оновити UI лічильника прапорців
    updateBoardUI(gameState); // Оновити UI клітинки
}

// Перевірка на перемогу: всі клітинки без мін відкриті
function checkWin(gameState) {
    const totalCells = gameState.rows * gameState.cols;
    const openedCells = gameState.board.flat().filter(cell => cell.state === CellState.Open).length;

    return openedCells === (totalCells - gameState.mineCount);
}

// Показати всі міни при програші
function revealAllMines(gameState, explodedRow, explodedCol) {
    gameState.board.forEach((rowArr, r) => {
        rowArr.forEach((cell, c) => {
            if (cell.hasMine && cell.state !== CellState.Flagged) {
                cell.state = CellState.Open; // Відкриваємо всі міни
            }
            if (r === explodedRow && c === explodedCol) {
                // Додатковий атрибут для вибухнутої клітинки
                cell.exploded = true;
            }
        });
    });
}

// 5. Логіка таймера
/**
 * Форматує секунди у формат MM:SS.
 * @param {number} totalSeconds К-сть секунд.
 * @returns {string} Форматований час.
 */
function formatTime(totalSeconds) {
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
}

/**
 * Оновлює UI таймера.
 * @param {object} gameState
 */
function updateTimerUI(gameState) {
    timerElement.textContent = formatTime(gameState.secondsElapsed);
}

/**
 * Запускає ігровий таймер.
 * @param {object} gameState Поточний стан гри.
 */
function startTimer(gameState) {
    if (gameState.timerId) return; // Таймер вже запущено

    gameState.timerId = setInterval(() => {
        gameState.secondsElapsed++;
        updateTimerUI(gameState);
    }, 1000);
    console.log("⏱️ Таймер запущено!");
}

/**
 * Зупиняє ігровий таймер.
 * @param {object} gameState Поточний стан гри.
 */
function stopTimer(gameState) {
    // ПЕРЕВІРКА: якщо gameState не існує (null), просто виходимо
    if (!gameState) return;

    if (gameState.timerId) {
        clearInterval(gameState.timerId);
        gameState.timerId = null;
        console.log(`🛑 Таймер зупинено на: ${gameState.secondsElapsed} секунді.`);
    }
}

// 6. Рендеринг та Оновлення UI
/**
 * Оновлює UI лічильника прапорців.
 * @param {object} gameState
 */
function updateFlagsCountUI(gameState) {
    flagsCountElement.textContent = String(gameState.flagsRemaining).padStart(3, '0');
}

/**
 * Рендерить ігрове поле та додає обробники подій.
 * @param {object} gameState
 */
function renderBoard(gameState) {
    boardElement.innerHTML = ''; // Очистити поле
    boardElement.style.gridTemplateColumns = `repeat(${gameState.cols}, var(--cell))`;

    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            const cellDiv = document.createElement('div');
            cellDiv.classList.add('cell');
            cellDiv.dataset.row = r;
            cellDiv.dataset.col = c;
            cellDiv.dataset.index = r * gameState.cols + c;

            // Обробка подій кліків мишкою
            cellDiv.addEventListener('click', handleCellClick);
            cellDiv.addEventListener('contextmenu', handleCellRightClick); // Права кнопка

            boardElement.appendChild(cellDiv);
        }
    }
    updateBoardUI(gameState);
}

/**
 * Оновлює класи та вміст кожної клітинки на дошці.
 * @param {object} gameState Поточний стан гри.
 */
function updateBoardUI(gameState) {
    const cells = boardElement.querySelectorAll('.cell');

    gameState.board.flat().forEach((cellData, index) => {
        const cellDiv = cells[index];
        cellDiv.className = 'cell'; // Скидання всіх класів

        if (cellData.state === CellState.Open) {
            cellDiv.classList.add('open');
            if (cellData.hasMine) {
                if (cellData.exploded) {
                    cellDiv.classList.add('exploded');
                    cellDiv.innerHTML = '💥';
                } else {
                    cellDiv.classList.add('mine');
                    cellDiv.innerHTML = '💣';
                }
            } else if (cellData.adjacentMines > 0) {
                cellDiv.classList.add(`n${cellData.adjacentMines}`);
                cellDiv.textContent = cellData.adjacentMines;
            } else {
                cellDiv.textContent = '';
            }
        } else if (cellData.state === CellState.Flagged) {
            cellDiv.classList.add('flag');
            cellDiv.innerHTML = '🚩';
            // Додаткова візуалізація прапорця на міні (для фінального стану гри)
            if (gameState.status !== GameStatus.InProgress && cellData.hasMine) {
                cellDiv.classList.add('flag-mine');
            }
        } else {
            cellDiv.classList.add('closed');
            cellDiv.textContent = '';
        }
    });
}

// Обробники подій DOM

/**
 * Обробник лівого кліку миші (відкриття клітинки).
 * @param {MouseEvent} event
 */
function handleCellClick(event) {
    if (game.status !== GameStatus.InProgress) return;
    // Запуск таймера при першому кліку
    if (!game.timerId) startTimer(game);

    const row = parseInt(this.dataset.row);
    const col = parseInt(this.dataset.col);

    openCell(game, row, col);
}

/**
 * Обробник правого кліку миші (прапорець).
 * @param {MouseEvent} event
 */
function handleCellRightClick(event) {
    event.preventDefault(); // Запобігаємо стандартному контекстному меню
    if (game.status !== GameStatus.InProgress) return;

    const row = parseInt(this.dataset.row);
    const col = parseInt(this.dataset.col);

    toggleFlag(game, row, col);
}

/**
 * Обробник кліку на кнопку "Start/Restart".
 */
function handleStartButtonClick() {
    if (event.currentTarget.id === 'start-btn' && messageOverlay.classList.contains('visible')) {
        return;
    }

    // Приховуємо модальне вікно перед стартом.
    hideResult();
    stopTimer(game);
    game = generateField(ROWS, COLS, MINES);
    renderBoard(game); // Рендер нового поля
    updateTimerUI(game); // Скинути таймер UI
    updateFlagsCountUI(game); // Скинути лічильник прапорців

    // Оновлення кнопки
    startButton.textContent = "Start";
    startButton.classList.remove('restart');

    console.log('--- НОВА ГРА ІНІЦІАЛІЗОВАНА ---');
}

/**
 * Відображає повідомлення про результат гри.
 * @param {string} status 'win' або 'lose'.
 * @param {number} time Час гри.
 */
function showResult(status, time) {
    messageOverlay.classList.add('visible');
    const box = messageOverlay.querySelector('.message-box');
    box.classList.remove('win-color', 'lose-color');

    if (status === GameStatus.Win) {
        messageTitle.textContent = "🎉 VICTORY!";
        messageText.innerHTML = `You cleared the field in <strong>${time}</strong>!`;
        box.classList.add('win-color');
    } else { // GameStatus.Lose
        messageTitle.textContent = "💥 GAME OVER!";
        messageText.innerHTML = `You hit a mine. Time: <strong>${time}</strong>. Try again!`;
        box.classList.add('lose-color');
    }
}

/**
 * Приховує повідомлення про результат.
 */
function hideResult() {
    messageOverlay.classList.remove('visible');
}

// Ініціалізація Гри

/**
 * Запускає гру при завантаженні сторінки.
 */
function initializeGame() {
    boardElement = document.getElementById('board');
    startButton = document.getElementById('start-btn');
    timerElement = document.getElementById('timer');
    flagsCountElement = document.getElementById('flags-count');

    // ІНІЦІАЛІЗАЦІЯ ЕЛЕМЕНТІВ ПОВІДОМЛЕННЯ
    messageOverlay = document.getElementById('message-overlay');
    messageTitle = document.getElementById('message-title');
    messageText = document.getElementById('message-text');
    restartMessageButton = document.getElementById('restart-message-btn');
    closeMessageButton = document.getElementById('close-message-btn');

    startButton.addEventListener('click', handleStartButtonClick);

    // Обробник для кнопки "Грати знову" в повідомленні
    restartMessageButton.addEventListener('click', handleStartButtonClick);
    // Обробник для кнопки "Закрити"
    closeMessageButton.addEventListener('click', hideResult);

    // Ініціалізація першої гри
    handleStartButtonClick();
}

document.addEventListener('DOMContentLoaded', initializeGame);

// Експорт для можливості використання в іншому модулі (якщо потрібне підключення до DOM)
export { generateField, openCell, toggleFlag, startTimer, stopTimer, GameStatus, CellState };