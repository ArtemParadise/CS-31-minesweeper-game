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

    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) row.push(createCell());
      game.board.push(row);
    }

    function countAdjacentMines(r, c) {
      return directions.reduce((count, [dr, dc]) => {
        const nr = r + dr, nc = c + dc;
        return (nr >= 0 && nr < rows && nc >= 0 && nc < cols && game.board[nr][nc].hasMine) ? count + 1 : count;
      }, 0);
    }

    let placedMines = 0, attempts = 0;
    while (placedMines < minesCount && attempts < minesCount * 20) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      if (!game.board[r][c].hasMine) {
        game.board[r][c].hasMine = true;
        let valid = true;
        for (let rr = 0; rr < rows && valid; rr++) {
          for (let cc = 0; cc < cols; cc++) {
            if (!game.board[rr][cc].hasMine && countAdjacentMines(rr, cc) > 3) {
              valid = false;
              break;
            }
          }
        }
        if (valid) placedMines++; else game.board[r][c].hasMine = false;
      }
      attempts++;
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!game.board[r][c].hasMine) game.board[r][c].adjacentMines = countAdjacentMines(r, c);
      }
    }
    return game;
  }

  function floodOpen(game, r, c) {
    const cell = game.board[r][c];
    if (cell.state !== "closed" || cell.hasMine) return;
    cell.state = "open";
    if (cell.adjacentMines === 0) {
      for (let [dr, dc] of directions) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < game.rows && nc >= 0 && nc < game.cols) floodOpen(game, nr, nc);
      }
    }
  }

  function renderBoard(game) {
    const board = document.querySelector('.game-board');
    board.innerHTML = "";
    for (let r = 0; r < game.rows; r++) {
      for (let c = 0; c < game.cols; c++) {
        const cellData = game.board[r][c];
        const cell = document.createElement("div");
        cell.classList.add("game-board-cell");
        cell.textContent = "";

        if (cellData.state === "closed") {
          cell.classList.add("closed");
        } else if (cellData.state === "flagged") {
          cell.classList.add("flagged");
          cell.textContent = "🚩";
        } else if (cellData.state === "open") {
          if (cellData.hasMine) {
            cell.classList.add("mine");
            cell.textContent = "💣";
          } else if (cellData.adjacentMines > 0) {
            cell.classList.add(`number-${cellData.adjacentMines}`);
            cell.textContent = cellData.adjacentMines;
          } else {
            cell.classList.add("open");
          }
        }

        cell.addEventListener("click", () => {
          if (game.state !== "in_progress") return;
          if (cellData.hasMine) {
            cellData.state = "open";
            game.state = "defeat";
            revealMines(game);
            alert("💥 Ти програв!");
          } else {
            floodOpen(game, r, c);
            checkVictory(game);
          }
          renderBoard(game);
        });

        cell.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          if (game.state !== "in_progress") return;
          cellData.state = cellData.state === "closed" ? "flagged" : cellData.state === "flagged" ? "closed" : cellData.state;
          renderBoard(game);
        });

        board.appendChild(cell);
      }
    }
  }

  function revealMines(game) {
    for (let r = 0; r < game.rows; r++) {
      for (let c = 0; c < game.cols; c++) {
        if (game.board[r][c].hasMine) game.board[r][c].state = "open";
      }
    }
  }

  function checkVictory(game) {
    let closedCells = 0;
    for (let r = 0; r < game.rows; r++) {
      for (let c = 0; c < game.cols; c++) {
        if (!game.board[r][c].hasMine && game.board[r][c].state === "closed") closedCells++;
      }
    }
    if (closedCells === 0) {
      game.state = "victory";
      alert("🎉 Перемога!");
    }
  }

  let game = createGame(16, 16, 40);
  renderBoard(game);

  document.querySelector(".game-board-button").addEventListener("click", () => {
    game = createGame(16, 16, 40);
    renderBoard(game);
  });
});
