const bcrypt = require('bcryptjs')
const crypto = require('crypto');
const axios = require('axios')
const { Environment, mnemonicGenerate } = require('storj');

module.exports = (Model, App) => {
  function pwdToHex(pwd) {
    return crypto.createHash('sha256').update(pwd).digest('hex')
  }

  function IdToBcrypt(id) {
    return bcrypt.hashSync(id, 8)
  }

  function getEnvironment(email, password, mnemonic) {
    return new Environment({
      bridgeUrl: 'http://localhost:6382/',
      bridgeUser: email,
      bridgePass: password,
      encryptionKey: mnemonic,
      logLevel: 4
    })
  }

  const RegisterBridgeUser = (email, password) => {
    const hashPwd = pwdToHex(password)
    return axios.post(
      'http://localhost:6382/users',
      { email, password: hashPwd }
    )
  }

  const CreateBucket = (email, password, mnemonic, name) => {
    const bucketName = name ? `${email}_${name}` : `${email}_ROOT`
    const storj = getEnvironment(email, password, mnemonic)
    return new Promise((resolve, reject) => {
      storj.createBucket(bucketName, function(err, res) {
        if (err) reject(err)
        resolve(res)
      })
    })
  }

  const DeleteBucket = (user, bucketId) => {
    const storj = getEnvironment(user.email, user.userId, user.mnemonic)
    return new Promise((resolve, reject) => {
      storj.deleteBucket(bucketId, function(err, result) {
        if (err) reject(err)
        resolve(result)
      })
    })
  }

  const StoreFile = (user, bucketId, fileName, filePath) => {
    return new Promise((resolve, reject) => {
      const storj = getEnvironment(user.email, user.userId, user.mnemonic)
      storj.storeFile(bucketId, filePath, {
        filename: fileName,
        progressCallback(progress, downloadedBytes, totalBytes) {
          App.logger.info('progress:', progress);
          App.logger.info('totalBytes:', totalBytes);
        },
        finishedCallback(err, fileId) {
          if (err) {
            App.logger.info(err);
            reject(err)
          }
          App.logger.info('File complete:', fileId);
          resolve(fileId)
        }
      });
    });
  }

  const ListBucketFiles = (user, bucketId) => {
    return new Promise((resolve, reject) => {
      const storj = getEnvironment(user.email, user.userId, user.mnemonic)
      storj.listFiles(bucketId, function(err, result) {
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
    ListBucketFiles
  }
}
