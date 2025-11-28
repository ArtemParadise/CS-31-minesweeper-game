<<<<<<< Updated upstream
//Структура клітинки
=======
// main.js — інтеграція логіки Minesweeper з UI

// ---------- Модель (як у вас) ----------
>>>>>>> Stashed changes
function createCell(hasMine = false, adjacentMines = 0, state = "closed") {
    return { hasMine, adjacentMines, state };
}

<<<<<<< Updated upstream
//Структура поля
=======
>>>>>>> Stashed changes
function createField(rows, cols) {
    const field = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) row.push(createCell());
        field.push(row);
    }
    return field;
}

<<<<<<< Updated upstream
//Структура гри
=======
>>>>>>> Stashed changes
function createGameState(rows, cols, mines) {
    return {
        rows, cols, mines,
        status: "ready", // ready | in_progress | lost | won
        field: createField(rows, cols),
        flagsPlaced: 0,
        openedCount: 0
    };
}

<<<<<<< Updated upstream
const game = createGameState(4, 4, 3);

game.field[0][1].hasMine = true;
game.field[2][3].hasMine = true;
game.field[3][0].hasMine = true;

game.field[0][0].adjacentMines = 1;
game.field[0][2].adjacentMines = 1;
game.field[1][1].adjacentMines = 2;

game.field[1][1].state = "open";
game.field[2][2].state = "flag";

console.log("Поточний стан гри:", game);
=======
function countNeighbourMines(field, row, col) {
    const dirs = [-1, 0, 1];
    let count = 0;
    dirs.forEach(dr => dirs.forEach(dc => {
        if (dr === 0 && dc === 0) return;
        const r = row + dr, c = col + dc;
        if (field[r] && field[r][c] && field[r][c].hasMine) count++;
    }));
    return count;
}

function generateField(rows, cols, mines) {
    const field = createField(rows, cols);
    let placed = 0;
    while (placed < mines) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);
        if (!field[r][c].hasMine) { field[r][c].hasMine = true; placed++; }
    }
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
            field[r][c].adjacentMines = countNeighbourMines(field, r, c);

    return field;
}

// ---------- UI + Гра ----------
const ROWS = 16, COLS = 16, MINES = 40; // налаштування (можна змінити)
const gridEl = document.getElementById('grid');
const timerEl = document.getElementById('timer');
const flagsEl = document.getElementById('flags');
const startBtn = document.getElementById('startBtn');

let game = createGameState(ROWS, COLS, MINES);
let timerInterval = null;
let timerValue = 0;

// Ініціалізація DOM клітинок (створюємо потрібну кількість/повторний рендер буде міняти класи)
function initGridDOM() {
    gridEl.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cellDiv = document.createElement('div');
            cellDiv.className = 'cell closed';
            cellDiv.dataset.r = r;
            cellDiv.dataset.c = c;
            // Події
            cellDiv.addEventListener('click', onCellLeftClick);
            cellDiv.addEventListener('contextmenu', onCellRightClick);
            gridEl.appendChild(cellDiv);
        }
    }
}

// Рендер одного клітинного DOM на основі моделі
function renderCellDOM(r, c) {
    const cell = game.field[r][c];
    const idx = r * COLS + c;
    const cellDiv = gridEl.children[idx];
    cellDiv.className = 'cell'; // базова
    if (cell.state === 'closed') {
        cellDiv.classList.add('closed');
        cellDiv.textContent = '';
    } else if (cell.state === 'flag') {
        cellDiv.classList.add('flag');
        cellDiv.textContent = '';
    } else if (cell.state === 'open') {
        if (cell.hasMine) {
            cellDiv.classList.add('mine');
            cellDiv.textContent = '';
        } else {
            cellDiv.classList.add('open');
            cellDiv.textContent = cell.adjacentMines > 0 ? cell.adjacentMines : '';
        }
    } else if (cell.state === 'exploded') {
        cellDiv.classList.add('mine-clicked');
    } else if (cell.state === 'no-mine-flag') {
        cellDiv.classList.add('no-mine-flag');
    }
}

// Рендер усього поля
function renderField() {
    for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
            renderCellDOM(r, c);
    flagsEl.textContent = String(game.mines - game.flagsPlaced).padStart(3, '0');
}

