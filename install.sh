#!/bin/bash

# Install docker
yum install -y docker
service docker start

# Install docker compose
curl -L https://github.com/docker/compose/releases/download/1.25.5/run.sh \
    -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# Create folders to store postgres files, nginx config and ssl certificate
[ -d $HOME/dbfiles ] && rm -rf $HOME/dbfiles
mkdir -p $HOME/dbfiles
[ -d $HOME/nginx-conf ] && rm -rf $HOME/nginx-conf
mkdir -p $HOME/nginx-conf
[ -d $HOME/certs ] && rm -rf $HOME/certs
mkdir -p $HOME/certs

if [ ! -z $CRT_PATH ] && [ ! -z $KEY_PATH ] && [ -f $CRT_PATH ] && [ -f $KEY_PATH ]
then
  echo 'Using SSL'
  cp nginx-app-ssl.conf $HOME/nginx-conf
  cp $CRT_PATH $HOME/certs/ssl-certificate.crt
  cp $KEY_PATH $HOME/certs/ssl-certificate.key
else
  echo 'Could not find SSL certificate'
  cp nginx-app.conf $HOME/nginx-conf
fi

# Put environment variables in environment file
# (Been having problems setting variables in the docker-compose file directly...)
echo "POSTGRES_PASSWORD=${POSTGRES_PASSWORD}" > backend.env
echo "JWT_SECRET=${JWT_SECRET}" >> backend.env

# Start docker containers
docker-compose up -d

# Remove environment file
rm backend.env
