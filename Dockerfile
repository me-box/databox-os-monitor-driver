FROM amd64/alpine:3.8

ADD ./package.json /package.json
RUN apk add --no-cache make gcc g++ python nodejs npm curl git krb5-dev zeromq-dev && \
npm install zeromq --zmq-external --save && \
npm install --production && npm run clean && \
apk del make gcc g++ python curl git krb5-dev

ADD . .

LABEL databox.type="driver"

EXPOSE 8080

CMD ["npm","start"]
