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
  for (let row = 0; row < rows; row++) {
    game.field[row] = [];
    for (let col = 0; col < cols; col++) {
      game.field[row][col] = createCell();
    }
  }

  // розставляємо міни випадково
  let placed = 0;
  while (placed < mines) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    if (!game.field[row][col].hasMine) {
      game.field[row][col].hasMine = true;
      placed++;
    }
  }

  // рахуємо кількість сусідніх мін
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!game.field[row][col].hasMine) {
        game.field[row][col].neighborMines = countNeighborMines(game, row, col);
      }
    }
  }

  return game;
}

function countNeighborMines(game, row, col) {
  let count = 0;
  for (let dRow = -1; dRow <= 1; dRow++) {
    for (let dCol = -1; dCol <= 1; dCol++) {
      if (dRow === 0 && dCol === 0) continue;
      const neighborRow = row + dRow;
      const neighborCol = col + dCol;
      if (neighborRow >= 0 && neighborRow < game.rows && neighborCol >= 0 && neighborCol < game.cols) {
        if (game.field[neighborRow][neighborCol].hasMine) count++;
      }
    }
  }
  return count;
}

function renderGame(game) {
  const grid = document.querySelector(".grid");
  grid.innerHTML = ""; 

  for (let row = 0; row < game.rows; row++) {
    for (let col = 0; col < game.cols; col++) {
      const cell = game.field[row][col];
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
