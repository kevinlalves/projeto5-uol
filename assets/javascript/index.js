const loginButton = document.getElementById("send-user");
const chatBox = document.getElementById("chat-box");
const usersBox = document.getElementById("online-users");
const sendMsg = document.getElementById("send-message");
const navButton = document.getElementById("nav-button");
const navBack = document.getElementById("nav-background");
const navBar = document.getElementById("nav-bar");
const privateOption = document.getElementById("private_message");
const publicOption = document.getElementById("message");
const sendingToAll = document.getElementById("0");
const sentAudio = new Audio("./assets/audio/sent.mp3");
const receivedAudio = new Audio("./assets/audio/received.mp3");
const loadingPanel = document.getElementById("loading-panel");
const loginPanel = document.getElementById("login-panel");
const loginInput = document.getElementById("username");
const errorMsg = loginButton.previousElementSibling;
const errorMsgStorageKey = "errorMsg";
const errorMsgStorageText = "Your connection timed out, please check if you're online";
const enterKey = "Enter";
const drivenApi = "https://mock-api.driven.com.br/api/v6/uol/";
const drivenTimeZone = -12;
const keepConnectionCycle = 5000;
const updateUsersCycle = 7000;
const updateMessagesCycle = 1000;
networkError();
loginButton.addEventListener("click", validateUserAndLogin);
navButton.addEventListener("click", openNavBar);
navBack.addEventListener("click", closeNavBar);
loginInput.addEventListener("keydown", enterToLogin);

function networkError() {
  if (localStorage.getItem(errorMsgStorageKey)) {
    errorMsg.innerText = localStorage.getItem(errorMsgStorageKey);
    localStorage.clear();
  }
}

function enterToLogin(e) {
  if (e.key === enterKey) {
    validateUserAndLogin();
  }
}

function playAudio(audio) {
  if (audio.currentTime) {
    audio.currentTime = 0;
  }
  audio.play();
}

function openNavBar() {
  navBack.classList.add("show-background-nav");
  navBar.classList.add("nav-open");
}

function closeNavBar(e) {
  if (e.target.id !== navBar.id) {
    navBack.classList.remove("show-background-nav");
    navBar.classList.remove("nav-open");
  }
}

function formatTime(dateString) {
  const date = new Date();
  date.setUTCHours(Number(dateString.slice(0, 2)) - drivenTimeZone);
  return date.getHours() + dateString.slice(2);
}

function showErrorNotification() {
  if (Notification.permission === "granted") {
    new Notification("Error connecting to API", {
      body: "Check your internet connection and wait to try again"
    });
  } else {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        new Notification("Error connecting to API", {
          body: "Check your internet connection and wait to try again"
        });
      }
    });
  }
}

function validateUserAndLogin() {
  loginPanel.classList.add("hidden");
  loadingPanel.classList.remove("hidden");
  const name = document.getElementById("username").value;
  axios.post(drivenApi + "participants", {
    name: name
  })
    .then(() => {
      login(name);
    })
    .catch(error => {
      loadingPanel.classList.add("hidden");
      loginPanel.classList.remove("hidden");
      if (error.response.status === 400) {
        errorMsg.innerText = "username typed is either empty or used";
      } else {
        errorMsg.innerText = "failed to communicate with server";
      }
    });
}

function login(name) {
  const loginPage = document.getElementById("login-page");
  loginPage.classList.add("hidden");
  new User(name);
}

