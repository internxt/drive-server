const fs = require('fs');
const path = require('path');

const _ = require('lodash');

const basename = path.basename(__filename);

module.exports = (Database) => {
  const db = {};
  fs.readdirSync(__dirname)
    .filter(
      (file) =>
        file.indexOf('.') !== 0 &&
        file !== basename &&
        file.slice(-3) === '.js',
    )
    .forEach((file) => {
      const model = Database.instance.import(path.join(__dirname, file));
      if (_.has(model.sequelize.models, 'folderancestor')) {
        db.folderancestor = model.sequelize.models.folderancestor;
      }
      db[model.name] = model;
    });
  Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  return db;
};
