function loadCredentialsFromStorage() {
  if (window.sessionStorage.getItem("loggedIn") == "true") {
    return {
      username: window.sessionStorage.getItem("username"),
      token: window.sessionStorage.getItem("token"),
      refreshToken: window.sessionStorage.getItem("refreshToken")
    }
  } else {
    return null;
  }
}

function saveCredentialsToStorage(credentials) {
  if (credentials != null) {
    window.sessionStorage.setItem("loggedIn", "true");
    window.sessionStorage.setItem("username", credentials.username);
    window.sessionStorage.setItem("token", credentials.token);
    window.sessionStorage.setItem("refreshToken", credentials.refreshToken);
  } else {
    window.sessionStorage.setItem("loggedIn", "false");
    window.sessionStorage.removeItem("username");
    window.sessionStorage.removeItem("token");
    window.sessionStorage.removeItem("refreshToken");
  }
}

export {loadCredentialsFromStorage, saveCredentialsToStorage};