class User {
  constructor(name) {
    this.name = name;
    this.receiverID = "0";
    this.navbarSelectedUsername = "";
    this.lastMessageTime = "";
    this.type = "message";
    this.users = [{ name: "Todos" }];
    this.msgSent = false;
    const messageInput = document.getElementById("message-text");
    loginInput.removeEventListener("keydown", enterToLogin);
    messageInput.addEventListener("keydown", this.enterToSend.bind(this));
    sendingToAll.addEventListener("click", this.selectRecipient.bind(this));
    sendMsg.addEventListener("click", this.postMessage.bind(this));
    privateOption.addEventListener("click", this.selectPrivacy.bind(this));
    publicOption.addEventListener("click", this.selectPrivacy.bind(this));
    this.updateChatMessages();
    this.updateUsersOnline();
    this.updateMessageTypeStatus();
    setInterval(this.keepConnectionAlive.bind(this), keepConnectionCycle);
    setInterval(this.updateUsersOnline.bind(this), updateUsersCycle);
    setInterval(this.updateChatMessages.bind(this), updateMessagesCycle);
  }
  enterToSend(e) {
    if (e.key === enterKey) {
      this.postMessage();
    }
  }
  updateMessageTypeStatus() {
    const typeStatus = document.getElementById("type-status");
    typeStatus.innerText = `Enviando para ${this.users[this.receiverID].name}`;
    if (this.type === "private_message") {
      typeStatus.innerText += " (reservadamente)";
    }
  }
  keepConnectionAlive() {
    axios({
      method: "post",
      url: drivenApi + "status",
      timeout: 4000,
      data: {
        name: this.name
      }
    })
      .catch(() => {
        localStorage.setItem(errorMsgStorageKey, errorMsgStorageText);
        window.location.reload();
      });
  }
  updateChatMessages() {
    axios.get(drivenApi + "messages")
      .then(response => {
        const messages = response.data;
        let newInnerHTML = "";
        let changed = false;
        let newMessage = false;
        let visibility;
        if (this.msgSent) {
          playAudio(sentAudio);
          this.msgSent = false;
        }
        for (let i = messages.length - 1; i >= 0 && messages[i].time !== this.lastMessageTime; i--) {
          visibility = "";
          if (messages[i].type === "private_message") {
            if (messages[i].to !== this.name && messages[i].from !== this.name) {
              continue;
            }
            visibility = "reservadamente";
          }
          changed = true;
          newInnerHTML = `
            <div class="chat-line ${messages[i].type}">
            <p>
              (${formatTime(messages[i].time)})  <span class="strong"> ${messages[i].from} </span> ${visibility} para
                <span class="strong"> ${messages[i].to}</span>: ${messages[i].text}
            </p>
            </div>
          ` + newInnerHTML;
          newMessage ||= messages[i].type !== "status" && messages[i].from !== this.name;
        }
        if (changed) {
          chatBox.innerHTML += newInnerHTML;
          this.lastMessageTime = messages[messages.length - 1].time;
          chatBox.lastElementChild.scrollIntoView();
        }
        if (newMessage) {
          playAudio(receivedAudio);
        }
      })
      .catch(() => {
        showErrorNotification();
      });
  }
  postMessage() {
    const msgText = document.getElementById("message-text");
    if (msgText.value) {
      axios({
        method: "post",
        url: drivenApi + "messages",
        timeout: 2000,
        data: {
          from: this.name,
          to: this.users[this.receiverID].name,
          text: msgText.value,
          type: this.type
        }
      })
        .then(() => {
          msgText.value = "";
          this.msgSent = true;
        })
        .catch(() => {
          showErrorNotification();
        });
    }
  }
  updateUsersOnline() {
    axios.get(drivenApi + "participants")
      .then(response => {
        this.users = [{ name: "Todos" }];
        this.users = this.users.concat(response.data);
        let newElement;
        usersBox.innerHTML = "";
        let selectedPersisted = false;
        for (let i = 1; i < this.users.length; i++) {
          if (this.name === this.users[i].name) {
            continue;
          }
          newElement = document.createElement("div");
          newElement.classList.add("nav-line");
          newElement.id = i;
          newElement.innerHTML = `
          <ion-icon name="person-circle"></ion-icon>
          <p>${this.users[i].name}</p>
          `;
          if (this.navbarSelectedUsername === this.users[i].name) {
            selectedPersisted = true;
            newElement.innerHTML += `<img src="./assets/images/checkmark.png" alt="choosen option">`;
            this.receiverID = i.toString();
          }
          usersBox.appendChild(newElement);
          newElement.addEventListener("click", this.selectRecipient.bind(this));
        }
        if (!selectedPersisted && this.receiverID !== "0") {
          sendingToAll.innerHTML += `<img src="./assets/images/checkmark.png" alt="choosen option">`;
          this.receiverID = "0";
          this.selectOption(publicOption, "type");
        }
      })
      .catch(() => {
        showErrorNotification();
      });
  }
  selectOption(clickedElement, attr) {
    if (this[attr] === clickedElement.id) {
      return;
    }
    const oldRecipient = document.getElementById(this[attr]);
    oldRecipient.removeChild(oldRecipient.lastElementChild);
    this[attr] = clickedElement.id;
    clickedElement.innerHTML += `<img src="./assets/images/checkmark.png" alt="choosen option">`;
    this.updateMessageTypeStatus();
  }
  selectRecipient(e) {
    this.selectOption(e.currentTarget, "receiverID");
    this.navbarSelectedUsername = this.users[e.currentTarget.id].name;
    if (this.navbarSelectedUsername === "Todos" && this.type === "private_message") {
      this.selectOption(publicOption, "type");
    }
  }
  selectPrivacy(e) {
    if (e.currentTarget.id === "private_message" && this.users[this.receiverID].name === "Todos") {
      return;
    }
    this.selectOption(e.currentTarget, "type");
  }
}
