FROM node:alpine

RUN apk add --update make gcc g++ python curl git krb5-dev zeromq-dev
ADD ./package.json /package.json
RUN npm install zeromq --zmq-external --save
RUN npm install --production && npm run clean

#FROM ubuntu:16.04

#RUN apt update && apt install -y curl libzmq5
#RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -
#RUN apt install -y nodejs build-essential
#ADD package.json package.json

ADD . .

LABEL databox.type="driver"

EXPOSE 8080

CMD ["npm","start"]
