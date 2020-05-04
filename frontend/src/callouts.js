const baseUrl = "api/"

async function performGetRequest(resource, credentials) {
  const requestJson = {
    method: "Get",
    headers: {
      "Authorization": "Bearer " + credentials.token + " " + credentials.refreshToken
    },
    mode: "cors",
    cache: "no-cache",
  };
  
  return await fetch(baseUrl + resource, requestJson);
}

async function performPostRequest(resource, credentials, requestPayload) {
  const requestJson = {
    method: "Post",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestPayload),
    mode: "cors",
    cache: "no-cache"
  }
  
  if (credentials != null) {
    requestJson.headers["Authorization"] = "Bearer " + credentials.token + " " + credentials.refreshToken;
  }
  
  return await fetch(baseUrl + resource, requestJson);
}

function extractNewCredentials(username, responseJson) {
  const newCredentials = {
    username: username
  };
  
  if ("token" in responseJson) {
    newCredentials.token = responseJson.token;
  }
  
  if ("refresh_token" in responseJson) {
    newCredentials.refreshToken = responseJson.refresh_token;
  }
  
  return newCredentials;
}

function isValidInput(inputString) {
  return inputString.match(/^[0-9a-zA-Z]+$/) != null;
}


async function authenticate(actionType, username, password) {
  if (!isValidInput(username) || !isValidInput(password)) {
    throw "Username and password must be non-empty and alphanumeric.";
  }
  
  const requestPayload = {
    username: username,
    password: password  // should be protected by HTTPS in a serious production app
  };

  const response = await performPostRequest(actionType, null, requestPayload);
  
  if (response.status == 200) {
    const responseJson = await response.json();
    const newCredentials = extractNewCredentials(username, responseJson);
    return {newCredentials};
  }
  else if (response.status == 401) {
    if (actionType == "login") {
      throw "Invalid credentials";
    } else if (actionType == "register") {
      throw "Account already exists with this username.";
    }
  }
}

async function changePassword(oldPassword, newPassword, credentials) {
  if (!isValidInput(oldPassword) || !isValidInput(newPassword)) {
    throw "Passwords must be non-empty and alphanumeric.";
  }
  
  const requestPayload = {
    old_password: oldPassword,
    new_password: newPassword
  };

  const response = await performPostRequest("password", credentials, requestPayload);
  
  if (response.status == 200) {
    const responseJson = await response.json();
    const newCredentials = extractNewCredentials(credentials.username, responseJson);
    return {newCredentials};
  }
  else if (response.status == 403) {
    throw "Old password is incorrect.";
  }
  else if (response.status == 401) {
    throw "Logged out";
  }
}

async function getUsernameList(credentials) {  
  const response = await performGetRequest("users", credentials);

  if (response.status == 200) {
    const responseJson = await response.json();
    const newCredentials = extractNewCredentials(credentials.username, responseJson);
    const usernameList = responseJson.usernames;
    return {usernameList, newCredentials};
  }
  else if (response.status == 401) {
    throw "Logged out";
  }
}

async function getMessageList(targetUsername, credentials) {   
  const response = await performGetRequest("messages/" + targetUsername, credentials);
  
  if (response.status == 200) {
    const responseJson = await response.json();
    const newCredentials = extractNewCredentials(credentials.username, responseJson);
    const messageList = responseJson.messages;
    return {messageList, newCredentials};
  }
  else if (response.status == 401) {
    throw "Logged out";
  }
}


async function sendNewMessage(targetUsername, message, credentials) {
  const requestPayload = {message};
  
  const response = await performPostRequest("messages/" + targetUsername, credentials, requestPayload);
  
  if (response.status == 200) {
    const responseJson = await response.json();
    const newCredentials = extractNewCredentials(credentials.username, responseJson);
    return {newCredentials};
  }
  else if (response.status == 401) {
    throw "Logged out";
  }
}

export {authenticate, changePassword, getUsernameList, getMessageList, sendNewMessage};
