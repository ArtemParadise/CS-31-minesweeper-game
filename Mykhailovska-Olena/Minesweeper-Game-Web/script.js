class Cell {
    constructor() {
        this.hasMine = false; // Есть ли мина в клетке
        this.neighborMines = 0; // Количество мин вокруг
        this.state = "closed"; // Состояние клетки: "closed" (закрыта), "open" (открыта), "flagged" (помечена флагом)
    }
}

class GameState {
    constructor(boardSize, mineCount) {
        this.boardSize = boardSize; // Размер игрового поля
        this.mineCount = mineCount; // Количество мин
        this.currentState = "inProgress"; // Текущее состояние игры: "inProgress" (в процессе), "won" (выиграна), "lost" (проиграна)
    }
}

const game = {
    board: [], // Игровое поле
    gameState: null, // Состояние игры
};

const scaleSlider = document.getElementById('scale');
const body = document.body;

// Функция обновляет фон с градиентом в зависимости от значения ползунка
function updateBackgroundGradient() {
  const percentage = scaleSlider.value * 10 - 5; // Предполагается диапазон от 1 до 10. Если поменяешь min/max – нужно изменить формулу.
  scaleSlider.style.background = `linear-gradient(to right, black ${percentage}%, white ${percentage}%)`;
}

// Первоначальное обновление при загрузке страницы
updateBackgroundGradient();

// Обновление при изменении значения ползунка
scaleSlider.addEventListener('input', updateBackgroundGradient);


const selectBtn = document.querySelector('.select-btn');
const options = document.querySelector('.options');
const selected = document.querySelector('.selected');
const optionItems = document.querySelectorAll('.options li');

// Открытие/закрытие выпадающего списка при клике на кнопку
selectBtn.addEventListener('click', () => {
  options.style.display = options.style.display === 'block' ? 'none' : 'block';
});

// Обработка клика по пункту списка
optionItems.forEach(option => {
  option.addEventListener('click', () => {
    optionItems.forEach(o => o.classList.remove('active')); // Убираем подсветку со всех пунктов
    option.classList.add('active'); // Подсвечиваем выбранный пункт
    selected.textContent = option.textContent; // Отображаем текст выбранного пункта
    options.style.display = 'none'; // Закрываем список
  });
});

// Закрытие списка, если клик был вне области селекта
document.addEventListener('click', (e) => {
  if (!document.querySelector('.difficulty-select').contains(e.target)) {
    options.style.display = 'none';
  }
});

// Инициализация примера игрового поля
function initializeGameBoard(boardSize, mineCount) {
    const board = [];
    for (let i = 0; i < boardSize; i++) {
        const row = [];
        for (let j = 0; j < boardSize; j++) {
            row.push(new Cell()); // Создаем клетку
        }
        board.push(row); // Добавляем ряд в поле
    }

    // Размещение мин случайным образом (для примера размещаем вручную)
    board[0][0].hasMine = true;
    board[1][1].hasMine = true;
    board[2][3].hasMine = true;

    // Подсчет мин вокруг (для примера задаем вручную)
    board[0][1].neighborMines = 1;
    board[1][0].neighborMines = 1;
    board[1][2].neighborMines = 2;

    // Задаем некоторые начальные состояния клеток
    board[0][2].state = "open"; // Открытая клетка
    board[2][2].state = "flagged"; // Клетка с флагом

    game.board = board; // Сохраняем поле в объект игры
    game.gameState = new GameState(boardSize, mineCount); // Создаем состояние игры
}

initializeGameBoard(5, 3); // Пример: поле 5x5 с 3 минами
