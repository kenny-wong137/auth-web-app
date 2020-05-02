import React from "react";
import {getUsernameList, getMessageList, sendNewMessage} from "./callouts";

class MessageDisplay extends React.Component {
  
  constructor(props) {
    super(props);
    
    this.accountHolderUsername = props.credentials.username;
    
    this.state = {
      usernameList: null,
      targetUsername: this.accountHolderUsername, // the person who we wish to render messages for
      renderedUsername: null,  // lags behind targetUsername due to async api callout latency
      usernamesToMessageLists: {},
      newMessage: ""
    };
    
    this.refreshTimer = null;
  }
  
  componentDidMount() {
    this.refresh();
  }
  
  componentWillUnmount() {
    if (this.refreshTimer != null) {
      clearTimeout(this.refreshTimer);
    }
  }
  
  async refresh() {      
    try {
      const usernamesResult = await getUsernameList(this.props.credentials);

      const targetUsername = this.state.targetUsername;
      const messagesResult = await getMessageList(targetUsername, this.props.credentials);

      const usernamesToMessageLists = Object.assign({}, this.state.usernamesToMessageLists);
      usernamesToMessageLists[targetUsername] = messagesResult.messageList;
      
      this.setState({
        usernameList: usernamesResult.usernameList,
        usernamesToMessageLists,
        renderedUsername: targetUsername
      });
      
      this.props.handleModifyCredentials(usernamesResult.newCredentials);
      this.props.handleModifyCredentials(messagesResult.newCredentials);
      
      if (this.refreshTimer != null) {
        clearTimeout(this.refreshTimer);
      }

      this.refreshTimer = setTimeout(
        () => this.refresh(),
        1000
      );
    } catch (error) {
      if (error == "Logged out") {
        this.props.handleLogout();
      }
    }
  }
  
  handleChangeTargetUsername(event) {
    this.setState({
      targetUsername: event.target.value
    });
    
    this.refresh();
  }
  
  handleChangeNewMessage(event) {
    this.setState({
      newMessage: event.target.value
    });
  }
  
  async handleSubmitNewMessage() {
    try {
      const result = await sendNewMessage(
        this.accountHolderUsername, this.state.newMessage, this.props.credentials
      );

      this.setState({
        newMessage: ""
      });
      
      this.props.handleModifyCredentials(result.newCredentials);
      
      this.refresh();
    } catch (error) {
      if (error == "Logged out") {
        this.props.handleLogout();
      }
    }
  }
  
  renderTargetUsernameSelector() {
    const selectOptions = this.state.usernameList.map(username => {
      let usernameText = username;
      if (username == this.accountHolderUsername) {
        usernameText += " (You)";
      }
      return <option key={username} value={username}>{usernameText}</option>;
    });
    
    return (
      <div>
        Showing posts by
        <select value={this.state.targetUsername}
                onChange={event => this.handleChangeTargetUsername(event)}>
          {selectOptions}
        </select>
      </div>
    );
  }
  
  renderMessages() {
    if (this.state.renderedUsername != null) {    
      let messageList = [];
      if (this.state.renderedUsername in this.state.usernamesToMessageLists) {
        messageList = this.state.usernamesToMessageLists[this.state.renderedUsername];
      }
      
      const messageItems = messageList.map((message, index) => {
        return <li key={index}>{message}</li>;
      });
      
      return <ul>{messageItems}</ul>;
    } else {
      return null;
    }
  }
  
  renderNewMessageBox() {
    if (this.state.renderedUsername == this.accountHolderUsername) {
      return (
        <div>
          <p>New post</p>
          <textarea value={this.state.newMessage}
                    onChange={event => this.handleChangeNewMessage(event)} />
          <br />
          <button onClick={() => this.handleSubmitNewMessage()}>Submit</button>
        </div>
      );
    } else {
      return null;
    }
  }
  
  render() {
    if (this.state.usernameList != null) {
      return (
        <div>
          {this.renderTargetUsernameSelector()}
          {this.renderMessages()}
          {this.renderNewMessageBox()}
        </div>
      );
    } else {
      return null;
    }
  }
  
}

export default MessageDisplay;
