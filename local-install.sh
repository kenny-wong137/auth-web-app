#!/bin/bash

# Install docker
yum install -y docker
service docker start

# Install docker compose
curl -L https://github.com/docker/compose/releases/download/1.25.5/run.sh \
    -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# Create folders to store postgres files and nginx config
mkdir -p $HOME/dbfiles
mkdir -p $HOME/nginx-conf
cp nginx-app.conf $HOME/nginx-conf

# Start docker containers
docker-compose up -d
