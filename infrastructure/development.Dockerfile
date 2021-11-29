FROM node:14

WORKDIR /usr/app

COPY package*.json ./

RUN yarn

COPY . ./

CMD yarn migrate && yarn dev