// Таймер
function startTimer() {
    if (timerInterval) return;
    timerValue = 0;
    timerEl.textContent = String(timerValue).padStart(3, '0');
    timerInterval = setInterval(() => {
        timerValue++;
        timerEl.textContent = String(timerValue).padStart(3, '0');
    }, 1000);
}

function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

// Перезапуск гри
function startNewGame() {
    stopTimer();
    timerValue = 0; timerEl.textContent = String(timerValue).padStart(3, '0');
    game = createGameState(ROWS, COLS, MINES);
    game.field = generateField(ROWS, COLS, MINES);
    game.status = 'in_progress';
    game.flagsPlaced = 0;
    game.openedCount = 0;
    startBtn.classList.remove('lost');
    startBtn.classList.remove('won');
    initGridDOM();
    renderField();
}

// Перевірка виграшу
function checkWin() {
    const totalCells = ROWS * COLS;
    if (game.openedCount === totalCells - game.mines) {
        game.status = 'won';
        stopTimer();
        startBtn.classList.add('won');
        // автоматично поставити прапорці на мінних клітинках
        for (let r = 0; r < ROWS; r++)
            for (let c = 0; c < COLS; c++)
                if (game.field[r][c].hasMine && game.field[r][c].state !== 'flag') {
                    game.field[r][c].state = 'flag';
                    game.flagsPlaced++;
                }
        renderField();
        alert('Ви виграли! 🎉');
    }
}

// Відкрити клітинку (рекурсивно)
function openCell(gameState, row, col) {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
    const cell = gameState.field[row][col];
    if (cell.state === 'open' || cell.state === 'flag') return;

    if (cell.hasMine) {
        cell.state = 'exploded';
        gameState.status = 'lost';
        // позначити всі міни
        for (let r = 0; r < ROWS; r++)
            for (let c = 0; c < COLS; c++)
                if (gameState.field[r][c].hasMine && gameState.field[r][c].state !== 'exploded')
                    gameState.field[r][c].state = 'open';
        stopTimer();
        renderField();
        startBtn.classList.add('lost');
        alert('Вибух! Ви програли.');
        return;
    }

    cell.state = 'open';
    gameState.openedCount++;
    // Якщо 0 сусідів — рекурсивно відкриваємо сусідів
    if (cell.adjacentMines === 0) {
        for (let dr = -1; dr <= 1; dr++)
            for (let dc = -1; dc <= 1; dc++)
                if (!(dr === 0 && dc === 0)) openCell(gameState, row + dr, col + dc);
    }
}

// Обробка лівого кліка
function onCellLeftClick(e) {
    if (game.status !== 'in_progress') return;
    const r = Number(this.dataset.r), c = Number(this.dataset.c);
    if (!timerInterval) startTimer(); // запуск таймера з першого кліку
    const cell = game.field[r][c];
    if (cell.state === 'flag' || cell.state === 'open') return;
    openCell(game, r, c);
    renderField();
    if (game.status === 'in_progress') checkWin();
}

// Обробка правого кліка (прапорець)
function onCellRightClick(e) {
    e.preventDefault();
    if (game.status !== 'in_progress') return;
    const r = Number(this.dataset.r), c = Number(this.dataset.c);
    const cell = game.field[r][c];
    if (cell.state === 'open') return;
    if (cell.state === 'flag') {
        cell.state = 'closed';
        game.flagsPlaced = Math.max(0, game.flagsPlaced - 1);
    } else {
        if (game.flagsPlaced < game.mines) {
            cell.state = 'flag';
            game.flagsPlaced++;
        } else {
            // необов'язково — можна показати підказку, що прапорів більше нема
            return;
        }
    }
    renderField();
    if (game.status === 'in_progress') checkWin();
}

// Кнопка старт/рестарт
startBtn.addEventListener('click', () => {
    startNewGame();
});

// Захист від контекстного меню на полі
gridEl.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Першочергова ініціалізація
initGridDOM();
game.field = generateField(ROWS, COLS, MINES);
game.status = 'in_progress';
renderField();
>>>>>>> Stashed changes
