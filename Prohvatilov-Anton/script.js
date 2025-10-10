document.addEventListener("DOMContentLoaded", () => {
  function createCell(hasMine = false, adjacentMines = 0, state = "closed") {
    return { hasMine, adjacentMines, state };
  }

  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1], [1, 0], [1, 1]
  ];

  function createGame(rows = 16, cols = 16, minesCount = 40) {
    const game = { rows, cols, minesCount, state: "in_progress", board: [] };

    for (let row = 0; row < rows; row++) {
      const boardRow = [];
      for (let col = 0; col < cols; col++) boardRow.push(createCell());
      game.board.push(boardRow);
    }

    function countAdjacentMines(row, col) {
      return directions.reduce((count, [deltaRow, deltaCol]) => {
        const newRow = row + deltaRow, newCol = col + deltaCol;
        return (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols && game.board[newRow][newCol].hasMine) ? count + 1 : count;
      }, 0);
    }

    let placedMines = 0, attempts = 0;
    while (placedMines < minesCount && attempts < minesCount * 20) {
      const randomRow = Math.floor(Math.random() * rows);
      const randomCol = Math.floor(Math.random() * cols);
      if (!game.board[randomRow][randomCol].hasMine) {
        game.board[randomRow][randomCol].hasMine = true;
        let isValidPlacement = true;
        for (let checkRow = 0; checkRow < rows && isValidPlacement; checkRow++) {
          for (let checkCol = 0; checkCol < cols; checkCol++) {
            if (!game.board[checkRow][checkCol].hasMine && countAdjacentMines(checkRow, checkCol) > 3) {
              isValidPlacement = false;
              break;
            }
          }
        }
        if (isValidPlacement) placedMines++; else game.board[randomRow][randomCol].hasMine = false;
      }
      attempts++;
    }

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!game.board[row][col].hasMine) game.board[row][col].adjacentMines = countAdjacentMines(row, col);
      }
    }
    return game;
  }

  function floodOpen(game, row, col) {
    const cell = game.board[row][col];
    if (cell.state !== "closed" || cell.hasMine) return;
    cell.state = "open";
    if (cell.adjacentMines === 0) {
      for (let [deltaRow, deltaCol] of directions) {
        const newRow = row + deltaRow, newCol = col + deltaCol;
        if (newRow >= 0 && newRow < game.rows && newCol >= 0 && newCol < game.cols) floodOpen(game, newRow, newCol);
      }
    }
  }

  function renderBoard(game) {
    const boardElement = document.querySelector('.game-board');
    boardElement.innerHTML = "";
    for (let row = 0; row < game.rows; row++) {
      for (let col = 0; col < game.cols; col++) {
        const cellData = game.board[row][col];
        const cellElement = document.createElement("div");
        cellElement.classList.add("game-board-cell");
        cellElement.textContent = "";

        if (cellData.state === "closed") {
          cellElement.classList.add("closed");
        } else if (cellData.state === "flagged") {
          cellElement.classList.add("flagged");
          cellElement.textContent = "🚩";
        } else if (cellData.state === "open") {
          if (cellData.hasMine) {
            cellElement.classList.add("mine");
            cellElement.textContent = "💣";
          } else if (cellData.adjacentMines > 0) {
            cellElement.classList.add(`number-${cellData.adjacentMines}`);
            cellElement.textContent = cellData.adjacentMines;
          } else {
            cellElement.classList.add("open");
          }
        }

        cellElement.addEventListener("click", () => {
          if (game.state !== "in_progress") return;
          if (cellData.hasMine) {
            cellData.state = "open";
            game.state = "defeat";
            revealMines(game);
            alert("💥 Ти програв!");
          } else {
            floodOpen(game, row, col);
            checkVictory(game);
          }
          renderBoard(game);
        });

        cellElement.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          if (game.state !== "in_progress") return;
          cellData.state = cellData.state === "closed" ? "flagged" : cellData.state === "flagged" ? "closed" : cellData.state;
          renderBoard(game);
        });

        boardElement.appendChild(cellElement);
      }
    }
  }

  function revealMines(game) {
    for (let row = 0; row < game.rows; row++) {
      for (let col = 0; col < game.cols; col++) {
        if (game.board[row][col].hasMine) game.board[row][col].state = "open";
      }
    }
  }

  function checkVictory(game) {
    let closedNonMineCells = 0;
    for (let row = 0; row < game.rows; row++) {
      for (let col = 0; col < game.cols; col++) {
        if (!game.board[row][col].hasMine && game.board[row][col].state === "closed") closedNonMineCells++;
      }
    }
    if (closedNonMineCells === 0) {
      game.state = "victory";
      alert("🎉 Перемога!");
    }
  }

  let currentGame = createGame(16, 16, 40);
  renderBoard(currentGame);

  document.querySelector(".game-board-button").addEventListener("click", () => {
    currentGame = createGame(16, 16, 40);
    renderBoard(currentGame);
  });
});
