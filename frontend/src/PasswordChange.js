import React from "react";
import {changePassword} from "./callouts";

class PasswordChange extends React.Component {
  
  constructor(props) {
    super(props);
    
    this.state = {
      oldPassword: "",
      newPassword: "",
      error: "",
    };
  }

  handleChangeOldPassword(event) {
    this.setState({
      oldPassword: event.target.value
    });
  }
  
  handleChangeNewPassword(event) {
    this.setState({
      newPassword: event.target.value
    });
  }

  async handleSubmit() {
    try {
      const result = await changePassword(
        this.state.oldPassword, this.state.newPassword, this.props.credentials
      );
      
      this.props.handleModifyCredentials(result.newCredentials);
      this.props.handleEndPasswordChange();
    } catch (error) {
      if (error == "Logged out") {
        this.props.handleLogout();
      } else {
        if (typeof error == 'string') {
          this.setState({error});
        }
      }
    }
  }

  render() {
    return (
      <div>
        <table>
          <tbody>
            <tr>
              <td className="key">Old password:</td>
              <td className="input">
                <input
                  type="password"
                  value={this.state.oldPassword}
                  onChange={event => this.handleChangeOldPassword(event)}
                />
              </td>
            </tr>
            <tr>
              <td className="key">New password:</td>
              <td className="input">
                <input
                  type="password"
                  value={this.state.newPassword}
                  onChange={event => this.handleChangeNewPassword(event)}
                />
              </td>
            </tr>
          </tbody>
        </table>
        <button onClick={() => this.handleSubmit()}>Submit</button>
        <button onClick={() => this.props.handleEndPasswordChange()}>Cancel</button>
        <p>{this.state.error}</p>
      </div>
    );
  }
  
}

export default PasswordChange;
