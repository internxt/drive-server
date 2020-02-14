const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const axios = require('axios')
const shortid = require('shortid')
const { Environment } = require('storj');
const fs = require('fs')
const mime = require('mime');

module.exports = (Model, App) => {
  const logger = App.logger;

  function pwdToHex(pwd) {
    try {
      return crypto.createHash('sha256').update(pwd).digest('hex');
    } catch (error) {
      logger.error('[CRYPTO sha256] ' + error);
      return null;
    }
  }

  function IdToBcrypt(id) {
    try {
      return bcrypt.hashSync(id.toString(), 8);
    } catch (error) {
      logger.error('[BCRYPTJS] ', error);
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
        logLevel: 3
      });
    } catch (error) {
      logger.error('[NODE-LIB getEnvironment] ' + error);
      return null;
    }
  }

  const RegisterBridgeUser = (email, password) => {
    // Set variables
    const hashPwd = pwdToHex(password)

    // Set api call settings
    const params = { headers: { 'Content-Type': 'application/json' } };
    const data = {
      email,
      password: hashPwd
    }

    // Do api call
    return axios.post(
      `${App.config.get('STORJ_BRIDGE')}/users`,
      data,
      params
    ).then(response => response)
      .catch(error => error);
  }

  const IsUserActivated = (email) => {
    // Set api call settings
    const params = { headers: { 'Content-Type': 'application/json', email } };

    // Do api call
    return axios.get(`${App.config.get('STORJ_BRIDGE')}/users/isactivated`, params);
  }

  const CreateBucket = (email, password, mnemonic, name) => {
    const bucketName = name ? `${email}_${name}_${shortid.generate()}` : `${shortid.generate()}_${email}_ROOT`
    try {
      const storj = getEnvironment(email, password, mnemonic);
      return new Promise((resolve, reject) => {
        storj.createBucket(bucketName, function (err, res) {
          if (err) {
            logger.error('[NODE-LIB createBucket]: ' + err);
            reject(err.message)
          }
          resolve(res)
        })
      })
    } catch (error) {
      logger.error('[NODE-LIB createBucket] ', error);
      return null;
    }
  }

  const DeleteBucket = (user, bucketId) => {
    const storj = getEnvironment(user.email, user.userId, user.mnemonic)
    return new Promise((resolve, reject) => {
      storj.deleteBucket(bucketId, function (err, result) {
        if (err) reject(err)
        resolve(result)
      })
    })
  }

  const StoreFile = (user, bucketId, fileName, filePath) => {
    return new Promise((resolve, reject) => {
      const actualFileSize = fs.lstatSync(filePath).size;
      const storj = getEnvironment(user.email, user.userId, user.mnemonic)
      storj.storeFile(bucketId, filePath, {
        filename: fileName,
        progressCallback(progress, uploadedBytes, totalBytes) {
          App.logger.info('[NODE-LIB storeFile] Upload Progress: %s/%s (%s)', uploadedBytes, totalBytes, progress);
        },
        finishedCallback(err, fileId) {
          if (err) {
            App.logger.error('[NODE-LIB storeFile] ', err);
            reject(err)
          }
          App.logger.info('[NODE-LIB storeFile] File complete:', fileId);
          storj.destroy();
          resolve({ fileId, size: actualFileSize })
        }
      });
    });
  }

  const ResolveFile = (user, file) => {
    const downloadDir = './downloads'
    const downloadFile = `${downloadDir}/${file.name}.${file.type}`;

    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir);
    }

    if (fs.existsSync(downloadFile)) {
      fs.unlinkSync(downloadFile);
    }

    return new Promise((resolve, reject) => {
      const storj = getEnvironment(user.email, user.userId, user.mnemonic)
      App.logger.info(`Resolving file ${file.name}...`)

      // Storj call
      const state = storj.resolveFile(file.bucket, file.fileId, downloadFile, {
        progressCallback: (progress, downloadedBytes, totalBytes) => {
          App.logger.info('[NODE-LIB] Download file progress: %s/%s (%s)', downloadedBytes, totalBytes, progress);
        },
        finishedCallback: (err) => {
          if (err) {
            App.logger.error('[NODE-LIB] Error resolving file: ', err);
            reject(err)
          } else {
            const mimetype = mime.getType(downloadFile);
            const filestream = fs.createReadStream(downloadFile);

            App.logger.info('[NODE-LIB] File resolved!')
            resolve({ filestream, mimetype, downloadFile })
            storj.destroy();
          }
        }
      });
    });
  }

  const DeleteFile = (user, bucketId, file) => {
    return new Promise((resolve, reject) => {
      const storj = getEnvironment(user.email, user.userId, user.mnemonic)
      storj.deleteFile(bucketId, file, function (err, result) {
        if (err) {
          App.logger.error('[NODE-LIB deleteFile] ', err)
          reject(err)
        }
        resolve(result)
      })
    });
  }

  const ListBucketFiles = (user, bucketId) => {
    return new Promise((resolve, reject) => {
      const storj = getEnvironment(user.email, user.userId, user.mnemonic)
      storj.listFiles(bucketId, function (err, result) {
        if (err) reject(err)
        resolve(result)
      })
    });
  }

  return {
    Name: 'Storj',
    IdToBcrypt,
    RegisterBridgeUser,
    CreateBucket,
    DeleteBucket,
    StoreFile,
    ResolveFile,
    DeleteFile,
    ListBucketFiles,
    IsUserActivated
  }
}
