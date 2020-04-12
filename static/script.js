function getStoredCredentials() {
  const loggedIn = window.sessionStorage.getItem("loggedIn");
  if (loggedIn == "true") {
    return {
      username: window.sessionStorage.getItem("username"),
      token: window.sessionStorage.getItem("token"),
      refreshToken: window.sessionStorage.getItem("refreshToken")
    }
  } else {
    return null;
  }
}

function setStoredCredentials(username, token, refreshToken) {
  window.sessionStorage.setItem("loggedIn", "true");
  window.sessionStorage.setItem("username", username);
  window.sessionStorage.setItem("token", token);
  if (refreshToken != null) {
    window.sessionStorage.setItem("refreshToken", refreshToken);
  }
}

function removeStoredCredentials() {
  window.sessionStorage.setItem("loggedIn", false);
  window.sessionStorage.removeItem("username");
  window.sessionStorage.removeItem("token");
  window.sessionStorage.removeItem("refreshToken");
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

function getTargetUsername() {
  const selectedIndex = document.getElementById("targetUsername").selectedIndex;
  if (selectedIndex == -1) {
    return null;
  }
  return document.getElementById("targetUsername").options[selectedIndex].value;
}

async function renderTargetUserSelector() {  
  const storedCredentials = getStoredCredentials();  
  if (storedCredentials == null) { // in case user has logged out
    return;
  }
  
  const url = "users";

  const requestJson = {
    method: "Get",
    headers: {
      "Authorization": "Bearer " + storedCredentials.token + " " + storedCredentials.refreshToken
    },
    mode: "cors",
    cache: "no-cache"
  };
  
  const response = await fetch(url, requestJson);

  if (response.status == 200) {
    const responseJson = await response.json();

    if (!userIsStillLoggedIn(storedCredentials.username)) {
      return;
    }
    
    if ("token" in responseJson) {
      setStoredCredentials(storedCredentials.username, responseJson.token, null);
    }
    
    const usernames = responseJson.usernames;
    const targetUsername = getTargetUsername();
    
    document.getElementById("targetUsername").innerHTML = "";
    const ownOption = document.createElement("option");
    ownOption.value = storedCredentials.username;
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
  else if (response.status == 401) {
    if (userIsStillLoggedIn(storedCredentials.username)) {
      logout();
    }
  }
}

async function displayPosts() {  
  const storedCredentials = getStoredCredentials();
  if (storedCredentials == null) { // in case logged out
    return;
  }
  
  const targetUsername = getTargetUsername();
  const url = "messages/" + targetUsername;
  
  const requestJson = {
    method: "Get",
    headers: {
      "Authorization": "Bearer " + storedCredentials.token + " " + storedCredentials.refreshToken
    },
    mode: "cors",
    cache: "no-cache"
  };
  
  const response = await fetch(url, requestJson);
  
  if (response.status == 200) {
    const responseJson = await response.json();
    
    // user could have logged out or changed selection item during the await
    if (!userIsStillLoggedIn(storedCredentials.username) || targetUsername != getTargetUsername()) {
      return;
    }
    
    if ("token" in responseJson) {
      setStoredCredentials(storedCredentials.username, responseJson.token, null);
    }
    
    const messages = responseJson.messages;
    
    document.getElementById("posts").innerHTML = "";
    for (let i = 0; i < messages.length; i++) {
      const itemElement = document.createElement("li");
      itemElement.innerText = messages[i];  // innerText protects against XSS
      document.getElementById("posts").appendChild(itemElement);
    }
    document.getElementById("posts").style.display = "block";
    
    if (targetUsername == storedCredentials.username) {
      document.getElementById("newPostDiv").style.display = "block";
    } else {
      document.getElementById("newPostDiv").style.display = "none";
    }
    
    document.getElementById("contents").style.display = "block";
    
    pendingRefreshJob = setTimeout(() => refresh(storedCredentials.username), 5000);
  }
  else if (response.status == 401) {
    if (userIsStillLoggedIn(storedCredentials.username)) {
      logout();
    }
  }
}

async function addNewPost() {
  if (pendingRefreshJob != null) {
    clearTimeout(pendingRefreshJob);
    pendingRefreshJob = null;
  }
  
  const storedCredentials = getStoredCredentials();
  const url = "messages/" + getTargetUsername();
  const message = document.getElementById("newPost").value;
  const requestJson = {
    method: "Post",
    headers: {
      "Authorization": "Bearer " + storedCredentials.token + " " + storedCredentials.refreshToken,
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
    const responseJson = await response.json();
    
    if (!userIsStillLoggedIn(storedCredentials.username)) {
      return;
    }
    
    if ("token" in responseJson) {
      setStoredCredentials(storedCredentials.username, responseJson.token, null);
    }
    
    document.getElementById("newPost").value = "";

    displayPosts();
  }
  else if (response.status == 401) {
    if (userIsStillLoggedIn(storedCredentials.username)) {
      logout();
    }
  }
}

function changeTargetUsername() {
  if (pendingRefreshJob != null) {
    clearTimeout(pendingRefreshJob);
    pendingRefreshJob = null;
  }
  
  const storedCredentials = getStoredCredentials();
  document.getElementById("posts").style.display = "none";
  document.getElementById("newPostDiv").style.display = "none";
  displayPosts();
}

async function renderWhenLoggedIn() {
  document.getElementById("status").style.display = "none";
  document.getElementById("logout").style.display = "none";
  document.getElementById("login").style.display = "none";
  document.getElementById("contents").style.display = "none";
  const username = getStoredCredentials().username;
  await renderTargetUserSelector();
  await displayPosts();
  document.getElementById("status").innerText = "Logged in as " + username + ".";
  document.getElementById("status").style.display = "inline";
  document.getElementById("logout").style.display = "inline";
  document.getElementById("contents").style.display = "block";
}

async function authenticate(url) {
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
    const refreshToken = responseJson.refresh_token;  // python code uses underscores
    setStoredCredentials(username, token, refreshToken);
    renderWhenLoggedIn();
  }
  else if (response.status == 401) {
    if (url == "login") {
      document.getElementById("status").innerText = "Invalid credentials";
    }
    else if (url == "register") {
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
  
  removeStoredCredentials();
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
