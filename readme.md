A minimal web app with user login and sign up implemented using JSON web tokens.
The app allows users to post their own messages and to read messages posted by other users.

Local deployment (Amazon Linux / Centos):
Run as root `bash local-install.sh`, then open `http://localhost/` in Chrome.

If deploying something like this for real, make sure to use HTTPS,
and remember to swap POSTGRES_PASSWORD and JWT_SECRET for real secrets.
