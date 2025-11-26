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
    optionItems.forEach(o => o.classList.remove('active')); // Убираем подсветку со всех
    option.classList.add('active'); // Добавляем подсветку выбранному
    selected.textContent = option.textContent; // Выводим текст выбранного пункта
    options.style.display = 'none'; // Закрываем список
  });
});

// Закрытие списка, если клик был вне области селекта
document.addEventListener('click', (e) => {
  if (!document.querySelector('.difficulty-select').contains(e.target)) {
    options.style.display = 'none';
  }
});
