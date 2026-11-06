// ========================= Socket.io Events ===============================
const socket = io();
notifications = [];

socket.on("data", (data) => {
  notifications = data.notifications;
  playSound();
});

socket.on("disconnect", function () {
  alertDisconnect();
});

socket.on("connect_error", () => alertDisconnect());
socket.on("connect_failed", () => alertDisconnect());

const getAlertBtnStatus = () => {
  const storedStatus = localStorage.getItem("alertStatus");

  if (storedStatus == null) {
    return true;
  } else if (storedStatus == "true") {
    return true;
  } else if (storedStatus == "false") {
    return false;
  }
};

const storeAlertBtnStatus = (status) => {
  localStorage.setItem("alertStatus", status.toString());
};

// Welcome Message
swal({
  text: "Welcome, Happy Trading!. \n Click Anywhere on the screen to use the app.",
  button: false,
});

// Audio Settings
var alertSoundBtn = document.querySelector("#alert-sound-btn");
var isAlertBtnOn = getAlertBtnStatus();
var isAudioPlaying = false;
var audio = new Audio("/alert.mp3");
var alertBtnText = isAlertBtnOn ? "Mute Alerts" : "On Alerts";
alertSoundBtn.textContent = alertBtnText;

alertSoundBtn.addEventListener("click", () => {
  if (isAlertBtnOn) {
    alertSoundBtn.textContent = "On Alerts";
    isAlertBtnOn = false;
    storeAlertBtnStatus(false);
    stopSound();
  } else {
    alertSoundBtn.textContent = "Mute Alerts";
    isAlertBtnOn = true;
    storeAlertBtnStatus(true);
    playSound();
  }
});

function playSound() {
  if (isAlertBtnOn && !isAudioPlaying && notifications.length > 0) {
    audio.loop = true;
    audio.play();
  } else {
    audio.pause();
  }
}

function stopSound() {
  audio.pause();
}

var isDisconnectAlerted = false;

function alertDisconnect() {
  // connect_error fires on every reconnect attempt, so only alert once
  if (isDisconnectAlerted) {
    return;
  }
  isDisconnectAlerted = true;

  swal({
    title: "Web Socket is Disconnected",
    text: "Please refresh the page or restart the server.",
    icon: "warning",
    buttons: false,
    dangerMode: false,
  });

  var alertAudio = new Audio("/alert.mp3");
  alertAudio.loop = true;
  alertAudio.play();
}
