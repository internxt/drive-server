const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const axios = require('axios');

module.exports = (Model, App) => {
  const log = App.logger;

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

  const RegisterBridgeUser = (email, password) => {
    const hashPwd = pwdToHex(password);

    const params = { headers: { 'Content-Type': 'application/json' } };
    const data = { email, password: hashPwd };

    return axios.post(`${App.config.get('STORJ_BRIDGE')}/users`, data, params);
  };

  const CreateBucket = (email, password, mnemonic, name) => {
    const pwdHash = pwdToHex(password);
    const credential = Buffer.from(`${email}:${pwdHash}`).toString('base64');

    const params = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credential}`
      }
    };

    log.info('[INXT createBucket]: User: %s, Bucket: %s', email, name);

    return axios.post(`${App.config.get('STORJ_BRIDGE')}/buckets`, {}, params).then((res) => res.data).catch((err) => {
      if (err.isAxiosError) {
        throw Error(err.response.data.error || 'Unknown error');
      }
      throw err;
    });
  };

  const DeleteFile = (user, bucket, bucketEntry) => {
    const pwd = user.userId;
    const pwdHash = pwdToHex(pwd);
    const credential = Buffer.from(`${user.bridgeUser}:${pwdHash}`).toString('base64');

    const params = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credential}`
      }
    };

    log.info('[INXT removeFile]: User: %s, Bucket: %s, File: %s', user.bridgeUser, bucket, bucketEntry);

    return axios.delete(`${App.config.get('STORJ_BRIDGE')}/buckets/${bucket}/files/${bucketEntry}`, params);
  };

  return {
    Name: 'Storj',
    IdToBcrypt,
    RegisterBridgeUser,
    CreateBucket,
    DeleteFile
  };
};
