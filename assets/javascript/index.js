const loginButton = document.getElementById("send-user");
const enterKey = 13;
loginButton.addEventListener("click", validateUserAndLogin);
window.addEventListener("keydown", checkForEnter);

function checkForEnter(e) {
  if (e.which === enterKey) {
    validateUserAndLogin();
  }
}


function validateUserAndLogin() {
  const name = document.getElementById("username").value;
  axios({
    method: "post",
    url: "https://mock-api.driven.com.br/api/v6/uol/participants",
    data: {
      name: name
    }
  })
    .then(() => {
      login(name);
    })
    .catch(error => {
      const errorMsg = loginButton.previousElementSibling;
      if (error.response.status === 400) {
        errorMsg.innerText = "username typed is either empty or used";
      } else {
        errorMsg.innerText = "failed to communicate with server";
      }
      errorMsg.classList.add("show");
    })
}

function login(name) {
  const loginPage = document.getElementById("login-page");
  loginPage.classList.add("hidden");
  new User(name);
}

class User {
  constructor(name) {
    this.name = name;
    console.log("I'm getting created");
  }
}
