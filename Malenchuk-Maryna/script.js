document.addEventListener('DOMContentLoaded', () => {
  // === ЕЛЕМЕНТИ UI ===
  const boardEl      = document.getElementById('board');
  const btnStart     = document.getElementById('start');
  const btnTheme     = document.getElementById('theme');
  const flagsEl      = document.getElementById('flags');
  const timerEl      = document.getElementById('timer');
  const bestEl       = document.getElementById('best');
  const modal        = document.getElementById('modal');
  const modalText    = document.getElementById('modal-text');

  const difficultySel = document.getElementById('difficulty');
  const customWrap    = document.getElementById('custom-controls');
  const widthInput    = document.getElementById('width');
  const heightInput   = document.getElementById('height');
  const minesInput    = document.getElementById('mines');

  // === СТАН ГРИ ===
  // За замовчуванням Medium
  let gridWidth  = 16;
  let gridHeight = 16;
  let mineCount  = 40;

  /** Структура осередку: { isMine:boolean, isOpen:boolean, hasFlag:boolean, neighborMines:number } */
  let grid = [];                 // логічна модель поля
  let cellButtons = [];          // DOM-вузли клітинок
  let isFirstClickDone = false;
  let isGameOver = false;
  let placedFlags = 0;

  let elapsedSeconds = 0;
  let timerIntervalId = null;

  // === КЛЮЧІ/СЕРВІСИ ДЛЯ РЕКОРДІВ ===
  const bestResultKey = () => `ms-best-${gridWidth}x${gridHeight}-${mineCount}`;

  // === ДОПОМІЖНІ ФУНКЦІЇ ===
  const pad2 = (num) => String(num).padStart(2, '0');

  const updateFlagsLeftDisplay = () => {
    flagsEl.textContent = String(mineCount - placedFlags).padStart(3, '0');
  };

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${pad2(minutes)}:${pad2(seconds)}`;
  };

  const updateTimerDisplay = (totalSeconds) => {
    timerEl.textContent = formatTime(totalSeconds);
  };

  const startTimer = () => {
    clearInterval(timerIntervalId);
    timerIntervalId = setInterval(() => {
      elapsedSeconds += 1;
      updateTimerDisplay(elapsedSeconds);
    }, 1000);
  };

  const stopTimer = () => clearInterval(timerIntervalId);

  const showBestResult = () => {
    const stored = localStorage.getItem(bestResultKey());
    bestEl.textContent = stored ? formatTime(+stored) : '—';
  };

  /** Обмежити значення в діапазоні */
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  // === СКЛАДНІСТЬ ===
  function applyDifficulty() {
    const difficulty = difficultySel.value;

    if (difficulty === 'easy') {
      gridWidth = 9; gridHeight = 9; mineCount = 10;
      customWrap.classList.add('hidden');
    } else if (difficulty === 'medium') {
      gridWidth = 16; gridHeight = 16; mineCount = 40;
      customWrap.classList.add('hidden');
    } else if (difficulty === 'hard') {
      gridWidth = 30; gridHeight = 16; mineCount = 99;
      customWrap.classList.add('hidden');
    } else {
      // custom
      customWrap.classList.remove('hidden');
      gridWidth  = clamp(+widthInput.value  || 10, 5, 40);
      gridHeight = clamp(+heightInput.value || 10, 5, 30);

      const maxMines = Math.max(1, gridWidth * gridHeight - 1);
      mineCount = clamp(+minesInput.value || 15, 1, maxMines);
      minesInput.max = String(maxMines);
    }
  }

  difficultySel.addEventListener('change', () => { applyDifficulty(); newGame(); });
  [widthInput, heightInput, minesInput].forEach((inputEl) => {
    inputEl.addEventListener('input', () => {
      if (difficultySel.value === 'custom') {
        applyDifficulty();
        newGame();
      }
    });
  });

  // === ІНДЕКСАЦІЯ ТА СУСІДИ ===
  const indexFromRowCol = (row, col) => row * gridWidth + col;

  const isInBounds = (row, col) =>
    row >= 0 && row < gridHeight && col >= 0 && col < gridWidth;

  /** Повертає одномірні індекси всіх сусідів клітинки */
  function getNeighborIndices(cellIndex) {
    const row = Math.floor(cellIndex / gridWidth);
    const col = cellIndex % gridWidth;

    const neighbors = [];
    for (let dRow = -1; dRow <= 1; dRow += 1) {
      for (let dCol = -1; dCol <= 1; dCol += 1) {
        if (dRow === 0 && dCol === 0) continue;
        const nRow = row + dRow;
        const nCol = col + dCol;
        if (isInBounds(nRow, nCol)) neighbors.push(indexFromRowCol(nRow, nCol));
      }
    }
    return neighbors;
  }

  // === ПОБУДОВА ПОЛЯ ===
  function initEmptyGrid() {
    const totalCells = gridWidth * gridHeight;
    grid = Array.from({ length: totalCells }, () => ({
      isMine: false,
      isOpen: false,
      hasFlag: false,
      neighborMines: 0,
    }));
  }

  function placeMines(excludedIndex) {
    // Забороняємо міну на першій клітинці та в її сусідах — кращий UX
    const forbidden = new Set([excludedIndex, ...getNeighborIndices(excludedIndex)]);
    let placed = 0;

    while (placed < mineCount) {
      const candidate = Math.floor(Math.random() * grid.length);
      if (forbidden.has(candidate) || grid[candidate].isMine) continue;
      grid[candidate].isMine = true;
      placed += 1;
    }

    // Підрахунок чисел для немінних клітинок
    for (let i = 0; i < grid.length; i += 1) {
      if (grid[i].isMine) {
        grid[i].neighborMines = 0;
        continue;
      }
      const minesAround = getNeighborIndices(i)
        .reduce((acc, j) => acc + (grid[j].isMine ? 1 : 0), 0);
      grid[i].neighborMines = minesAround;
    }
  }

  function renderBoard() {
    boardEl.innerHTML = '';
    boardEl.style.setProperty('--cols', String(gridWidth));

    cellButtons = grid.map((cellState, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cell closed';
      btn.setAttribute('role', 'gridcell');
      btn.setAttribute('aria-label', 'Закрита клітинка');
      btn.dataset.i = String(i);

      // Клац миші
      btn.addEventListener('click', onLeftClick);
      // Контекстне меню → прапорець
      btn.addEventListener('contextmenu', (e) => { e.preventDefault(); toggleFlag(i); });
      // Довгий тап (мобільні) → прапорець
      attachLongPress(btn, () => toggleFlag(i));
      // Клавіатура
      btn.addEventListener('keydown', (e) => onCellKey(e, i));

      boardEl.appendChild(btn);
      return btn;
    });
  }

  function attachLongPress(element, callback) {
    let timeoutId;
    const thresholdMs = 400;
    element.addEventListener('touchstart', () => { timeoutId = setTimeout(callback, thresholdMs); }, { passive: true });
    element.addEventListener('touchend', () => clearTimeout(timeoutId));
    element.addEventListener('touchmove', () => clearTimeout(timeoutId));
  }

  // === ІГРОВА ЛОГІКА ===
  function openCell(cellIndex, openedByChord = false) {
    const cellState = grid[cellIndex];
    const cellBtn = cellButtons[cellIndex];
    if (cellState.isOpen || cellState.hasFlag || isGameOver) return;

    // Перший хід — безпечний: саме тут розміщуємо міни
    if (!isFirstClickDone) {
      isFirstClickDone = true;
      placeMines(cellIndex);
      startTimer();
    }

    cellState.isOpen = true;
    cellBtn.classList.remove('closed');
    cellBtn.classList.add('open');

    if (cellState.isMine) {
      cellBtn.classList.add('mine', 'exploded', 'revealed');
      cellBtn.setAttribute('aria-label', 'Міна');
      endGame(false, cellIndex);
      return;
    }

    if (cellState.neighborMines > 0) {
      cellBtn.textContent = String(cellState.neighborMines);
      cellBtn.classList.add(`num-${cellState.neighborMines}`);
      cellBtn.setAttribute('aria-label', `Цифра ${cellState.neighborMines}`);
    } else {
      cellBtn.setAttribute('aria-label', 'Порожньо');
      // Розкриття порожніх клітинок (BFS)
      const queue = [cellIndex];
      while (queue.length) {
        const current = queue.shift();
        getNeighborIndices(current).forEach((neighborIdx) => {
          const nState = grid[neighborIdx];
          if (nState.isOpen || nState.hasFlag || nState.isMine) return;

          nState.isOpen = true;
          const nBtn = cellButtons[neighborIdx];
          nBtn.classList.remove('closed');
          nBtn.classList.add('open');

          if (nState.neighborMines > 0) {
            nBtn.textContent = String(nState.neighborMines);
            nBtn.classList.add(`num-${nState.neighborMines}`);
            nBtn.setAttribute('aria-label', `Цифра ${nState.neighborMines}`);
          } else {
            nBtn.setAttribute('aria-label', 'Порожньо');
            queue.push(neighborIdx);
          }
        });
      }
    }

    // Якщо відкривали «акордом», додаткова логіка вже відпрацьована в onChordClick
    if (!openedByChord) checkWin();
    else checkWin();
  }

  function toggleFlag(cellIndex) {
    if (isGameOver) return;
    const cellState = grid[cellIndex];
    if (cellState.isOpen) return;

    cellState.hasFlag = !cellState.hasFlag;
    cellButtons[cellIndex].classList.toggle('flag', cellState.hasFlag);
    cellButtons[cellIndex].setAttribute('aria-label', cellState.hasFlag ? 'Прапорець' : 'Закрита клітинка');

    placedFlags += cellState.hasFlag ? 1 : -1;
    updateFlagsLeftDisplay();
  }

  function onLeftClick(event) {
    const cellIndex = +event.currentTarget.dataset.i;
    const cellState = grid[cellIndex];

    // «Акорд»: клік по відкритій цифрі — якщо прапорців довкола стільки ж, як число, відкриваємо сусідів
    if (cellState.isOpen && !cellState.isMine && cellState.neighborMines > 0) {
      onChordClick(cellIndex);
      return;
    }

    openCell(cellIndex);
  }

  function onChordClick(centerIndex) {
    const neighbors = getNeighborIndices(centerIndex);
    const flagsAround = neighbors.filter((idx) => grid[idx].hasFlag).length;
    if (flagsAround !== grid[centerIndex].neighborMines) return;

    neighbors.forEach((idx) => {
      if (!grid[idx].hasFlag && !grid[idx].isOpen) {
        openCell(idx, true);
      }
    });
  }

  function revealAllMines(explodedIndex) {
    grid.forEach((cellState, i) => {
      if (!cellState.isMine) return;
      const btn = cellButtons[i];
      btn.classList.add('mine', 'revealed');
      if (i === explodedIndex) btn.classList.add('exploded');
    });
  }

  function checkWin() {
    const totalSafeCells = gridWidth * gridHeight - mineCount;
    const openedSafeCells = grid.reduce(
      (sum, c) => sum + (c.isOpen && !c.isMine ? 1 : 0),
      0,
    );
    if (openedSafeCells === totalSafeCells) endGame(true);
  }

  function endGame(isWin, explodedIndex = -1) {
    isGameOver = true;
    stopTimer();

    if (!isWin) {
      revealAllMines(explodedIndex);
      modalText.textContent = `💥 Програш! Ви натрапили на міну. Час: ${formatTime(elapsedSeconds)}`;
      modal.showModal();
      btnStart.textContent = '😵 Заново';
      return;
    }

    // Перемога — оновити рекорд
    const key = bestResultKey();
    const prev = localStorage.getItem(key);
    if (prev === null || +prev > elapsedSeconds) {
      localStorage.setItem(key, String(elapsedSeconds));
    }
    showBestResult();

    modalText.textContent = `🎉 Перемога! Час: ${formatTime(elapsedSeconds)}`;
    modal.showModal();
    btnStart.textContent = '🏆 Ще раз';
  }

  // === КЛАВІАТУРА ===
  function onCellKey(e, cellIndex) {
    const row = Math.floor(cellIndex / gridWidth);
    const col = cellIndex % gridWidth;

    let nextIndex = cellIndex;

    if (e.key === 'ArrowLeft')       nextIndex = indexFromRowCol(row, Math.max(0, col - 1));
    else if (e.key === 'ArrowRight') nextIndex = indexFromRowCol(row, Math.min(gridWidth - 1, col + 1));
    else if (e.key === 'ArrowUp')    nextIndex = indexFromRowCol(Math.max(0, row - 1), col);
    else if (e.key === 'ArrowDown')  nextIndex = indexFromRowCol(Math.min(gridHeight - 1, row + 1), col);
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onLeftClick({ currentTarget: cellButtons[cellIndex] });
      return;
    } else if (e.key.toLowerCase() === 'f') {
      e.preventDefault();
      toggleFlag(cellIndex);
      return;
    }

    if (nextIndex !== cellIndex) cellButtons[nextIndex].focus();
  }

  // === НОВА ГРА ===
  function newGame() {
    elapsedSeconds = 0;
    updateTimerDisplay(0);

    placedFlags = 0;
    updateFlagsLeftDisplay();

    stopTimer();
    isFirstClickDone = false;
    isGameOver = false;
    btnStart.textContent = '🙂 Нова гра';

    initEmptyGrid();
    renderBoard();
    showBestResult();
  }

  // === ТЕМА ===
  btnTheme.addEventListener('click', () => {
    const root = document.documentElement;
    const isDark = root.classList.toggle('dark');
    localStorage.setItem('ms-theme', isDark ? 'dark' : 'light');
  });

  // Ініціалізація теми
  if (localStorage.getItem('ms-theme') === 'dark') {
    document.documentElement.classList.add('dark');
  }

  // === ЗАПУСК ===
  applyDifficulty();
  newGame();

  btnStart.addEventListener('click', newGame);

  // Доступність: фокус на полі після кліку
  boardEl.addEventListener('click', () => boardEl.focus(), { capture: true });

  // Вимкнути нативне контекстне меню на полі
  boardEl.addEventListener('contextmenu', (e) => e.preventDefault());
});
