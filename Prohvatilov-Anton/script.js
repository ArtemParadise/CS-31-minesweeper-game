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
    for (let r = 0; r < field.length; r++) {
      for (let c = 0; c < field[0].length; c++) {
        callback(field[r][c], r, c);
      }
    }
  }

  function generateField(rows, cols, mines) {
    const field = [];
    
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push(createCell());
      }
      field.push(row);
    }
    
    let placedMines = 0;
    let attempts = 0;
    const maxAttempts = mines * 50; 
    
    while (placedMines < mines && attempts < maxAttempts) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      
      if (!field[r][c].hasMine) {
        field[r][c].hasMine = true;

        let validPlacement = true;
        forEachCell(field, (cell, r, c) => {
          if (validPlacement && !cell.hasMine) {
            const adjacentCount = countNeighbourMines(field, r, c);
            if (adjacentCount > 3) {
              validPlacement = false;
            }
          }
        });
        
        if (validPlacement) {
          placedMines++;
        } else {
          field[r][c].hasMine = false;
        }
      }
      attempts++;
    }

    forEachCell(field, (cell, r, c) => {
      if (!cell.hasMine) {
        cell.adjacentMines = countNeighbourMines(field, r, c);
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
    
    for (let [dr, dc] of directions) {
      const nr = row + dr;
      const nc = col + dc;
      
      if (isValidCoordinate(field, nr, nc) && field[nr][nc].hasMine) {
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

  function floodOpen(game, r, c) {
    const cell = game.board[r][c];
    if (cell.state !== "closed" || cell.hasMine) return;
    cell.state = "open";
    if (cell.adjacentMines === 0) {
      for (let [dr, dc] of directions) {
        const nr = r + dr, nc = c + dc;
        if (isValidCoordinate(game.board, nr, nc)) {
          floodOpen(game, nr, nc);
        }
      }
    }
  }

  function createCellElement(cellData, r, c, game) {
    const cell = document.createElement("div");
    cell.classList.add("game-board-cell");
    cell.textContent = "";

    if (cellData.state === "closed") {
      cell.classList.add("closed");
    } else if (cellData.state === "flagged") {
      cell.classList.add("flag");
    } else if (cellData.state === "open") {
      if (cellData.hasMine) {
        cell.classList.add("mine");
      } else if (cellData.adjacentMines > 0) {
        cell.classList.add(`number-${cellData.adjacentMines}`);
        cell.textContent = cellData.adjacentMines;
      } else {
        cell.classList.add("open");
      }
    }

    cell.addEventListener("click", () => {
      openCell(r, c);
      renderBoard(game);
    });

    cell.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      toggleFlag(r, c);
      updateMineCounter(game);
      renderBoard(game);
    });

    return cell;
  }

  function renderBoard(game) {
    const board = document.querySelector('.game-board');
    board.innerHTML = "";
    
    forEachCell(game.board, (cellData, r, c) => {
      const cell = createCellElement(cellData, r, c, game);
      board.appendChild(cell);
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
    let closedCells = 0;
    forEachCell(board, (cell) => {
      if (!cell.hasMine && cell.state === "closed") {
        closedCells++;
      }
    });
    return closedCells;
  }

  function checkVictory(game) {
    const closedCells = getClosedNonMineCells(game.board);
    
    if (closedCells === 0) {
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

  let game = initializeGame();

  document.querySelector(".game-board-button").addEventListener("click", () => {
    game = initializeGame();
  });
});