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