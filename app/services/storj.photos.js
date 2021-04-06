const fs = require('fs');
const mime = require('mime');
const bcrypt = require('bcryptjs');
const shortid = require('shortid');
const { Environment } = require('storj');
const prettysize = require('prettysize');
const { default: axios } = require('axios');

module.exports = (Model, App) => {
  const log = App.logger;
  // const CryptService = require('./crypt')(Model, App);

  function getEnvironment(email, password, mnemonic) {
    try {
      return new Environment({
        bridgeUrl: App.config.get('STORJ_BRIDGE'),
        bridgeUser: email,
        bridgePass: password,
        encryptionKey: mnemonic,
        logLevel: 0
      });
    } catch (error) {
      log.error('[NODE-LIB getEnvironment]', error);

      return null;
    }
  }

  const CreatePhotosBucket = (email, password, mnemonic, name) => {
    const bucketName = name
      ? `${name}_${shortid.generate()}`
      : `${shortid.generate()}_PHOTOS_ROOT`;
    try {
      const storj = getEnvironment(email, password, mnemonic);

      return new Promise((resolve, reject) => {
        storj.createBucket(bucketName, (err, res) => {
          if (err) {
            log.error('[NODE-LIB createPhotosBucket]', err);
            reject(err.message);
          } else {
            resolve(res);
          }
        });
      });
    } catch (error) {
      log.error('[NODE-LIB createPhotosBucket]', error);

      return null;
    }
  };

  function IdToBcrypt(id) {
    try {
      return bcrypt.hashSync(id.toString(), 8);
    } catch (error) {
      log.error('[BCRYPTJS]', error);

      return null;
    }
  }

  const StorePhoto = (user, bucketId, photoName, photoExt, photoPath) => new Promise((resolve, reject) => {
    const actualPhotoSize = fs.lstatSync(photoPath).size;
    const storj = getEnvironment(user.email, user.userId, user.mnemonic);

    storj.storeFile(bucketId, photoPath, {
      filename: photoName,
      progressCallback(progress, uploadedBytes, totalBytes) {
        log.warn(
          '[NODE-LIB %s] Photo Upload Progress: %s (%s%%)',
          user.email,
          prettysize(totalBytes),
          ((uploadedBytes * 100) / totalBytes).toFixed(2)
        );
      },
      finishedCallback(err, fileId) {
        if (err) {
          log.error('[NODE-LIB storePhoto]', err);
          reject(err);
        } else {
          log.warn('[NODE-LIB storePhoto] Photo upload finished');
          storj.destroy();

          user.getUsersphoto().then((usersPhoto) => {
            resolve({
              fileId,
              fileName: photoName,
              size: actualPhotoSize,
              ext: photoExt,
              bucketId,
              userId: usersPhoto.id
            });
          });
        }
      }
    });
  });

  const ResolvePhoto = (user, photo) => {
    const downloadDir = './downloads';
    const shortFileName = `${shortid.generate()}_${photo.fileId}`;
    const downloadFile = `${downloadDir}/${shortFileName}${photo.type ? `.${photo.type}` : ''}`;

    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir);
    }

    if (fs.existsSync(downloadFile)) {
      fs.unlinkSync(downloadFile);
    }

    return new Promise((resolve, reject) => {
      const storj = getEnvironment(user.email, user.userId, user.mnemonic);
      log.info(`Resolving photo ${photo.name}...`);

      storj.resolveFile(photo.bucketId, photo.fileId, downloadFile, {
        progressCallback: (progress, downloadedBytes, totalBytes) => {
          log.warn('[NODE-LIB PHOTOS %s] Download Progress: %s (%s%%)',
            user.email,
            prettysize(totalBytes),
            ((downloadedBytes * 100) / totalBytes).toFixed(2));
        },
        finishedCallback: (err) => {
          if (err) {
            log.error('[NODE-LIB PHOTOS %s] 1. Error resolving photo: %s', user.email, err.message);
            reject(err);
          } else {
            const mimetype = mime.getType(downloadFile);
            const filestream = fs.createReadStream(downloadFile);

            log.warn('[NODE-LIB PHOTOS %s] Photo resolved!', user.email);
            storj.destroy();
            resolve({ filestream, mimetype, downloadFile });
          }
        }
      });
    });
  };

  const IsUserActivated = (email) => {
    // Set api call settings
    const params = { headers: { 'Content-Type': 'application/json', email } };

    // Do api call
    return axios.get(`${App.config.get('STORJ_BRIDGE')}/users/isactivated`,
      params);
  };

  const DeletePhoto = (user, bucketId, photo) => new Promise((resolve, reject) => {
    const storj = getEnvironment(user.email, user.userId, user.mnemonic);
    storj.deleteFile(bucketId, photo, (err, result) => {
      if (err) {
        log.error('[NODE-LIB deletePhoto]', err);
        reject(Error(err));
      } else {
        resolve(result);
      }
    });
  });

  return {
    Name: 'StorjPhotos',
    IsUserActivated,
    CreatePhotosBucket,
    StorePhoto,
    ResolvePhoto,
    IdToBcrypt,
    DeletePhoto
  };
};
