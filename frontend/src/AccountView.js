import React from "react";
import PasswordChange from "./PasswordChange";
import MessageDisplay from "./MessageDisplay";

class AccountView extends React.Component {
  
  constructor(props) {
    super(props);
    
    this.state = {
      changingPassword: false
    };
  }
  
  handleStartPasswordChange() {
    this.setState({
      changingPassword: true
    });
  }
  
  handleEndPasswordChange() {
    this.setState({
      changingPassword: false
    })
  };
  
  renderStatusElement() {
    return (
      <table>
        <tbody>
          <tr>
            <td className="long">
              {"Logged in as " + this.props.credentials.username + "."}
            </td>
            <td>
              <button className="skinny" onClick={() => this.props.handleLogout()}>Logout</button>
            </td>
          </tr>
        </tbody>
      </table>
    );
  }
  
  renderChangePasswordElement() {
    if (this.state.changingPassword) {
      return (
        <PasswordChange
          credentials={this.props.credentials}
          handleLogout={() => this.props.handleLogout()}
          handleModifyCredentials={changes => this.props.handleModifyCredentials(changes)}
          handleEndPasswordChange={() => this.handleEndPasswordChange()}
        />
      );
    } else {
      return (
        <button className="wide"
                onClick={() => this.handleStartPasswordChange()}>
          Change password
        </button>
      );
    }
  }
  
  renderMessageDisplayElement() {
    if (this.state.changingPassword) {
      return null;
    } else {
      return (
        <MessageDisplay
          credentials={this.props.credentials}
          handleLogout={() => this.props.handleLogout()}
          handleModifyCredentials={changes => this.props.handleModifyCredentials(changes)}
        />
      );
    }
  }

  render() {    
    return (
      <div>
        {this.renderStatusElement()}
        {this.renderChangePasswordElement()}
        <br />
        {this.renderMessageDisplayElement()}
      </div>
    );
  }
  
}

export default AccountView;
