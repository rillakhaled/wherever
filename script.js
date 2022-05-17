// Timer credit: Mateusz Rybczonec
const FULL_DASH_ARRAY = 283;
const WARNING_THRESHOLD = 10;
const ALERT_THRESHOLD = 5;
let gameOver = false;

const btnReload = document.querySelector("#reloadMap");
const stopConfettiBtn = document.querySelector("#stopConfetti");
const items = document.querySelectorAll(".item");
const itemsNeeded = 6;
const victoryTune = new Audio("victory.mp3");
const failureTune = new Audio("fail.mp3");

const COLOR_CODES = {
  info: {
    color: "green"
  },
  warning: {
    color: "orange",
    threshold: WARNING_THRESHOLD
  },
  alert: {
    color: "red",
    threshold: ALERT_THRESHOLD
  }
};

let state = undefined;

// 20 minutes * 60 seconds
const TIME_LIMIT = 20 * 60;
let timePassed = 0;
let timeLeft = TIME_LIMIT;
let timerInterval = null;
let remainingPathColor = COLOR_CODES.info.color;

document.getElementById("app").innerHTML = `
<div class="base-timer">
<svg class="base-timer__svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
<g class="base-timer__circle">
<circle class="base-timer__path-elapsed" cx="50" cy="50" r="45"></circle>
<path
id="base-timer-path-remaining"
stroke-dasharray="283"
class="base-timer__path-remaining ${remainingPathColor}"
d="
M 50, 50
m -45, 0
a 45,45 0 1,0 90,0
a 45,45 0 1,0 -90,0
"
></path>
</g>
</svg>
<span id="base-timer-label" class="base-timer__label">${formatTime(
  timeLeft)}</span>
  </div>`;

  let startingTime;

  function tick() {
    if(!gameOver) {

      // dt is elapsed time in milliseconds
      let dt = Date.now() - startingTime;

      // Update timer display
      timePassed = Math.floor(dt/1000);
      timeLeft = TIME_LIMIT - timePassed;

      document.getElementById("base-timer-label").innerHTML = formatTime(timeLeft);
      setCircleDasharray();
      setRemainingPathColor(timeLeft);

      if (timeLeft === 0) {
        gameOver = true;
        triggerUnsuccessfulEnd();
      }
      else {
        window.requestAnimationFrame(tick);
      }
    }
  }



  function startTimer() {
    startingTime = Date.now();

    let data = JSON.parse(localStorage.getItem(`wherever-you-are-state`));
    if (data) {
      startingTime = data.startingTime;
      for (let i = 0; i < data.items.length; i++) {
        items[i].checked = data.items[i];
      }
    }

    window.requestAnimationFrame(tick);
  }

  function formatTime(time) {
    const minutes = Math.floor(time / 60);
    let seconds = time % 60;

    if (seconds < 10) {
      seconds = `0${seconds}`;
    }

    return `${minutes}:${seconds}`;
  }

  function setRemainingPathColor(timeLeft) {
    const { alert, warning, info } = COLOR_CODES;
    if (timeLeft <= alert.threshold) {
      document
      .getElementById("base-timer-path-remaining")
      .classList.remove(warning.color);
      document
      .getElementById("base-timer-path-remaining")
      .classList.add(alert.color);
    } else if (timeLeft <= warning.threshold) {
      document
      .getElementById("base-timer-path-remaining")
      .classList.remove(info.color);
      document
      .getElementById("base-timer-path-remaining")
      .classList.add(warning.color);
    }
  }

  function calculateTimeFraction() {
    const rawTimeFraction = timeLeft / TIME_LIMIT;
    return rawTimeFraction - (1 / TIME_LIMIT) * (1 - rawTimeFraction);
  }

  function setCircleDasharray() {
    const circleDasharray = `${(
      calculateTimeFraction() * FULL_DASH_ARRAY
    ).toFixed(0)} 283`;
    document
    .getElementById("base-timer-path-remaining")
    .setAttribute("stroke-dasharray", circleDasharray);
  }
  function triggerUnsuccessfulEnd() {
    failureTune.play();
  }

  function triggerSuccessfulEnd() {
    gameOver = true;
    startConfetti();
    victoryTune.play();
    stopConfettiBtn.style.visibility = 'visible';
  }

  function recalculateCheckedItems(e) {

    let itemsCollected = 0;
    for(item of items) {
      if(item.checked === true) {
        itemsCollected++;
      }
    }
    if(itemsCollected >= itemsNeeded) {
      let confirmation = prompt(`Type "confetti" to confirm all photos collected: `);
      if(confirmation==='confetti') {
        triggerSuccessfulEnd();
      }
      else {
        e.target.checked = false;
      }
    }
  }

  startTimer();

  stopConfettiBtn.addEventListener("click", function(e){
    e.target.style.visibility = "hidden";
    stopConfetti();
  })

  btnReload.addEventListener("click", function(e){
    e.preventDefault();
    let frame = document.querySelector("#gmap")
    frame.src = frame.src;
  })

  window.addEventListener("beforeunload", function(e) {
    if (gameOver) {
      localStorage.removeItem(`wherever-you-are-state`);
    }
    else {
      state = {};
      state.startingTime = startingTime;
      state.items = [];
      for(let i = 0; i < items.length; i++) {
        state.items[i] = items[i].checked;
      }
      localStorage.setItem(`wherever-you-are-state`,JSON.stringify(state));
    }
  });

  for(item of items) {
    item.addEventListener("change", function(e){
      e.preventDefault();
      setTimeout(() => {
        recalculateCheckedItems(e);
      },100);
    })
  }

  document.getElementById(`reset-game`).addEventListener(`click`, () => {
    gameOver = true;
    window.scrollTo(0,0);
    location.reload();
  });
