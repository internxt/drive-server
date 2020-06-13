const crypto = require('crypto');

const sequelize = require('sequelize');
const fetch = require('node-fetch');

const { Op } = sequelize;

module.exports = (Model, App) => {
  const FolderService = require('./folder')(Model, App);

  const FindOne = (token) => {
    return new Promise((resolve, reject) => {
      Model.shares
        .findOne({
          where: { token: { [Op.eq]: token } },
        })
        .then((result) => {
          if (result) {
            if (result.views == 1) {
              console.log('Token %s removed', token);
              result.destroy();
            } else {
              Model.shares.update(
                { views: result.views - 1 },
                { where: { id: { [Op.eq]: result.id } } }
              );
            }
            resolve(result)
          } else {
            reject('Token does not exists')
          }
        })
        .catch((err) => {
          console.error(err);
          reject('Error querying database');
        });
    });
  };

  const GenerateShortLink = (user, url) => {
    return new Promise(async (resolve, reject) => {
      if (!user || !url) {
        reject({ message: 'Required parameters are missing' });

        return;
      }

      const segmentedUrl = url.split('/');
      const token = segmentedUrl[segmentedUrl.length - 1];

      Model.shares
        .findAll({
          where: { token: { [Op.eq]: token }, user: { [Op.eq]: user } },
        })
        .then((shareInstanceDB) => {
          if (shareInstanceDB && shareInstanceDB.length > 0) {
            let reuse = 'false';

            if (shareInstanceDB[0].views > 1 && shareInstanceDB[0].views < 10) {
              reuse = 'true';
            }

            fetch(`${process.env.SHORTER_API_URL}`, {
              method: 'POST',
              headers: {
                'x-api-key': `${process.env.SHORTER_API_KEY}`,
                'Content-type': 'application/json',
              },
              body: JSON.stringify({ target: `${url}`, reuse }),
            })
              .then((res) => res.json())
              .then(resolve)
              .catch(reject);
          } else {
            reject({ message: 'url requested not valid' });
          }
        })
        .catch((err) => {
          reject({ message: 'Error accesing to db' });
        });
    });
  };

  const GenerateToken = (
    user,
    fileIdInBucket,
    mnemonic,
    isFolder = false,
    views = 1
  ) => {
    return new Promise(async (resolve, reject) => {
      // Required mnemonic
      if (!mnemonic) {
        reject('Mnemonic cannot be empty');

        return;
      }

      let itemExists = null;

      if (isFolder === 'true') {
        // Check if folder exists
        itemExists = await Model.folder.findOne({
          where: { id: { [Op.eq]: fileIdInBucket } },
        });
      } else {
        // Check if file exists
        itemExists = await Model.file.findOne({
          where: { fileId: { [Op.eq]: fileIdInBucket } },
        });
      }

      if (!itemExists) {
        reject('File not found');

        return;
      }

      const maxAcceptableSize = 1024 * 1024 * 300; // 300MB

      if (isFolder === 'true') {
        const tree = await FolderService.GetTree(
          { email: user },
          fileIdInBucket
        );

        if (tree) {
          const treeSize = await FolderService.GetTreeSize(tree);

          if (treeSize > maxAcceptableSize) {
            reject({ error: 'File too large' });

            return;
          }
        } else {
          reject();

          return;
        }
      } else if (itemExists.size > maxAcceptableSize) {
        reject({ error: 'File too large' });

        return;
      }

      // Generate a new token
      const newToken = crypto.randomBytes(5).toString('hex');

      Model.shares
        .findOne({
          where: { file: { [Op.eq]: fileIdInBucket }, user: { [Op.eq]: user } },
        })
        .then((tokenData) => {
          if (tokenData) {
            // Update token
            Model.shares.update(
              {
                token: newToken,
                mnemonic,
                is_folder: isFolder,
                views,
              },
              {
                where: { id: { [Op.eq]: tokenData.id } },
              }
            );
            resolve({ token: newToken });
          } else {
            Model.shares
              .create({
                token: newToken,
                mnemonic,
                file: fileIdInBucket,
                user,
                is_folder: isFolder,
                views,
              })
              .then((ok) => {
                resolve({ token: newToken });
              })
              .catch((err) => {
                reject({ error: 'Unable to create new token on db' });
              });
          }
        })
        .catch((err) => {
          console.error(err);
          reject('Error accesing to db');
        });
    });
  };

  return {
    Name: 'Share',
    FindOne,
    GenerateToken,
    GenerateShortLink,
  };
};
