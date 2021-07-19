const crypto = require('crypto');
const fs = require('fs');

const bcrypt = require('bcryptjs');
const axios = require('axios');
const shortid = require('shortid');
const { Environment } = require('storj');
const mime = require('mime');
const prettysize = require('prettysize');
const CryptService = require('./crypt');

module.exports = (Model, App) => {
  const log = App.logger;
  const CryptServiceInstance = CryptService(Model, App);

  function pwdToHex(pwd) {
    try {
      return crypto.createHash('sha256').update(pwd).digest('hex');
    } catch (error) {
      log.error('[CRYPTO sha256] ', error);

      return null;
    }
  }

  function IdToBcrypt(id) {
    try {
      return bcrypt.hashSync(id.toString(), 8);
    } catch (error) {
      log.error('[BCRYPTJS]', error);

      return null;
    }
  }

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

  const RegisterBridgeUser = (email, password) => {
    // Set variables
    const hashPwd = pwdToHex(password);

    // Set api call settings
    const params = { headers: { 'Content-Type': 'application/json' } };
    const data = {
      email,
      password: hashPwd
    };

    // Do api call
    return axios
      .post(`${App.config.get('STORJ_BRIDGE')}/users`, data, params).then((response) => response).catch((err) => err);
  };

  const IsUserActivated = (email) => {
    // Set api call settings
    const params = { headers: { 'Content-Type': 'application/json', email } };

    // Do api call
    return axios.get(`${App.config.get('STORJ_BRIDGE')}/users/isactivated`,
      params);
  };

  const CreateBucket = (email, password, mnemonic, name) => {
    const bucketName = name
      ? `${name}_${shortid.generate()}`
      : `${shortid.generate()}_ROOT`;
    try {
      const storj = getEnvironment(email, password, mnemonic);

      return new Promise((resolve, reject) => {
        storj.createBucket(bucketName, (err, res) => {
          if (err) {
            log.error('[NODE-LIB createBucket]', err);
            reject(err.message);
          } else {
            resolve(res);
          }
        });
      });
    } catch (error) {
      log.error('[NODE-LIB createBucket]', error);

      return null;
    }
  };

  const DeleteBucket = (user, bucketId) => {
    const storj = getEnvironment(user.email, user.userId, user.mnemonic);

    return new Promise((resolve, reject) => {
      storj.deleteBucket(bucketId, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  };

  const StoreFile = (user, bucketId, fileName, filePath) => new Promise((resolve, reject) => {
    const actualFileSize = fs.lstatSync(filePath).size;
    const storj = getEnvironment(user.email, user.userId, user.mnemonic);
    storj.storeFile(bucketId, filePath, {
      filename: fileName,
      progressCallback(progress, uploadedBytes, totalBytes) {
        log.warn('[NODE-LIB %s] Upload Progress: %s (%s%%)',
          user.email,
          prettysize(totalBytes),
          ((uploadedBytes * 100) / totalBytes).toFixed(2));
      },
      finishedCallback(err, fileId) {
        if (err) {
          log.error('[NODE-LIB storeFile]', err);
          reject(err);
        } else {
          log.warn('[NODE-LIB storeFile] File upload finished');
          storj.destroy();
          resolve({ fileId, size: actualFileSize });
        }
      }
    });
  });

  const ResolveFile = (user, file) => {
    const downloadDir = './downloads';
    const shortFileName = `${shortid.generate()}_${file.fileId}`;
    const downloadFile = `${downloadDir}/${shortFileName}${file.type ? `.${file.type}` : ''}`;

    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir);
    }

    if (fs.existsSync(downloadFile)) {
      fs.unlinkSync(downloadFile);
    }

    return new Promise((resolve, reject) => {
      const storj = getEnvironment(user.email, user.userId, user.mnemonic);
      log.info(`Resolving file ${file.name}...`);

      storj.resolveFile(file.bucket, file.fileId, downloadFile, {
        progressCallback: (progress, downloadedBytes, totalBytes) => {
          log.warn('[NODE-LIB %s] Download Progress: %s (%s%%)',
            user.email,
            prettysize(totalBytes),
            ((downloadedBytes * 100) / totalBytes).toFixed(2));
        },
        finishedCallback: (err) => {
          if (err) {
            log.error('[NODE-LIB %s] 1. Error resolving file: %s', user.email, err.message);
            reject(err);
          } else {
            const mimetype = mime.getType(downloadFile);
            const filestream = fs.createReadStream(downloadFile);

            log.warn('[NODE-LIB %s] File resolved!', user.email);
            storj.destroy();
            resolve({ filestream, mimetype, downloadFile });
          }
        }
      });
    });
  };

  const ResolveFolderFile = (user, file, path = './downloads') => {
    const downloadDir = path;
    const decryptedFileName = CryptServiceInstance.decryptName(file.name, file.folder_id);
    const downloadFile = `${downloadDir}/${decryptedFileName}.${file.type}`;

    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir);
    }

    if (fs.existsSync(downloadFile)) {
      fs.unlinkSync(downloadFile);
    }

    return new Promise((resolve, reject) => {
      const storj = getEnvironment(user.email, user.userId, user.mnemonic);
      log.info(`Resolving file ${file.name}...`);

      // Storj call
      storj.resolveFile(file.bucket, file.fileId, downloadFile, {
        progressCallback: (progress, downloadedBytes, totalBytes) => {
          log.warn('[NODE-LIB] Download file progress: %s/%s (%s)',
            downloadedBytes,
            totalBytes,
            progress);
        },
        finishedCallback: (err) => {
          if (err) {
            log.error('[NODE-LIB] 2. Error resolving file:', err);
            reject(err);
          } else {
            const mimetype = mime.getType(downloadFile);
            const filestream = fs.createReadStream(downloadFile);

            log.warn('[NODE-LIB] File resolved!');
            storj.destroy();
            resolve({ filestream, mimetype, downloadFile });
          }
        }
      });
    });
  };

  const DeleteFile = (user, bucketId, file) => new Promise((resolve, reject) => {
    const storj = getEnvironment(user.email, user.userId, user.mnemonic);
    storj.deleteFile(bucketId, file, (err, result) => {
      if (err) {
        log.error('[NODE-LIB deleteFile]', err);
        reject(Error(err));
      } else {
        resolve(result);
      }
    });
  });

  const ListBuckets = (user) => new Promise((resolve, reject) => {
    const storj = getEnvironment(user.email, user.userId, user.mnemonic);
    storj.getBuckets((err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

  const ListBucketFiles = (user, bucketId) => new Promise((resolve, reject) => {
    const storj = getEnvironment(user.email, user.userId, user.mnemonic);
    storj.listFiles(bucketId, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

  return {
    Name: 'Storj',
    IdToBcrypt,
    RegisterBridgeUser,
    CreateBucket,
    DeleteBucket,
    StoreFile,
    ResolveFile,
    DeleteFile,
    ListBuckets,
    ListBucketFiles,
    IsUserActivated,
    ResolveFolderFile
  };
};
