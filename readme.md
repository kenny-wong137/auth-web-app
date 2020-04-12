A minimal Flask web app with user login and sign up implemented using JSON web tokens.

The app allows users to post messages and read messages written by other users.

Local deployment instructions:
1) Install PostgreSQL. (As currently set up, the code assumes the username is *postgres* and the password is *password*.)
2) Install anaconda. Pip install the packages gevent, psycopg2, passlib and pyjwt.
3) Run the main.py Python script to start the server.
4) Open *http://localhost:5000* in a Chrome browser.
