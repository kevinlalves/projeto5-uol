const loginButton = document.getElementById("send-user");
const chatBox = document.getElementById("chat-box");
const usersBox = document.getElementById("online-users");
const sendMsg = document.getElementById("send-message");
const navButton = document.getElementById("nav-button");
const navBack = document.getElementById("nav-background");
const navBar = document.getElementById("nav-bar");
const enterKey = 13;
const drivenApi = "https://mock-api.driven.com.br/api/v6/uol/";
loginButton.addEventListener("click", validateUserAndLogin);
navButton.addEventListener("click", openNavBar);
navBack.addEventListener("click", closeNavBar);
window.addEventListener("keydown", enterToLogin);

function enterToLogin(e) {
  if (e.which === enterKey) {
    validateUserAndLogin();
  }
}

function openNavBar() {
  console.log("nav-bar", navBar);
  navBack.classList.add("show-background-nav");
  navBar.classList.add("nav-open");
}

function closeNavBar(e) {
  if (e.target.id !== navBar.id) {
    navBack.classList.remove("show-background-nav");
    navBar.classList.remove("nav-open");
  }
}

function validateUserAndLogin() {
  const name = document.getElementById("username").value;
  axios.post(drivenApi + "participants", {
    name: name
  })
    .then(() => {
      login(name);
    })
    .catch(error => {
      console.log(error);
      const errorMsg = loginButton.previousElementSibling;
      if (error.response.status === 400) {
        errorMsg.innerText = "username typed is either empty or used";
      } else {
        errorMsg.innerText = "failed to communicate with server";
      }
      errorMsg.classList.add("show");
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
    this.msgRecipient = "todos";
    this.lastMessageTime = "";
    this.lastName = name;
    this.type = "message";
    window.removeEventListener("keydown", enterToLogin);
    window.addEventListener("keydown", this.enterToSend.bind(this));
    sendMsg.addEventListener("click", this.postMessage.bind(this));
    this.updateMessageTypeStatus();
    setInterval(this.keepConnectionAlive.bind(this), 5000);
    setInterval(this.updateChatMessages.bind(this), 3000);
    console.log("I'm getting created");
  }
  enterToSend(e) {
    if (e.which === enterKey) {
      this.postMessage();
    }
  }
  updateMessageTypeStatus() {
    const typeStatus = document.getElementById("type-status");
    typeStatus.innerText = `Enviando para ${this.msgRecipient}`;
    if (this.type === "private_message") {
      typeStatus.innerText += " (reservadamente)";
    }
  }
  keepConnectionAlive() {
    axios.post(drivenApi + "status", {
      name: this.name
    });
  }
  updateChatMessages() {
    axios.get(drivenApi + "messages")
      .then(response => {
        console.log("update");
        const messages = response.data;
        let newInnerHTML = "";
        let changed = false;
        for (let i = messages.length-1; i >= 0 && messages[i].time !== this.lastMessageTime; i--) {
          let visibility = "";
          changed = true;
          if (messages[i].type === "private_message") {
            visibility = "reservadamente";
          }
          newInnerHTML = `
            <p class="${messages[i].type}">
              (${messages[i].time}) ${messages[i].from} ${visibility} para ${messages[i].to}:
               ${messages[i].text}
            </p>
          ` + newInnerHTML;
        }
        chatBox.innerHTML += newInnerHTML;
        if (changed) {
          this.lastMessageTime = messages[messages.length-1].time;
          chatBox.lastElementChild.scrollIntoView();
        }
      });
  }
  postMessage() {
    const msgText = document.getElementById("message-text");
    if (msgText.value) {
      axios.post(drivenApi + "messages", {
        from: this.name,
        to: this.msgRecipient,
        text: msgText.value,
        type: this.type
      })
        .then((response) => {
          console.log(response);
          msgText.value = "";
        });
    }
  }
  updateUsersOnline() {
    axios.get(drivenApi + "participants")
      .then(response => {
        console.log(response);
        const users = response.data;
        for (let i = users.length; i >= 0 && users[i].name !== this.lastName; i--) {
          usersBox.innerHTML = `
          <div class="nav-line">
          <ion-icon name="person-circle"></ion-icon>
          <p>${users[i].name}</p>
          </div>
          ` + usersBox.innerHTML;
        }
      });
  }
}
