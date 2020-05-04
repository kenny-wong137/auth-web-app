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
[ -d $HOME/nginx-conf ] && rm -rf $HOME/nginx-conf
[ -d $HOME/certs ] && rm -rf $HOME/certs
mkdir -p $HOME/dbfiles
mkdir -p $HOME/nginx-conf
mkdir -p $HOME/certs
if [ -f ssl-certificate.crt ] && [ -f ssl-certificate.key ]
then
  cp nginx-app-ssl.conf $HOME/nginx-conf
  cp ssl-certificate.crt $HOME/certs
  cp ssl-certificate.key $HOME/certs
else
  cp nginx-app.conf $HOME/nginx-conf
fi

# Start docker containers
docker-compose up -d
