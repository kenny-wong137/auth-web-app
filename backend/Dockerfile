FROM continuumio/anaconda3

WORKDIR /usr/src/app

RUN apt-get -y install gcc
RUN apt-get -y install libpq-dev
RUN pip install psycopg2

RUN pip install gevent
RUN pip install passlib
RUN pip install pyjwt

COPY . / ./

CMD python main.py
