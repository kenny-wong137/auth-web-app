FROM continuumio/anaconda3

WORKDIR /usr/src/app

RUN pip install psycopg2-binary
RUN pip install gevent
RUN pip install passlib
RUN pip install pyjwt

COPY . / ./

CMD python main.py
