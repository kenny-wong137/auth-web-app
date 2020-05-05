A minimal web app with user login and sign up implemented using JSON web tokens.
Once logged in, a user can post messages and read messages posted by other users.

This project has taught me lots about React.js, Flask, PostgreSQL, Nginx and Docker,
as well as about how online authentication works.

**Deployment instructions (Amazon Linux / Centos)**

Run the installation script with root permissions, setting environment variable
values for the Postgres and JWT secrets and the paths to the SSL certificate and private key.
```
sudo POSTGRES_PASSWORD=monkeybusiness \
     JWT_SECRET=thegodfather2 \
     CRT_PATH=/home/myaccount/my-ssl-cert.crt \
     KEY_PATH=/home/myaccount/my-ssl-cert/key \
     bash install.sh
```

Your app should now be running on port 443 with HTTPS.

If you don't have an SSL certificate, you can run this app on port 80 with unsecure HTTP 
by omitting the `CRT_PATH` and `KEY_PATH` variables.
