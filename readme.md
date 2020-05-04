A minimal web app with user login and sign up implemented using JSON web tokens.
The app allows users to post their own messages and to read messages posted by other users.

Local deployment (Amazon Linux / Centos):
Run as root `bash local-install.sh`, then open `http://localhost/` in Chrome.

If deploying something like this for real,
remember to swap POSTGRES_PASSWORD and JWT_SECRET for real secrets.
Also make sure to use https. If you save your certificate and key at the
top level of this repo folder as `ssl-certificate.crt` and `ssl-certificate.key`,
then the install script will set up the https connection for you.
