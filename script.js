// script.js

document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const flagsLeftElement = document.querySelector('.game-board-header__flags_left');
    const startButton = document.querySelector('.start-button');
    const timerElement = document.querySelector('.game-board-header__timer');

    const gridSize = 10; // 10x10 grid
    const initialNumMines = 15; // Initial number of mines (increase for more difficulty)
    let numMines = initialNumMines;
    let board = [];
    let cells = [];
    let gameOver = false;
    let flagsPlaced = 0;
    let timerInterval;
    let seconds = 0;

    // Update flags left display
    function updateFlagsLeft() {
        flagsLeftElement.textContent = String(numMines - flagsPlaced).padStart(3, '0');
    }

    // Start timer
    function startTimer() {
        clearInterval(timerInterval);
        seconds = 0;
        timerElement.textContent = '00:00';
        timerInterval = setInterval(() => {
            seconds++;
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            timerElement.textContent = 
                `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
        }, 1000);
    }

    // Stop timer
    function stopTimer() {
        clearInterval(timerInterval);
    }

    // Reset game
    function resetGame() {
        stopTimer();
        gameBoard.innerHTML = '';
        board = [];
        cells = [];
        gameOver = false;
        flagsPlaced = 0;
        numMines = initialNumMines;
        updateFlagsLeft();
        createBoard();
        startButton.textContent = 'Reset';
    }

    // Create the game board
    function createBoard() {
        gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 30px)`;
        for (let i = 0; i < gridSize * gridSize; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.setAttribute('data-id', i);
            cell.addEventListener('click', () => handleClick(cell));
            cell.addEventListener('contextmenu', (e) => handleRightClick(e, cell));
            gameBoard.appendChild(cell);
            cells.push(cell);
            board.push({ isMine: false, isRevealed: false, isFlagged: false, surroundingMines: 0 });
        }
        placeMines();
        calculateSurroundingMines();
        updateFlagsLeft();
    }

    // Place mines randomly
    function placeMines() {
        let minesPlaced = 0;
        while (minesPlaced < numMines) {
            const randomIndex = Math.floor(Math.random() * gridSize * gridSize);
            if (!board[randomIndex].isMine) {
                board[randomIndex].isMine = true;
                minesPlaced++;
            }
        }
    }

    // Calculate surrounding mines for each cell
    function calculateSurroundingMines() {
        for (let i = 0; i < gridSize * gridSize; i++) {
            if (!board[i].isMine) {
                let mineCount = 0;
                const neighbors = getNeighbors(i);
                neighbors.forEach(neighborIndex => {
                    if (board[neighborIndex].isMine) {
                        mineCount++;
                    }
                });
                board[i].surroundingMines = mineCount;
            }
        }
    }

    // Get neighbors of a cell
    function getNeighbors(index) {
        const neighbors = [];
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;

                const newRow = row + i;
                const newCol = col + j;
                const newIndex = newRow * gridSize + newCol;

                if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
                    neighbors.push(newIndex);
                }
            }
        }
        return neighbors;
    }

    // Handle cell click
    function handleClick(cell) {
        if (gameOver || cell.classList.contains('revealed') || cell.classList.contains('flagged')) return;

        const id = parseInt(cell.getAttribute('data-id'));
        const cellData = board[id];

        if (cellData.isMine) {
            revealMines();
            gameOver = true;
            stopTimer();
            alert('Game Over! You hit a mine.');
            return;
        }

        if (seconds === 0) startTimer(); // Start timer on first valid click
        revealCell(id);
        checkWin();
    }

    // Handle right click (flagging)
    function handleRightClick(e, cell) {
        e.preventDefault();
        if (gameOver || cell.classList.contains('revealed')) return;

        const id = parseInt(cell.getAttribute('data-id'));
        const cellData = board[id];

        if (cell.classList.contains('flagged')) {
            cell.classList.remove('flagged');
            cell.textContent = '';
            cellData.isFlagged = false;
            flagsPlaced--;
        } else if (flagsPlaced < numMines) {
            cell.classList.add('flagged');
            cell.textContent = '🚩';
            cellData.isFlagged = true;
            flagsPlaced++;
        } else {
            alert('No more flags left!');
        }
        updateFlagsLeft();
    }

    // Reveal a cell and recursively reveal empty neighbors
    function revealCell(index) {
        const cell = cells[index];
        const cellData = board[index];

        if (cellData.isRevealed || cellData.isFlagged) return;

        cellData.isRevealed = true;
        cell.classList.add('revealed');

        if (cellData.surroundingMines > 0) {
            cell.textContent = cellData.surroundingMines;
            cell.classList.add(`mines-${cellData.surroundingMines}`);
        } else {
            const neighbors = getNeighbors(index);
            neighbors.forEach(neighborIndex => revealCell(neighborIndex));
        }
    }

    // Reveal all mines at game over
    function revealMines() {
        for (let i = 0; i < gridSize * gridSize; i++) {
            if (board[i].isMine) {
                cells[i].classList.add('mine');
                cells[i].textContent = '💣';
            }
        }
    }

    // Check if the player has won
    function checkWin() {
        let revealedCount = 0;
        for (let i = 0; i < gridSize * gridSize; i++) {
            if (board[i].isRevealed && !board[i].isMine) {
                revealedCount++;
            }
        }

        if (revealedCount === (gridSize * gridSize - numMines)) {
            gameOver = true;
            stopTimer();
            alert('Congratulations! You won!');
        }
    }

    startButton.addEventListener('click', resetGame);

    // Initial game setup
    createBoard();
});
