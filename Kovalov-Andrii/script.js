function createCell(hasMine = false) {
  return {
    hasMine: hasMine,          // чи є міна
    neighborMines: 0,          // кількість сусідніх мін
    state: "closed"            // "closed", "open", "flag"
  };
}

function createGame(rows, cols, mines) {
  return {
    rows,
    cols,
    mines,
    status: "playing", // "playing", "win", "lose"
    field: []
  };
}

// ==== 3. Ініціалізація тестової гри ====
function initGame(rows = 10, cols = 10, mines = 15) {
  const game = createGame(rows, cols, mines);

  // створюємо поле
  for (let r = 0; r < rows; r++) {
    game.field[r] = [];
    for (let c = 0; c < cols; c++) {
      game.field[r][c] = createCell();
    }
  }

  // розставляємо міни випадково
  let placed = 0;
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!game.field[r][c].hasMine) {
      game.field[r][c].hasMine = true;
      placed++;
    }
  }

  // рахуємо кількість сусідніх мін
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!game.field[r][c].hasMine) {
        game.field[r][c].neighborMines = countNeighborMines(game, r, c);
      }
    }
  }

  return game;
}

function countNeighborMines(game, row, col) {
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < game.rows && nc >= 0 && nc < game.cols) {
        if (game.field[nr][nc].hasMine) count++;
      }
    }
  }
  return count;
}

function renderGame(game) {
  const grid = document.querySelector(".grid");
  grid.innerHTML = ""; 

  for (let r = 0; r < game.rows; r++) {
    for (let c = 0; c < game.cols; c++) {
      const cell = game.field[r][c];
      const div = document.createElement("div");
      div.classList.add("cell", cell.state);

      if (cell.state === "open") {
        if (cell.hasMine) {
          div.classList.add("mine");
        } else if (cell.neighborMines > 0) {
          div.textContent = cell.neighborMines;
        }
      }

      if (cell.state === "flag") {
        div.classList.add("flag");
      }

      grid.appendChild(div);
    }
  }
}

const testGame = initGame(10, 10, 20);
renderGame(testGame);
console.log(testGame);
