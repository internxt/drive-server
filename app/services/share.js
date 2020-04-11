const crypto = require('crypto');
const sequelize = require('sequelize');

const Op = sequelize.Op;

module.exports = (Model, App) => {
  const FindOne = (token) => {
    return new Promise((resolve, reject) => {
      Model.shares.findOne({
        where: { token: { [Op.eq]: token } }
      }).then((result) => {
        if (result) {
          result.destroy();
          resolve(result.dataValues);
        } else {
          reject('Not valid token');
        }
      }).catch((err) => {
        console.error(err);
        reject('Error querying database');
      });
    });
  }

  const GenerateToken = (user, fileIdInBucket, mnemonic, isFolder = false) => {
    return new Promise(async (resolve, reject) => {
      // Required mnemonic
      if (!mnemonic) {
        reject('Mnemonic cannot be empty');
        return;
      }

      let itemExists = null;

      if (isFolder === 'true') {
        //Check if folder exists
        itemExists = await Model.folder.findOne({ where: { id: { [Op.eq]: fileIdInBucket } } });
      } else {
        // Check if file exists
        itemExists = await Model.file.findOne({ where: { fileId: { [Op.eq]: fileIdInBucket } } });
      }

      if (!itemExists) {
        reject('File not found');
        return;
      }

      // Generate a new token
      const newToken = crypto.randomBytes(5).toString('hex');

      Model.shares.findOne({
        where: { file: { [Op.eq]: fileIdInBucket }, user: { [Op.eq]: user } }
      }).then((tokenData) => {
        if (tokenData) {
          // Update token
          Model.shares.update(
            {
              token: newToken,
              mnemonic
            },
            {
              where: { id: { [Op.eq]: tokenData.id } }
            }
          );
          resolve({ token: newToken });
        } else {
          Model.shares.create({
            token: newToken,
            mnemonic,
            file: fileIdInBucket,
            user
          }).then((ok) => {
            resolve({ token: newToken });
          }).catch((err) => {
            reject({ error: 'Unable to create new token on db' })
          });
        }
      }).catch((err) => {
        console.error(err);
        reject('Error accesing to db');
      });
    });
  }

  return {
    Name: 'Share',
    FindOne,
    GenerateToken
  }
}
