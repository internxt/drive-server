/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const fs = require('fs');
const path = require('path');
const sequelize = require('sequelize');

const basename = path.basename(__filename);

module.exports = (Database) => {
  const db = {};
  fs.readdirSync(__dirname)
    .filter((file) => file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js')
    .forEach((file) => {
      const model = require(path.join(__dirname, file))(Database.instance, sequelize.DataTypes);
      db[model.name] = model;
    });
  Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  return db;
};
