A minimal web app with user login and sign up implemented using JSON web tokens.
Written using Flask for the backend restAPI and React.js for the frontend UI.

The app allows users to post their own messages and to read messages posted by other users.

Local deployment instructions:
1) Install PostgreSQL. (As currently set up, the code assumes the username is *postgres* and the password is *password*.)
2) Install Anaconda. Pip install the packages gevent, psycopg2, passlib and pyjwt.
Run the backend/main.py Python script to start the Flask restAPI server.
3) Install Node.js. Open a terminal in the frontend folder and run `npm start` to start the React web app.
4) Open *http://localhost:5000* in a Chrome browser.

If deploying something like this for real, make sure to take the JWT secret out of the code,
and use HTTPS rather than HTTP (by providing the gevent WSGIServer with the path to a certificate file and a key file).
It is possible to use HTTPS during development on localhost by getting a self-signed certificate using e.g. OpenSSL.
