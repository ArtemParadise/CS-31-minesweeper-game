// default values for board size and bomb count
let sizeX = 10;
let sizeY = 10;
let bombs = 10;
let board = [];
// Game state variables
let gameOver = false;
// Timer variables
let timerInterval;
// Timer and flagged count
let seconds = 0;
let flaggedCount = 0;

// Starts a new game
function startGame() {
    // Get the board element and clear the existing content
    const boardElement = document.getElementById("game-board");
    boardElement.innerHTML = "";
    board = [];
    gameOver = false;
    seconds = 0;
    flaggedCount = 0;
    clearInterval(timerInterval);

    // Read board size and bomb count from input fields
    sizeX = parseInt(document.getElementById("board-size-x").value);
    sizeY = parseInt(document.getElementById("board-size-y").value);
    bombs = parseInt(document.getElementById("bomb-count").value);

    // Set up the CSS grid based on the board size
    boardElement.style.gridTemplateColumns = `repeat(${sizeY}, 35px)`;
    boardElement.style.gridTemplateRows = `repeat(${sizeX}, 35px)`;

    // Initialize bomb counter and timer
    document.getElementById("bomb-counter").textContent = flaggedCount;
    document.getElementById("bomb-total").textContent = bombs;
    document.getElementById("timer").textContent = seconds;

    // Start the timer
    timerInterval = setInterval(() => {
        if (!gameOver) {
            seconds++;
            document.getElementById("timer").textContent = seconds;
        }
    }, 1000);

    // Initialize the game board with cells
    for (let i = 0; i < sizeX; i++) {
        let row = [];
        for (let j = 0; j < sizeY; j++) {
            row.push({ revealed: false, bomb: false, adjacent: 0, flagged: false });
        }
        board.push(row);
    }

    // Place bombs randomly on the board
    let placed = 0;
    while (placed < bombs) {
        let x = Math.floor(Math.random() * sizeX);
        let y = Math.floor(Math.random() * sizeY);
        if (!board[x][y].bomb) {
            board[x][y].bomb = true;
            placed++;
        }
    }

    // Calculate the number of adjacent bombs for each non-bomb cell
    for (let i = 0; i < sizeX; i++) {
        for (let j = 0; j < sizeY; j++) {
            if (!board[i][j].bomb) {
                board[i][j].adjacent = countAdjacentBombs(i, j);
            }
        }
    }

    // Create and append cells to the board element
    for (let i = 0; i < sizeX; i++) {
        for (let j = 0; j < sizeY; j++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.x = i;
            cell.dataset.y = j;

            // Add event listeners for left click (reveal) and right click (flag)
            cell.addEventListener("click", revealCell);
            cell.addEventListener("contextmenu", toggleFlag);
            boardElement.appendChild(cell);
        }
    }
}

// Count the number of bombs around a given cell at (x, y)
function countAdjacentBombs(x, y) {
    let count = 0;
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue; // Skip the current cell itself
            let nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < sizeX && ny >= 0 && ny < sizeY) {
                if (board[nx][ny].bomb) count++;
            }
        }
    }
    return count;
}

// Reveal/show/open the clicked cell
function revealCell(event) {
    if (gameOver) return; // Don't do anything if the game is over

    const x = parseInt(event.target.dataset.x);
    const y = parseInt(event.target.dataset.y);

    if (board[x][y].revealed || board[x][y].flagged) return; // Ignore already revealed or flagged cells

    board[x][y].revealed = true;
    const cell = event.target;

    // If the cell contains a bomb, game over
    if (board[x][y].bomb) {
        cell.classList.add("bomb");
        cell.textContent = "💣";
        gameOver = true;
        clearInterval(timerInterval); // Stop the timer
        alert("Game Over! You clicked on a bomb.");
    } else {
        cell.classList.add("revealed");
        if (board[x][y].adjacent > 0) {
            cell.textContent = board[x][y].adjacent;
            cell.classList.add("number" + board[x][y].adjacent);
        } else {
            revealAdjacentCells(x, y); // Reveal adjacent cells if no bombs around
        }
        checkWin(); // Check if the player has won
    }
}

// Reveal/show/open adjacent cells recursively when there are no bombs around
function revealAdjacentCells(x, y) {
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue; // Skip the current cell itself
            let nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < sizeX && ny >= 0 && ny < sizeY) {
                if (!board[nx][ny].revealed && !board[nx][ny].bomb) {
                    const cell = document.querySelector(`[data-x='${nx}'][data-y='${ny}']`);
                    revealCell({ target: cell });
                }
            }
        }
    }
}

// Toggle a flag on or off for a cell (right-click)
function toggleFlag(event) {
    event.preventDefault(); // Prevent the default right-click menu
    if (gameOver) return; // Do nothing if the game is over

    const x = parseInt(event.target.dataset.x);
    const y = parseInt(event.target.dataset.y);

    if (board[x][y].revealed) return; // Prevent flagging revealed cells

    // Toggle the flagged status of the cell
    board[x][y].flagged = !board[x][y].flagged;
    if (board[x][y].flagged) {
        event.target.textContent = "🚩";
        event.target.classList.add("flagged");
        flaggedCount++;
    } else {
        event.target.textContent = "";
        event.target.classList.remove("flagged");
        flaggedCount--;
    }

    // Update the bomb counter
    document.getElementById("bomb-counter").textContent = flaggedCount;
    checkWin(); // Check if the player has won
}

// Check if the player has won the game
function checkWin() {
    let revealedCount = 0;
    let totalSafeCells = sizeX * sizeY - bombs;

    // Count how many safe cells have been revealed
    for (let i = 0; i < sizeX; i++) {
        for (let j = 0; j < sizeY; j++) {
            if (board[i][j].revealed && !board[i][j].bomb) {
                revealedCount++;
            }
        }
    }

    // If all safe cells are revealed, the player wins
    if (revealedCount === totalSafeCells) {
        gameOver = true;
        clearInterval(timerInterval); // Stop the timer

        // Flag all remaining bombs that are not yet revealed
        for (let i = 0; i < sizeX; i++) {
            for (let j = 0; j < sizeY; j++) {
                if (board[i][j].bomb) {
                    const cell = document.querySelector(`[data-x='${i}'][data-y='${j}']`);
                    if (cell && !board[i][j].revealed) {
                        cell.textContent = "🚩";
                        cell.classList.add("flagged");
                    }
                }
            }
        }

        // Display win message after a short delay
        setTimeout(() => alert(`Congratulations! You win in ${seconds} seconds!`), 100);
    }
}
