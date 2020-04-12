A minimal Flask web app with user login and sign up implemented using JSON web tokens.

The app allows users to post their own messages and to read messages posted by other users.

Local deployment instructions:
1) Install PostgreSQL. (As currently set up, the code assumes the username is *postgres* and the password is *password*.)
2) Install anaconda. Pip install the packages gevent, psycopg2, passlib and pyjwt.
3) Run the main.py Python script to start the server.
4) Open *http://localhost:5000* in a Chrome browser.

If deploying something like this for real, make sure to take the JWT secret out of the code,
and use HTTPS rather than HTTP (by providing the gevent WSGIServer with the path to a certificate file and a key file).
It is possible to use HTTPS during development on localhost by getting a self-signed certificate using e.g. OpenSSL.
