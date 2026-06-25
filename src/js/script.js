document.addEventListener("DOMContentLoaded", () => {
  const screens = document.querySelectorAll(".screen");
  const tabButtons = document.querySelectorAll(".mini-card[data-target]");
  const startButtons = document.querySelectorAll(
    '.screen:not([data-screen="cycles"]) .action-btn--start'
  );
  const alarmSound = new Audio("src/music/alarm.mp3");
  alarmSound.preload = "auto";

  function playAlarm() {
    alarmSound.currentTime = 0;
    alarmSound.play().catch(() => {
      console.log("Não foi possível tocar o alarme.");
    });
  }
  const skipButtons = document.querySelectorAll(
    '.screen:not([data-screen="cycles"]) .action-btn--skip'
  );

  const saveSettingsButton = document.querySelector(
    '.screen[data-screen="cycles"] .action-btn--start'
  );
  const resetSettingsButton = document.querySelector(
    '.screen[data-screen="cycles"] .action-btn--skip'
  );

  const timeElements = {
    focus: document.querySelector('.screen[data-screen="focus"] time'),
    "short-break": document.querySelector('.screen[data-screen="short-break"] time'),
    "long-break": document.querySelector('.screen[data-screen="long-break"] time'),
  };

  const miniCardLabels = {
    focus: document.querySelector('.mini-card[data-target="focus"] span'),
    "short-break": document.querySelector('.mini-card[data-target="short-break"] span'),
    "long-break": document.querySelector('.mini-card[data-target="long-break"] span'),
    cycles: document.querySelector('.mini-card[data-target="cycles"] span'),
  };

  const cycleInputs = {
    focus: document.getElementById("pomodoro-time"),
    short: document.getElementById("short-time"),
    long: document.getElementById("long-time"),
    interval: document.getElementById("long-interval"),
  };

  const cyclesSummaryList = document.querySelector(".cycles-info ul");

  const initialDurations = {
    focus: 25 * 60,
    "short-break": 5 * 60,
    "long-break": 15 * 60,
  };

  let currentDurations = { ...initialDurations };
  let longBreakInterval = 4;

  let currentMode = "focus";
  let remainingSeconds = currentDurations[currentMode];
  let timerInterval = null;
  let isRunning = false;
  let completedFocusSessions = 0;

  function requestNotificationPermission() {
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
        Notification.requestPermission();
    }
    }

  function showNotification(mode) {
    if (!("Notification" in window)) return;

    if (Notification.permission !== "granted") return;

    const notifications = {
    focus: {
        title: "Focus Session Complete!",
        body: "Time for a short break ☕",
    },
    "short-break": {
        title: "Short Break Complete!",
        body: "Time to get back to work 🎯",
    },
    "long-break": {
        title: "Long Break Complete!",
        body: "Ready to focus again? 🚀",
    },
    };

    const notification = new Notification(
        notifications[mode].title,
        {
        body: notifications[mode].body,
        icon: "./assets/images/logo.png", // opcional
        }
    );

    notification.onclick = () => {
        window.focus();
    };
    }

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function updateDisplay(mode, seconds) {
    const timeElement = timeElements[mode];
    if (timeElement) {
      timeElement.textContent = formatTime(seconds);
    }
  }

  function syncAllDisplays() {
    updateDisplay("focus", currentDurations.focus);
    updateDisplay("short-break", currentDurations["short-break"]);
    updateDisplay("long-break", currentDurations["long-break"]);
  }

  function updateMiniCardLabels() {
    if (miniCardLabels.focus) {
      miniCardLabels.focus.textContent = `${currentDurations.focus / 60} min`;
    }

    if (miniCardLabels["short-break"]) {
      miniCardLabels["short-break"].textContent = `${currentDurations["short-break"] / 60} min`;
    }

    if (miniCardLabels["long-break"]) {
      miniCardLabels["long-break"].textContent = `${currentDurations["long-break"] / 60} min`;
    }

    if (miniCardLabels.cycles) {
      miniCardLabels.cycles.textContent = `${longBreakInterval} cycles`;
    }
  }

  function updateCyclesSummary() {
    if (!cyclesSummaryList) return;

    cyclesSummaryList.innerHTML = `
      <li>Pomodoro: ${currentDurations.focus / 60} minutes</li>
      <li>Short break: ${currentDurations["short-break"] / 60} minutes</li>
      <li>Long break: ${currentDurations["long-break"] / 60} minutes</li>
      <li>Long break appears after ${longBreakInterval} Pomodoros</li>
    `;
  }

  function syncCycleInputs() {
    if (cycleInputs.focus) cycleInputs.focus.value = currentDurations.focus / 60;
    if (cycleInputs.short) cycleInputs.short.value = currentDurations["short-break"] / 60;
    if (cycleInputs.long) cycleInputs.long.value = currentDurations["long-break"] / 60;
    if (cycleInputs.interval) cycleInputs.interval.value = longBreakInterval;
  }

  function updateStartButtons() {
    startButtons.forEach((button) => {
      const screen = button.closest(".screen");
      const screenMode = screen?.dataset.screen;

      if (screenMode !== currentMode) {
        button.innerHTML = `
          <i class="fa-solid fa-play"></i>
          <span>Start</span>
        `;
        return;
      }

      if (isRunning) {
        button.innerHTML = `
          <i class="fa-solid fa-pause"></i>
          <span>Pause</span>
        `;
      } else {
        button.innerHTML = `
          <i class="fa-solid fa-play"></i>
          <span>Start</span>
        `;
      }
    });
  }

  function stopTimer() {
    if (timerInterval !== null) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    isRunning = false;
    updateStartButtons();
  }

  function resetMode(mode) {
    if (mode === "cycles") return;
    remainingSeconds = currentDurations[mode];
    updateDisplay(mode, remainingSeconds);
  }

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

    tabButtons.forEach((card) => {
      card.classList.remove("mini-card--active");
    });

    const activeButton = document.querySelector(
      `.mini-card[data-target="${screenName}"]`
    );

    if (activeButton) {
      activeButton.classList.add("mini-card--active");
    }
  }

  function activateTimerMode(mode) {
    stopTimer();
    currentMode = mode;
    showScreen(mode);
    resetMode(mode);
    updateStartButtons();
  }

  function openCyclesScreen() {
    stopTimer();
    showScreen("cycles");
  }

  function getNextModeAfterFocus() {
    completedFocusSessions += 1;

    if (completedFocusSessions >= longBreakInterval) {
      completedFocusSessions = 0;
      return "long-break";
    }

    return "short-break";
  }

  function goToNextMode(countFocusAsCompleted = false) {
    let nextMode = "focus";

    if (currentMode === "focus") {
      nextMode = countFocusAsCompleted
        ? getNextModeAfterFocus()
        : "short-break";
    } else {
      nextMode = "focus";
    }

    activateTimerMode(nextMode);
  }

  function startTimer() {
    if (isRunning) return;

    requestNotificationPermission();

    if (remainingSeconds <= 0) {
      remainingSeconds = currentDurations[currentMode];
      updateDisplay(currentMode, remainingSeconds);
    }

    isRunning = true;
    updateStartButtons();

    timerInterval = setInterval(() => {
      remainingSeconds -= 1;
      updateDisplay(currentMode, remainingSeconds);

      if (remainingSeconds <= 0) {
        remainingSeconds = 0;
        updateDisplay(currentMode, remainingSeconds);

        const finishedMode = currentMode;
        stopTimer();
        playAlarm();

        showNotification(finishedMode);

        if (finishedMode === "focus") {
          goToNextMode(true);
        } else {
          goToNextMode(false);
        }
      }
    }, 1000);
  }

  function pauseTimer() {
    stopTimer();
  }

  function saveCycleSettings() {
    const focusMinutes = Math.max(1, parseInt(cycleInputs.focus.value, 10) || 25);
    const shortMinutes = Math.max(1, parseInt(cycleInputs.short.value, 10) || 5);
    const longMinutes = Math.max(1, parseInt(cycleInputs.long.value, 10) || 15);
    const intervalCount = Math.max(1, parseInt(cycleInputs.interval.value, 10) || 4);

    currentDurations = {
      focus: focusMinutes * 60,
      "short-break": shortMinutes * 60,
      "long-break": longMinutes * 60,
    };

    longBreakInterval = intervalCount;

    syncCycleInputs();
    updateMiniCardLabels();
    updateCyclesSummary();
    syncAllDisplays();

    if (currentMode !== "cycles") {
      remainingSeconds = currentDurations[currentMode];
      updateDisplay(currentMode, remainingSeconds);
    }

    updateStartButtons();
    showScreen("cycles");
  }

  function resetCycleSettings() {
    currentDurations = { ...initialDurations };
    longBreakInterval = 4;

    syncCycleInputs();
    updateMiniCardLabels();
    updateCyclesSummary();
    syncAllDisplays();

    if (currentMode !== "cycles") {
      remainingSeconds = currentDurations[currentMode];
      updateDisplay(currentMode, remainingSeconds);
    }

    updateStartButtons();
    showScreen("cycles");
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.target;

      if (target === "cycles") {
        openCyclesScreen();
        return;
      }

      activateTimerMode(target);
    });
  });

  startButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const screen = button.closest(".screen");
      const screenMode = screen?.dataset.screen;

      if (!screenMode || screenMode === "cycles") return;

      if (screenMode !== currentMode) {
        activateTimerMode(screenMode);
      }

      if (isRunning) {
        pauseTimer();
      } else {
        startTimer();
      }
    });
  });

  skipButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (currentMode === "focus") {
        goToNextMode(true);
      } else {
        goToNextMode(false);
      }
    });
  });

  saveSettingsButton?.addEventListener("click", saveCycleSettings);
  resetSettingsButton?.addEventListener("click", resetCycleSettings);

  syncCycleInputs();
  updateMiniCardLabels();
  updateCyclesSummary();
  syncAllDisplays();

  showScreen("focus");
  resetMode("focus");
  updateStartButtons();

  const playlistInput =
  document.getElementById("playlist-url");

const loadPlaylistButton =
  document.getElementById("load-playlist");

const spotifyEmbed =
  document.getElementById("spotify-embed");

function loadPlaylist(url) {

  if (!url.includes("playlist")) {
    alert("Invalid Spotify playlist.");
    return;
  }

  const playlistId = url
    .split("/playlist/")[1]
    ?.split("?")[0];

  if (!playlistId) {
    alert("Could not find playlist ID.");
    return;
  }

  spotifyEmbed.src =
    `https://open.spotify.com/embed/playlist/${playlistId}`;

  localStorage.setItem(
    "pomobeats_playlist",
    url
  );
}

loadPlaylistButton?.addEventListener(
  "click",
  () => {
    loadPlaylist(playlistInput.value);
  }
);

const savedPlaylist =
  localStorage.getItem(
    "pomobeats_playlist"
  );

if (savedPlaylist) {

  playlistInput.value =
    savedPlaylist;

  loadPlaylist(savedPlaylist);
}
});