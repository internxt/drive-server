const crypto = require('crypto');

module.exports = (Model, App) => {
  const FindOne = (token) => {
    return new Promise((resolve, reject) => {
      Model.shares.findOne({
        where: {
          token
        }
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

  const GenerateToken = (user, fileIdInBucket, mnemonic) => {
    return new Promise(async (resolve, reject) => {
      // Required mnemonic
      if (!mnemonic) {
        reject('Mnemonic cannot be empty');
        return;
      }

      // Check if file exists
      const fileExists = await Model.file.findOne({ where: { fileId: fileIdInBucket } });

      if (!fileExists) {
        reject('File not found');
        return;
      }

      // Generate a new token
      const newToken = crypto.randomBytes(5).toString('hex');

      Model.shares.findOne({
        where: {
          file: fileIdInBucket,
          user
        }
      }).then((tokenData) => {
        if (tokenData) {
          // Update token
          Model.shares.update(
            {
              token: newToken,
              mnemonic
            },
            {
              where: { id: tokenData.id }
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
