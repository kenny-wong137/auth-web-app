#!/bin/bash

# Install docker
yum install -y docker
service docker start

# Create network for app
docker network create appnetwork

# Create docker container for postgres
docker pull postgres
mkdir -p $HOME/dbfiles
docker run -d --rm --name backend-db --network appnetwork \
    -e POSTGRES_PASSWORD=pgpassword -e PGDATA=/var/lib/postgresql/data/pgdata \
    -v $HOME/dbfiles:/var/lib/postgresql/data postgres

# Create docker container for rest api
docker build -t api backend/
docker run -d --rm --name backend-api --network appnetwork \
    -e POSTGRES_PASSWORD=pgpassword -e SECRET=secret api

# Create docker container for frontend
docker build -t ui frontend/
docker run -d --rm --name frontend-ui --network appnetwork ui

# Create docker container for nginx reverse proxy
docker pull nginx
mkdir -p $HOME/nginx-conf
cp nginx-app.conf $HOME/nginx-conf
docker run -d --rm --name reverse-proxy --network appnetwork \
    -v $HOME/nginx-conf:/etc/nginx/conf.d \
    -p 80:80 nginx
