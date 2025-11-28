let mines = 10,
    flags = mines;
const rows = 10,
      cols = 10;

const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
const inBounds = (row, col) => row >= 0 && row < rows && col >= 0 && col < cols;
const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
];

let timer;

const startTimer = () => {
    timer = setInterval(() => {
        const counter = document.getElementById('controls').children[2]
        let time = +Array.from(counter.children).map((e) => e.className.match(/\d/)[0] || 0).join('');
        if (time == 999) return;
        time++;
        const digits = [parseInt(time / 100), parseInt(time / 10 % 10), parseInt(time % 10)];
        counter.children[0].className = `digit digit-${digits[0]}`
        counter.children[1].className = `digit digit-${digits[1]}`
        counter.children[2].className = `digit digit-${digits[2]}`
    }, 1000)
}

const stopTimer = () => clearInterval(timer);

const resetTimer = () => {
    const counter = document.getElementById('controls').children[2]
    counter.children[0].className = `digit digit-0`
    counter.children[1].className = `digit digit-0`
    counter.children[2].className = `digit digit-0`
}

const endGame = (win = false) => {
    stopTimer()
    if (win)
        document.getElementById('reset-button').classList.add('win');
    else
        document.getElementById('reset-button').classList.add('loss');


    document.querySelector('#game-field').classList.add('done');
    document.querySelectorAll('.cell').forEach(cell => {
        if (win && cell.classList.contains('mine'))
            cell.classList.add('flag')
        cell.removeEventListener('click', leftClickListener)
        cell.removeEventListener('mousedown', rightClickListener)
    });
}

const rightClickListener = (event) => {
    const cell = event.target;
    if (!cell.classList.contains('revealed') && event.button === 2)
    {
        cell.classList.toggle('flag');

        if (cell.classList.contains('flag'))flags--;
        else flags++;

        const digits = [parseInt(flags / 100), parseInt(flags / 10 % 10), parseInt(flags % 10)];
        const counter = document.getElementById('controls').children[0]
        counter.children[0].className = `digit digit-${!digits[0] && flags < 0 ? '' : digits[0]}`
        counter.children[1].className = `digit digit-${Math.abs(digits[1])}`
        counter.children[2].className = `digit digit-${Math.abs(digits[2])}`
    }

}

const leftClickListener = (event) => {
    const cell = event.target;
    if (cell.classList.contains('flag')
        || cell.classList.contains('revealed')
        || event.button !== 0) return;

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    const revealCell = (row, col) => {
        const currentCell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (!currentCell || currentCell.classList.contains('revealed') || currentCell.classList.contains('flag'))
            return;

        currentCell.classList.add('revealed');
        const value = grid[row][c];

        if (value === -1) return endGame(false);

        if (document.querySelectorAll('.cell:not(.revealed)').length === mines) return endGame(true);

        if (value > 0) return;

        for (const [drow, dcol] of directions) {
            const nr = row + drow, nc = col + dcol;
            if (inBounds(nr, nc)) revealCell(nr, nc);
        }
    };

    revealCell(row, col);
};

const createFieldListener = (event) => {
    const cell = event.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    let placedMines = 0;
    while (placedMines < mines) {
        const [rowIndex, colIndex] = [
            Math.floor(Math.random() * rows),
            Math.floor(Math.random() * cols)
        ];
        if ((rowIndex === row && colIndex === col) || grid[rowIndex][colIndex] === -1)
            continue;
        grid[rowIndex][colIndex] = -1;
        placedMines++;
    }

    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
        for (let colIndex = 0; colIndex < cols; colIndex++) {
            if (grid[rowIndex][colIndex] === -1) continue;
            let adjacentMineCount = 0;
            for (const [rowOffset, colOffset] of directions) {
                const neighborRow = rowIndex + rowOffset;
                const neighborCol = colIndex + colOffset;
                if (inBounds(neighborRow, neighborCol) && grid[neighborRow][neighborCol] === -1) {
                    adjacentMineCount++;
                }
            }
            grid[rowIndex][colIndex] = adjacentMineCount;
        }
    }

    console.log(grid);

    startTimer()

    document.querySelectorAll('.cell').forEach(cell => {
        const aCell = grid[cell.dataset.row][cell.dataset.col];

        if (aCell > 0) cell.classList.add(`number-${aCell}`);
        if (aCell < 0) cell.classList.add('mine');

        cell.removeEventListener('click', createFieldListener);

        cell.addEventListener('mousedown', rightClickListener)

        cell.addEventListener('click', leftClickListener)
    });

    leftClickListener(event);
};

const startGame = () => {
    stopTimer()
    resetTimer()
    grid.map(el => el.fill(0))
    const cells = Array.from({ length: 100 }, () => document.createElement('div'));

    cells.forEach(cell => { cell.classList.add('cell') });
    document.getElementById('reset-button').classList.remove('win', 'loss');
    document.getElementById('game-field').replaceChildren(...cells)
    document.getElementById('game-field').classList.remove('done')

    // reset flags
    flags = mines;
    const digits = [parseInt(flags / 100), parseInt(flags / 10 % 10), parseInt(flags % 10)];
    const counter = document.getElementById('controls').children[0]
    counter.children[0].className = `digit digit-${!digits[0] && flags < 0 ? '' : digits[0]}`
    counter.children[1].className = `digit digit-${Math.abs(digits[1])}`
    counter.children[2].className = `digit digit-${Math.abs(digits[2])}`

    document.querySelectorAll('.cell').forEach((cell, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        cell.dataset.row = row;
        cell.dataset.col = col;

        cell.addEventListener('contextmenu', (e) => e.preventDefault());

        cell.addEventListener('click', createFieldListener);
    })
}

startGame()

document.getElementById('reset-button').addEventListener('click', () => startGame());
document.addEventListener('mousedown', (event) => {
    if (event.button === 0
        && event.target instanceof Element
        && event.target.classList.contains('cell')
        && !event.target.classList.contains('revealed')
        && !event.target.classList.contains('flag')
        && !document.getElementById('game-field').classList.contains('done'))
        document.getElementById('reset-button').classList.add('scared')
})

document.addEventListener('mouseup', () => document.getElementById('reset-button').classList.remove('scared'))
