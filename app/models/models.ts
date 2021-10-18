/* eslint-disable import/no-dynamic-require */

import { Sequelize, DataTypes } from 'sequelize';

/* eslint-disable global-require */
const fs = require('fs');
const path = require('path');
// const sequelize = require('sequelize');

const basename = path.basename(__filename);

module.exports = (database: Sequelize) => {
  const db = {};
  fs.readdirSync(__dirname)
    .filter((file) => file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js')
    .forEach((file) => {
      const model = require(path.join(__dirname, file))(database, DataTypes);
      db[model.name] = model;
    });
  Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  return db;
};

export function get(database: Sequelize) {
  
}