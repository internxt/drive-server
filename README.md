### Drive Server

#### Prerrequisites

Node ^10.23.0

`npm i -g yarn pm2`

`sudo apt install curl pkg-config build-essential`

`yarn`

#### Database setup

Create schema and configure `config/environments/development.json`

Run `npm run migrate` to create tables.

#### Start app

Run `npm start` 

Run `npm run dev` to start with nodemon
