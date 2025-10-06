// game board size and mine count
let rows = 10;
let cols = 10;
let mines = 20;

let field;           // Spielfeld
let revealed;        // Array to track revealed cells
let flags;           // Array to track flagged cells
let gameOver = false;
let timer;
let seconds = 0;

let totalFlags = 0;  // Track the total number of flags placed

// Generate the board field with given rows, cols and mines
function generateField(rows, cols, mines) {
  let field = Array.from({ length: rows }, () => Array(cols).fill(0));

  // Place bomb randomly
  let placedMines = 0;
  while (placedMines < mines) {
    let row = Math.floor(Math.random() * rows);
    let col = Math.floor(Math.random() * cols);

    if (field[row][col] !== 'M') {
      field[row][col] = 'M';
      placedMines++;
    }
  }

  // count the neighbouring mines for each cell
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (field[row][col] !== 'M') {
        field[row][col] = countNeighbourMines(field, row, col);
      }
    }
  }

  // Debug tool: Log the generated field to the console
  console.log("Generierted field:");
  console.table(field);

  // Return the generated field
  return field;
}

// Counts the number of neighbouring mines for a given cell
function countNeighbourMines(field, row, col) {
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [ 0, -1],          [ 0, 1],
    [ 1, -1], [ 1, 0], [ 1, 1]
  ];

  let mineCount = 0;

  for (let [dx, dy] of directions) {
    let newRow = row + dx;
    let newCol = col + dy;

    if (newRow >= 0 && newRow < field.length && newCol >= 0 && newCol < field[0].length) {
      if (field[newRow][newCol] === 'M') {
        mineCount++;
      }
    }
  }

  console.log(`Cell (${row}, ${col}) has ${mineCount} neighboured mines.`);
  return mineCount;
}

// Open a cell
function openCell(row, col) {
  if (gameOver || revealed[row][col]) return;

  revealed[row][col] = true;

  // Debug tool: Log cell opening action
  console.log(`Cell opened at (${row}, ${col})`);

  if (field[row][col] === 'M') {
    // Debug tool: Log game over
    console.log("Game Over! You hit a bomb!");
    gameOver = true;
    stopTimer();
    displayGameOverMessage(); // Shows "Game Over" in a modal dialog
    renderBoard(); 
    return;
  }

  // If the opened cell has 0 neighbouring mines, open adjacent cells recursively
  if (field[row][col] === 0) {
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [ 0, -1],          [ 0, 1],
      [ 1, -1], [ 1, 0], [ 1, 1]
    ];

    for (let [dx, dy] of directions) {
      let newRow = row + dx;
      let newCol = col + dy;
      if (newRow >= 0 && newRow < field.length && newCol >= 0 && newCol < field[0].length) {
        if (!revealed[newRow][newCol]) {
          // Debug tool: Log auto-opening action
          console.log(`Auto-opening cell (${newRow}, ${newCol})`);

          openCell(newRow, newCol);
        }
      }
    }
  }

  renderBoard();

  if (checkWin()) {
    gameOver = true;
    stopTimer();
    displayWinMessage(); // Shows the "You Win!" message
  }
}

// Set or remove a flag on a cell
function toggleFlag(row, col) {
  if (gameOver) return;

  flags[row][col] = !flags[row][col];

  // Debug tool: Log flag action
  console.log(`Flag ${flags[row][col] ? 'set' : 'removed'} at (${row}, ${col})`);

  // Update total flag count
  totalFlags = flags.flat().filter(flag => flag).length;

  renderBoard();
  updateBombCounter(); // Update bomb counter after flag is placed/removed

  if (checkWin()) {
    gameOver = true;
    stopTimer();
    displayWinMessage(); // Zeigt die Nachricht "You Win!"
  }
}

