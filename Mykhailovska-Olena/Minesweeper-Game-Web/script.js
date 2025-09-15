const scaleSlider = document.getElementById('scale');
const body = document.body;

function updateBackgroundGradient() {
  const percentage = scaleSlider.value * 10 -5; // Assuming min 1, max 10. Adjust multiplier if min/max change.
  scaleSlider.style.background = `linear-gradient(to right, black ${percentage}%, white ${percentage}%)`;
}

// Initial update when the page loads
updateBackgroundGradient();

// Update when the slider value changes
scaleSlider.addEventListener('input', updateBackgroundGradient);


const selectBtn = document.querySelector('.select-btn');
const options = document.querySelector('.options');
const selected = document.querySelector('.selected');
const optionItems = document.querySelectorAll('.options li');

selectBtn.addEventListener('click', () => {
  options.style.display = options.style.display === 'block' ? 'none' : 'block';
});

optionItems.forEach(option => {
  option.addEventListener('click', () => {
    optionItems.forEach(o => o.classList.remove('active'));
    option.classList.add('active');
    selected.textContent = option.textContent;
    options.style.display = 'none';
  });
});

// Чтобы закрывать меню, если клик вне селекта
document.addEventListener('click', (e) => {
  if (!document.querySelector('.difficulty-select').contains(e.target)) {
    options.style.display = 'none';
  }
});
