// script.js

document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.querySelector('.start-button');
  const flagsLeftElement = document.querySelector('.game-board-header__flags_left');
  const timerElement = document.querySelector('.game-board-header__timer');
  const cells = document.querySelectorAll('.game-board__cell');

  let flagsLeft = 7; 
  let seconds = 0;
  let timerInterval;

  // Запуск таймера
  function startTimer() {
    clearInterval(timerInterval);
    seconds = 0;
    timerElement.textContent = '00:00';
    timerInterval = setInterval(() => {
      seconds++;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      timerElement.textContent = 
        `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }, 1000);
  }

  // Кнопка Start
  startButton.addEventListener('click', () => {
    flagsLeft = 7;
    flagsLeftElement.textContent = String(flagsLeft).padStart(3, '0');
    startTimer();
  });

  // Клік по клітинці
  cells.forEach(cell => {
    cell.addEventListener('click', () => {
      cell.classList.toggle('open-cell'); // просто візуально відкриває/закриває
    });
  });
});
