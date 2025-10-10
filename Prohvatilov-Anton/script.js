document.addEventListener("DOMContentLoaded", () => {
  let gameTimer = null;
  let gameTime = 0;
  let gameStarted = false;

  function createCell(hasMine = false, adjacentMines = 0, state = "closed") {
    return { hasMine, adjacentMines, state };
  }

  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1], [1, 0], [1, 1]
  ];

  let currentGame = null;

  function isValidCoordinate(field, row, col) {
    return row >= 0 && row < field.length && col >= 0 && col < field[0].length;
  }

  function forEachCell(field, callback) {
    for (let row = 0; row < field.length; row++) {
      for (let col = 0; col < field[0].length; col++) {
        callback(field[row][col], row, col);
      }
    }
  }

  function generateField(rows, cols, mines) {
    const field = [];
    
    for (let row = 0; row < rows; row++) {
      const boardRow = [];
      for (let col = 0; col < cols; col++) {
        boardRow.push(createCell());
      }
      field.push(boardRow);
    }
    
    let placedMines = 0;
    let attempts = 0;
    const maxAttempts = mines * 50; 
    
    while (placedMines < mines && attempts < maxAttempts) {
      const randomRow = Math.floor(Math.random() * rows);
      const randomCol = Math.floor(Math.random() * cols);
      
      if (!field[randomRow][randomCol].hasMine) {
        field[randomRow][randomCol].hasMine = true;

        let validPlacement = true;
        forEachCell(field, (cell, row, col) => {
          if (validPlacement && !cell.hasMine) {
            const adjacentCount = countNeighbourMines(field, row, col);
            if (adjacentCount > 3) {
              validPlacement = false;
            }
          }
        });
        
        if (validPlacement) {
          placedMines++;
        } else {
          field[randomRow][randomCol].hasMine = false;
        }
      }
      attempts++;
    }

    forEachCell(field, (cell, row, col) => {
      if (!cell.hasMine) {
        cell.adjacentMines = countNeighbourMines(field, row, col);
      }
    });
    
    console.log(`Generated field with ${placedMines}/${mines} mines (max 3 adjacent per cell):`, field);
    if (placedMines < mines) {
      console.warn(`Warning: Only ${placedMines} out of ${mines} mines placed due to adjacency constraint`);
    }
    return field;
  }

  function countNeighbourMines(field, row, col) {
    let count = 0;
    
    for (let [deltaRow, deltaCol] of directions) {
      const neighborRow = row + deltaRow;
      const neighborCol = col + deltaCol;
      
      if (isValidCoordinate(field, neighborRow, neighborCol) && field[neighborRow][neighborCol].hasMine) {
        count++;
      }
    }
    
    console.log(`Mines around cell (${row}, ${col}):`, count);
    return count;
  }

  function openCell(row, col) {
    if (!currentGame || currentGame.state !== "in_progress") {
      console.log("Game not active");
      return;
    }
    
    const cell = currentGame.board[row][col];
    if (cell.state !== "closed") {
      console.log("Cell already opened or flagged");
      return;
    }
    
    startTimer();
    
    if (cell.hasMine) {
      cell.state = "open";
      currentGame.state = "defeat";
      stopTimer();
      revealMines(currentGame);
      alert("💥 Ти програв!");
      console.log("Game Over! Hit a mine at", row, col);
      console.log("Game state:", currentGame.state);
    } else {
      floodOpen(currentGame, row, col);
      checkVictory(currentGame);
      console.log(`Opened cell (${row}, ${col}), adjacent mines:`, cell.adjacentMines);
      console.log("Current game state:", currentGame.state);
    }
  }


  function getFlaggedCount(board) {
    let flaggedCount = 0;
    forEachCell(board, (cell) => {
      if (cell.state === "flagged") {
        flaggedCount++;
      }
    });
    return flaggedCount;
  }

  function toggleFlag(row, col) {
    if (!currentGame || currentGame.state !== "in_progress") {
      console.log("Game not active");
      return;
    }
    
    const cell = currentGame.board[row][col];
    if (cell.state === "open") {
      console.log("Cannot flag opened cell");
      return;
    }
    
    if (cell.state === "closed") {
      const flaggedCount = getFlaggedCount(currentGame.board);
      
      if (flaggedCount >= currentGame.minesCount) {
        console.log("Maximum flags reached! Cannot place more flags.");
        return;
      }
      
      cell.state = "flagged";
      console.log(`Flagged cell (${row}, ${col}). isFlagged: true`);
    } else if (cell.state === "flagged") {
      cell.state = "closed";
      console.log(`Unflagged cell (${row}, ${col}). isFlagged: false`);
    }
    
    console.log("Current cell state:", cell.state);
  }

  function createGame(rows = 16, cols = 16, minesCount = 40) {
    const game = { rows, cols, minesCount, state: "in_progress", board: generateField(rows, cols, minesCount) };
    return game;
  }

  function startTimer() {
    if (!gameStarted) {
      gameStarted = true;
      gameTime = 0;
      gameTimer = setInterval(() => {
        gameTime++;
        updateTimer();
      }, 1000);
    }
  }

  function stopTimer() {
    if (gameTimer) {
      clearInterval(gameTimer);
      gameTimer = null;
    }
  }

  function updateTimer() {
    const timerElement = document.querySelector('.game-board-timer');
    const minutes = Math.floor(gameTime / 60);
    const seconds = gameTime % 60;
    timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function updateMineCounter(game) {
    const flaggedCount = getFlaggedCount(game.board);
    const remainingMines = game.minesCount - flaggedCount;
    const scoreElement = document.querySelector('.game-board-score');
    scoreElement.textContent = String(Math.max(0, remainingMines)).padStart(3, '0');
    if (remainingMines === 0) {
      scoreElement.classList.add('flags-empty');
    } else {
      scoreElement.classList.remove('flags-empty');
    }
  }

  function floodOpen(game, row, col) {
    const cell = game.board[row][col];
    if (cell.state !== "closed" || cell.hasMine) return;
    cell.state = "open";
    if (cell.adjacentMines === 0) {
      for (let [deltaRow, deltaCol] of directions) {
        const neighborRow = row + deltaRow, neighborCol = col + deltaCol;
        if (isValidCoordinate(game.board, neighborRow, neighborCol)) {
          floodOpen(game, neighborRow, neighborCol);
        }
      }
    }
  }

  function createCellElement(cellData, row, col, game) {
    const cellElement = document.createElement("div");
    cellElement.classList.add("game-board-cell");
    cellElement.textContent = "";

    if (cellData.state === "closed") {
      cellElement.classList.add("closed");
    } else if (cellData.state === "flagged") {
      cellElement.classList.add("flag");
    } else if (cellData.state === "open") {
      if (cellData.hasMine) {
        cellElement.classList.add("mine");
      } else if (cellData.adjacentMines > 0) {
        cellElement.classList.add(`number-${cellData.adjacentMines}`);
        cellElement.textContent = cellData.adjacentMines;
      } else {
        cellElement.classList.add("open");
      }
    }

    cellElement.addEventListener("click", () => {
      openCell(row, col);
      renderBoard(game);
    });

    cellElement.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      toggleFlag(row, col);
      updateMineCounter(game);
      renderBoard(game);
    });

    return cellElement;
  }

  function renderBoard(game) {
    const boardElement = document.querySelector('.game-board');
    boardElement.innerHTML = "";
    
    forEachCell(game.board, (cellData, row, col) => {
      const cellElement = createCellElement(cellData, row, col, game);
      boardElement.appendChild(cellElement);
    });
  }

  function revealMines(game) {
    forEachCell(game.board, (cell) => {
      if (cell.hasMine) {
        cell.state = "open";
      }
    });
  }

  function getClosedNonMineCells(board) {
    let closedNonMineCells = 0;
    forEachCell(board, (cell) => {
      if (!cell.hasMine && cell.state === "closed") {
        closedNonMineCells++;
      }
    });
    return closedNonMineCells;
  }

  function checkVictory(game) {
    const closedNonMineCells = getClosedNonMineCells(game.board);
    
    if (closedNonMineCells === 0) {
      game.state = "victory";
      stopTimer();
      alert("🎉 Перемога!");
    }
  }

  function initializeGame() {
    stopTimer();
    gameStarted = false;
    gameTime = 0;
    updateTimer();
    const game = createGame(16, 16, 40);
    currentGame = game;
    renderBoard(game);
    updateMineCounter(game);
    return game;
  }

  let gameInstance = initializeGame();

  document.querySelector(".game-board-button").addEventListener("click", () => {
    gameInstance = initializeGame();
  });
});
