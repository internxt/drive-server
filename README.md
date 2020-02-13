### XCloud Server

#### Prerrequisites

Node <= v10.16.0

sudo apt install curl pkg-config

npm install

#### Database setup

Create schema and configure `config/environments/development.json`

Run `npm run migrate` to create tables.

#### Start app

Run `npm start` 

Run `npm run dev` to start with nodemon
