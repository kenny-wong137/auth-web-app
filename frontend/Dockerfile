FROM node

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./

RUN npm install
RUN npm install pm2 -g

COPY . / ./

RUN echo 'pm2 start npm -- start' >> run.sh
RUN echo 'sleep infinity' >> run.sh

CMD bash run.sh   # NB this is a development server only!
