import React from "react";
import {authenticate} from "./callouts";

class Login extends React.Component {
  
  constructor(props) {
    super(props);
    
    this.state = {
      username: "",
      password: "",
      error: ""
    };
  }
  
  handleChangeUsername(event) {
    this.setState({
      username: event.target.value
    });
  }
  
  handleChangePassword(event) {
    this.setState({
      password: event.target.value
    });
  }
  
  async handleSubmit(actionType) {
    try {
      const result = await authenticate(actionType, this.state.username, this.state.password);
      this.props.handleLogin(result.newCredentials);
    } catch (error) {
      if (typeof error == 'string') {
        this.setState({error});
      }
    }
  }

  render() {
    return (
      <div>
        <p className="heavy">Log in</p>
        <table>
          <tbody>
            <tr>
              <td className="key">Username</td>
              <td className="input">
                <input
                  value={this.state.username}
                  onChange={event => this.handleChangeUsername(event)}
                />
              </td>
            </tr>
            <tr>
              <td className="key">Password</td>
              <td className="input">
                <input
                  value={this.state.password}
                  onChange={event => this.handleChangePassword(event)}
                />
              </td>
            </tr>
          </tbody>
        </table>
        <button onClick={() => this.handleSubmit("login")}>Login</button>
        <button onClick={() => this.handleSubmit("register")}>Register</button>
        <p>{this.state.error}</p>
      </div>
    );
  }
  
}

export default Login;
