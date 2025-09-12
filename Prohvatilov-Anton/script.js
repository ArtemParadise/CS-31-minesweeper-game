document.addEventListener("DOMContentLoaded", () => {
  const board = document.querySelector('.game-board');

  for (let i = 0; i < 256; i++) {
    const cell = document.createElement('div');
    cell.classList.add('game-board-cell');
    board.appendChild(cell);
  }
});
