function getUsernameAndToken() {
  const loggedIn = window.sessionStorage.getItem("loggedIn");
  if (loggedIn == "true") {
    return {
      username: window.sessionStorage.getItem("username"),
      token: window.sessionStorage.getItem("token")
    }
  } else {
    return null;
  }
}

function setUsernameAndToken(username, token) {
  window.sessionStorage.setItem("loggedIn", "true");
  window.sessionStorage.setItem("username", username);
  window.sessionStorage.setItem("token", token);
}

function removeUsernameAndToken() {
  window.sessionStorage.setItem("loggedIn", false);
  window.sessionStorage.removeItem("username");
  window.sessionStorage.removeItem("token");
}

function isLoggedIn() {
  return window.sessionStorage.getItem("loggedIn") == "true";
}

const baseUrl = "http://localhost:5000/";

function renderWhenLoggedIn() {
  username = getUsernameAndToken().username;
  document.getElementById("status").innerText = "Logged in as " + username + ".";
  document.getElementById("status").style.display = "inline";
  document.getElementById("logout").style.display = "inline";
  document.getElementById("login").style.display = "none";
  document.getElementById("contents").style.display = "block";
  displayPosts();
}

function renderWhenLoggedOut() {
  document.getElementById("status").innerText = "";
  document.getElementById("status").style.display = "none";
  document.getElementById("logout").style.display = "none";
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  document.getElementById("login").style.display = "block";
  document.getElementById("notes").innerHTML = "";
  document.getElementById("newNote").value = "";
  document.getElementById("contents").style.display = "none";
}

async function authenticate(endpoint) {
  const url = baseUrl + endpoint;
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const requestJson = {
    method: "Post",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username: username,
      password: password
    }),
    mode: "cors",
    cache: "no-cache"
  };
  
  const response = await fetch(url, requestJson);
  
  if (response.status == 200) {
    const responseJson = await response.json();
    const token = responseJson.token;
    setUsernameAndToken(username, token);
    renderWhenLoggedIn();
  }
  else if (response.status == 401) {
    if (endpoint == "login") {
      document.getElementById("status").innerText = "Invalid credentials";
    }
    else if (endpoint == "register") {
      document.getElementById("status").innerText = "Account already exists with this username.";
    }
    document.getElementById("status").style.display = "inline";
  }
}

function login() {
  authenticate("login");
}

function register() {
  authenticate("register");
}

function logout() {
  removeUsernameAndToken();
  renderWhenLoggedOut();
}

async function displayPosts() {
  const url = baseUrl + "messages";
  const storedData = getUsernameAndToken();
  const requestJson = {
    method: "Get",
    headers: {
      "Authorization": "Bearer " + storedData.token,
      "Content-Type": "application/json"
    },
    mode: "cors",
    cache: "no-cache"
  };
  
  const response = await fetch(url, requestJson);
  
  if (response.status == 200) {
    const responseJson = await response.json();
    const messages = responseJson.messages;
    
    document.getElementById("notes").innerHTML = "";
    for (let i = 0; i < messages.length; i++) {
      const itemElement = document.createElement("li");
      itemElement.innerText = messages[i];
      document.getElementById("notes").appendChild(itemElement);
    }
  }
  else if (response.status == 401) {
    logout();
  }
}

async function addNewNote() {
  const url = baseUrl + "messages";
  const storedData = getUsernameAndToken();
  const message = document.getElementById("newNote").value;
  const requestJson = {
    method: "Post",
    headers: {
      "Authorization": "Bearer " + storedData.token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: message
    }),
    mode: "cors",
    cache: "no-cache"
  };
  
  const response = await fetch(url, requestJson);
  
  if (response.status == 200) {
    document.getElementById("newNote").value = "";
    displayPosts();
  }
  else if (response.status == 401) {
    logout();
  }
}

if (isLoggedIn()) {
  renderWhenLoggedIn();
} else {
  renderWhenLoggedOut();
}
