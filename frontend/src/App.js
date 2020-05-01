import React from "react";
import {loadCredentialsFromStorage, saveCredentialsToStorage} from "./credentialsStorage";
import Login from "./Login";
import AccountView from "./AccountView";

class App extends React.Component {
  
  constructor(props) {
    super(props);

    this.state = {
      credentials: loadCredentialsFromStorage()
    };
  }

  handleLogout() {
    this.setState((state, props) => {
      saveCredentialsToStorage(null);
      return {
        credentials: null
      };
    })
  }
  
  handleLogin(credentials) {
    this.setState((state, props) => {
      saveCredentialsToStorage(credentials);
      return {credentials};
    });
  }
  
  handleModifyCredentials(changes) {
    this.setState((state, props) => {
      if (state.credentials != null && state.credentials.username == changes.username) {
        // handle async execution lag - avoid applying changes that are no longer relevant
        const credentials = Object.assign({}, state.credentials, changes);
        saveCredentialsToStorage(credentials);
        return {credentials};
      }
    });
  }

  render() {
    if (this.state.credentials != null) {
      return (
        <AccountView
          credentials={this.state.credentials}
          handleLogout={() => this.handleLogout()}
          handleModifyCredentials={changes => this.handleModifyCredentials(changes)}
        />
      );
    } else {
      return (
        <Login handleLogin={credentials => this.handleLogin(credentials)} />
      );
    }
  }
  
}

export default App;
