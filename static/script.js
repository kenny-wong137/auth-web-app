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

function userIsStillLoggedIn(expectedUsername) {
  if (window.sessionStorage.getItem("loggedIn") == "true") {
    return window.sessionStorage.getItem("username") == expectedUsername;
  } else {
    return false;
  }
}

const baseUrl = "http://localhost:5000/";

function getTargetUsername() {
  const selectedIndex = document.getElementById("targetUsername").selectedIndex;
  if (selectedIndex == -1) {
    return null;
  }
  return document.getElementById("targetUsername").options[selectedIndex].value;
}

async function renderTargetUserSelector() {  
  const storedData = getUsernameAndToken();  
  if (storedData == null) { // in case user has logged out
    return;
  }
  
  const url = baseUrl + "users";

  const requestJson = {
    method: "Get",
    headers: {
      "Authorization": "Bearer " + storedData.token
    },
    mode: "cors",
    cache: "no-cache"
  };
  
  const response = await fetch(url, requestJson);

  if (response.status == 200) {
    const responseJson = await response.json();

    if (!userIsStillLoggedIn(storedData.username)) {
      return;
    }
    
    const usernames = responseJson.usernames;
    const targetUsername = getTargetUsername();
    
    document.getElementById("targetUsername").innerHTML = "";
    const ownOption = document.createElement("option");
    ownOption.value = storedData.username;
    ownOption.innerText = "You";
    document.getElementById("targetUsername").appendChild(ownOption);

    let targetIndex = 0;
    let indexInSelectMenu = 1;  // for-loop skips "You" which is in position 0
      
    for (let indexInResults = 0; indexInResults < usernames.length; indexInResults++) {
      if (usernames[indexInResults] != ownOption.value) {
        const foreignOption = document.createElement("option");
        foreignOption.innerText = usernames[indexInResults];  // innerText protects against XSS
        foreignOption.value = foreignOption.innerText;
        document.getElementById("targetUsername").appendChild(foreignOption);
        if (targetUsername == usernames[indexInResults]) {
          targetIndex = indexInSelectMenu;
        }
        indexInSelectMenu++;
      }
    }
    
    document.getElementById("targetUsername").selectedIndex = targetIndex;
  }
}

async function displayPosts() {  
  const storedData = getUsernameAndToken();
  if (storedData == null) { // in case logged out
    return;
  }
  
  const targetUsername = getTargetUsername();
  const url = baseUrl + "messages/" + targetUsername;
  
  const requestJson = {
    method: "Get",
    headers: {
      "Authorization": "Bearer " + storedData.token
    },
    mode: "cors",
    cache: "no-cache"
  };
  
  const response = await fetch(url, requestJson);
  
  if (response.status == 200) {
    const responseJson = await response.json();
    
    // user could have logged out or changed selection item during the await
    if (!userIsStillLoggedIn(storedData.username) || targetUsername != getTargetUsername()) {
      return;
    }
    
    const messages = responseJson.messages;
    
    document.getElementById("posts").innerHTML = "";
    for (let i = 0; i < messages.length; i++) {
      const itemElement = document.createElement("li");
      itemElement.innerText = messages[i];  // innerText protects against XSS
      document.getElementById("posts").appendChild(itemElement);
    }
    document.getElementById("posts").style.display = "block";
    
    if (targetUsername == storedData.username) {
      document.getElementById("newPostDiv").style.display = "block";
    } else {
      document.getElementById("newPostDiv").style.display = "none";
    }
    
    document.getElementById("contents").style.display = "block";
    
    pendingRefreshJob = setTimeout(() => refresh(storedData.username), 5000);
  }
}

async function addNewPost() {
  if (pendingRefreshJob != null) {
    clearTimeout(pendingRefreshJob);
    pendingRefreshJob = null;
  }
  
  const storedData = getUsernameAndToken();
  const url = baseUrl + "messages/" + getTargetUsername();
  const message = document.getElementById("newPost").value;
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
  
  document.getElementById("newPost").value = "";
  
  const response = await fetch(url, requestJson);
  
  if (response.status == 200) {
    document.getElementById("newPost").value = "";
    if (userIsStillLoggedIn(storedData.username)) {
      displayPosts();
    }
  }
}

function changeTargetUsername() {
  if (pendingRefreshJob != null) {
    clearTimeout(pendingRefreshJob);
    pendingRefreshJob = null;
  }
  
  const storedData = getUsernameAndToken();
  document.getElementById("posts").style.display = "none";
  document.getElementById("newPostDiv").style.display = "none";
  displayPosts();
}

async function renderWhenLoggedIn() {
  document.getElementById("status").style.display = "none";
  document.getElementById("logout").style.display = "none";
  document.getElementById("login").style.display = "none";
  document.getElementById("contents").style.display = "none";
  const username = getUsernameAndToken().username;
  await renderTargetUserSelector();
  await displayPosts();
  document.getElementById("status").innerText = "Logged in as " + username + ".";
  document.getElementById("status").style.display = "inline";
  document.getElementById("logout").style.display = "inline";
  document.getElementById("contents").style.display = "block";
}

async function authenticate(endpoint) {
  const url = baseUrl + endpoint;
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  if (username.match(/^[0-9a-zA-Z]+$/) == null || password.match(/^[0-9a-zA-Z]+$/) == null) {
    document.getElementById("status").innerText = "Username and password must be alphanumeric.";
    document.getElementById("status").style.display = "inline";
    return;
  } else {
    document.getElementById("status").innerText = "";
    document.getElementById("status").style.display = "none";
    document.getElementById("login").style.display = "none";
  }
  
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
    document.getElementById("login").style.display = "block";
  }
}

function login() {
  authenticate("login");
}

function register() {
  authenticate("register");
}

function renderWhenLoggedOut() {
  document.getElementById("status").innerText = "";
  document.getElementById("status").style.display = "none";
  document.getElementById("logout").style.display = "none";
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  document.getElementById("login").style.display = "block";
  document.getElementById("targetUsername").innerHTML = "";
  document.getElementById("posts").innerHTML = "";
  document.getElementById("newPost").value = "";
  document.getElementById("contents").style.display = "none";
}

function logout() {
  if (pendingRefreshJob != null) {
    clearTimeout(pendingRefreshJob);
    pendingRefreshJob = null;
  }
  
  removeUsernameAndToken();
  renderWhenLoggedOut();
}

async function refresh(expectedLoggedInUser) {
  if (userIsStillLoggedIn(expectedLoggedInUser)) {
    await renderTargetUserSelector();
  }
  if (userIsStillLoggedIn(expectedLoggedInUser)) {
    await displayPosts();
  }
}

let pendingRefreshJob = null;

if (isLoggedIn()) {
  renderWhenLoggedIn();
} else {
  renderWhenLoggedOut();
}
