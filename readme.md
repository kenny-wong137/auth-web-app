A minimal web app with user login and sign up implemented using JSON web tokens.
The app allows users to post their own messages and to read messages posted by other users.

Local deployment (Docker on Amazon Linux / Centos):
Run as root `bash local-install.sh`, open `http://localhost/` in Chrome.

If deploying something like this for real, make sure to use HTTPS, and remember to swap the SECRET for a real secret. 
