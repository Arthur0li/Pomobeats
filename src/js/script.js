const screens = document.querySelectorAll(".screen");
const modeButtons = document.querySelectorAll(".mini-card");
const miniCards = document.querySelectorAll(".mini-card");

function showScreen(screenName) {
  screens.forEach((screen) => {
    screen.classList.remove("is-active");
  });

  const targetScreen = document.querySelector(
    `.screen[data-screen="${screenName}"]`
  );

  if (targetScreen) {
    targetScreen.classList.add("is-active");
  }

  miniCards.forEach((card) => {
    card.classList.remove("mini-card--active");
  });

  const activeButton = document.querySelector(
    `.mini-card[data-target="${screenName}"]`
  );

  if (activeButton) {
    activeButton.classList.add("mini-card--active");
  }
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.target;
    showScreen(target);
  });
});