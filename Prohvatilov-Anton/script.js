document.addEventListener("DOMContentLoaded", () => {
  const board = document.querySelector('.game-board');
  board.innerHTML = ""; 

  const states = [
    'closed',
    'open',
    'flag-mine',
    'flag',
    'mine',
    'mine-clicked',
    'number-1',
    'number-2',
    'number-3'
  ];

  for (let i = 0; i < 256; i++) {
    const cell = document.createElement('div');
    cell.classList.add('game-board-cell');

    const randomState = states[Math.floor(Math.random() * states.length)];
    cell.classList.add(randomState);

    if (randomState.startsWith('number-')) {
      cell.textContent = randomState.split('-')[1];
    }

    board.appendChild(cell);
  }
});