// Render function to update the board display
function renderBoard() {
  const gameBoard = document.getElementById("gameBoard");
  const cells = gameBoard.getElementsByClassName("cell");

  let index = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = cells[index];
      index++;

      // Wenn die Zelle aufgedeckt wurde
      if (revealed[row][col]) {
        if (field[row][col] === 'M') {
          cell.classList.add('mine');
          cell.textContent = '💣'; // Zeigt das Bomben-Symbol
        } else {
          cell.classList.add('revealed');
          if (field[row][col] > 0) {
            cell.textContent = field[row][col];
          }
        }
      } else if (flags[row][col]) {
        // Wenn ein Flag gesetzt wurde
        cell.classList.add('flag');
        cell.textContent = '🚩';
      } else {
        // Wenn die Zelle weder aufgedeckt noch ein Flag ist
        cell.classList.remove('revealed', 'mine', 'flag');
        cell.textContent = '';
      }
    }
  }
}

// Start the timer
function startTimer() {
  if (timer) return;

  timer = setInterval(() => {
    seconds++;
    document.getElementById("timer").textContent = `Zeit: ${seconds}`;
    
    // Debug tool: Log timer update
    //console.log(`Timer: ${seconds} seconds`);
  }, 1000);
}

// Stopp the timer
function stopTimer() {
  clearInterval(timer);
  timer = null;
  console.log(`Timer stopped. Total time: ${seconds}`);
}




// Initialize the game
function initializeGame() {
  rows = parseInt(document.getElementById("board-size-x").value);
  cols = parseInt(document.getElementById("board-size-y").value);
  mines = parseInt(document.getElementById("bomb-count").value);

  field = generateField(rows, cols, mines); 
  revealed = Array.from({ length: rows }, () => Array(cols).fill(false));
  flags = Array.from({ length: rows }, () => Array(cols).fill(false));
  gameOver = false;
  seconds = 0;
  totalFlags = 0;

  const gameBoard = document.getElementById("gameBoard");
  gameBoard.innerHTML = ""; 

  gameBoard.style.gridTemplateColumns = `repeat(${cols}, 35px)`;
  gameBoard.style.gridTemplateRows = `repeat(${rows}, 35px)`;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = row;
      cell.dataset.col = col;

      // Left click to open cell
      cell.addEventListener("click", () => {
        if (!gameOver) {
          openCell(row, col);
          renderBoard();
        }
      });

      // Right click to toggle flag
      cell.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        if (!gameOver) {
          toggleFlag(row, col);
          renderBoard();
        }
      });

      gameBoard.appendChild(cell);
    }
  }

  renderBoard();
  console.log("Game started!");
  startTimer();
  updateBombCounter();  // Update bomb counter on game start
}

// Update the bomb counter in the status bar
function updateBombCounter() {
  const bombCounterElement = document.getElementById("bomb-counter");
  const bombTotalElement = document.getElementById("bomb-total");

  bombCounterElement.textContent = totalFlags;
  bombTotalElement.textContent = mines;  // Total bombs stay constant
}

// Win Condition Check
function checkWin() {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Check if any non-bomb cell is not revealed
      if (field[row][col] !== 'M' && !revealed[row][col]) {
        return false; // If any non-bomb cell is not revealed, the player has not won
      }
    }
  }
  return true; // All non-bomb cells are revealed, player wins
}

// Show "Game Over" message as a modal
function displayGameOverMessage() {
  const modal = document.getElementById("game-over-modal");
  const closeModalButton = document.getElementById("close-modal");
  const restartButton = document.getElementById("restart-button");

  modal.style.display = "flex";

  // Closes the modal
  closeModalButton.onclick = function() {
    modal.style.display = "none";
  }

  // Restart Button
  restartButton.onclick = function() {
    modal.style.display = "none";
    initializeGame(); // Restart the game
  }
}

// Show "You Win!" message as a modal
function displayWinMessage() {
  const modal = document.getElementById("game-win-modal");
  const closeModalButton = document.getElementById("close-win-modal");
  const restartButton = document.getElementById("restart-win-button");

  modal.style.display = "flex";

  // Closes the modal
  closeModalButton.onclick = function() {
    modal.style.display = "none";
  }

  // Restart Button
  restartButton.onclick = function() {
    modal.style.display = "none";
    initializeGame(); // Restart the game
  }
}


document.getElementById("startButton").addEventListener("click", () => {
  initializeGame();  // Initialize the game when the start button is clicked
});
