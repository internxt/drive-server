# Drive Server

## Prerrequisites

* Node v10

  ```nvm install v10```

* Yarn

  ```npm i -g yarn pm2```

* Node-gyp essentials

  ```sudo apt install python build-essential```

# Install

```yarn```

#### Database setup (MariaDB)

Create schema and configure `config/environments/development.json`

Run `yarn run migrate` to create tables.

#### Start app

Run `yarn start` to start server in production mode.

Run `yarn run dev` to start with nodemon and development environment.
