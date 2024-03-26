const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const bip39 = require('bip39');
const { request } = require('@internxt/lib');

const BUCKET_META_MAGIC = Buffer.from([
  66, 150, 71, 16, 50, 114, 88, 160, 163, 35, 154, 65, 162, 213, 226, 215, 70, 138, 57, 61, 52, 19, 210, 170, 38, 164,
  162, 200, 86, 201, 2, 81,
]);

module.exports = (Model, App) => {
  const log = App.logger;

  function encryptFilename(mnemonic, bucketId, decryptedName) {
    const seed = bip39.mnemonicToSeedSync(mnemonic).toString('hex');
    const sha512input = seed + bucketId;
    const bucketKey = crypto.createHash('sha512').update(Buffer.from(sha512input, 'hex')).digest('hex').slice(0, 64);

    if (!bucketKey) {
      throw Error('Bucket key missing');
    }

    const key = crypto.createHmac('sha512', Buffer.from(bucketKey, 'hex')).update(BUCKET_META_MAGIC).digest('hex');
    const iv = crypto
      .createHmac('sha512', Buffer.from(bucketKey, 'hex'))
      .update(bucketId)
      .update(decryptedName)
      .digest('hex');

    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      Buffer.from(key, 'hex').slice(0, 32),
      Buffer.from(iv, 'hex').slice(0, 32),
    );
    const encrypted = Buffer.concat([cipher.update(decryptedName, 'utf8'), cipher.final()]);
    const digest = cipher.getAuthTag();

    const finalEnc = Buffer.concat([digest, Buffer.from(iv, 'hex').slice(0, 32), encrypted]);

    return finalEnc.toString('base64');
  }

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

  const renameFile = (email, password, mnemonic, bucket, bucketEntry, newName) => {
    const pwdHash = pwdToHex(password);
    const credential = Buffer.from(`${email}:${pwdHash}`).toString('base64');

    // encryptFilename may throw an error
    const newNameEncrypted = encryptFilename(mnemonic, bucket, newName);

    const params = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credential}`,
      },
    };

    return axios.patch(
      `${App.config.get('STORJ_BRIDGE')}/buckets/${bucket}/files/${bucketEntry}`,
      {
        name: newNameEncrypted,
      },
      params,
    );
  };

  const RegisterBridgeUser = (email, password) => {
    const hashPwd = pwdToHex(password);

    const params = { headers: { 'Content-Type': 'application/json' } };
    const data = { email, password: hashPwd };

    return axios.post(`${App.config.get('STORJ_BRIDGE')}/users`, data, params).catch((err) => {
      throw new Error(request.extractMessageFromError(err));
    });
  };

  // TODO: Remove mnemonic param
  const CreateBucket = (email, password, mnemonic, name) => {
    const pwdHash = pwdToHex(password);
    const credential = Buffer.from(`${email}:${pwdHash}`).toString('base64');

    const params = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credential}`,
      },
    };

    log.info('[INXT createBucket]: User: %s, Bucket: %s', email, name);

    return axios
      .post(`${App.config.get('STORJ_BRIDGE')}/buckets`, {}, params)
      .then((res) => res.data)
      .catch((err) => {
        if (err.isAxiosError) {
          throw Error(err.response.data.error || 'Unknown error');
        }
        throw err;
      });
  };

  // TODO: updateBucketLimit is malfunctioning and no longer needed
  const updateBucketLimit = (bucketId, limit) => {
    const { GATEWAY_USER, GATEWAY_PASS } = process.env;

    return axios.patch(
      `${App.config.get('STORJ_BRIDGE')}/gateway/bucket/${bucketId}`,
      {
        maxFrameSize: limit,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        auth: { username: GATEWAY_USER, password: GATEWAY_PASS },
      },
    );
  };

  const addStorage = (email, bytes) => {
    const { GATEWAY_USER, GATEWAY_PASS } = process.env;

    return axios.put(
      `${App.config.get('STORJ_BRIDGE')}/gateway/storage`,
      {
        email,
        bytes,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        auth: { username: GATEWAY_USER, password: GATEWAY_PASS },
      },
    );
  };

  const addStorageByUUID = (uuid, bytes) => {
    const { GATEWAY_USER, GATEWAY_PASS } = process.env;

    return axios.put(
      `${App.config.get('STORJ_BRIDGE')}/gateway/increment-storage-by-uuid`,
      {
        uuid,
        bytes,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        auth: { username: GATEWAY_USER, password: GATEWAY_PASS },
      },
    );
  };

  const DeleteFile = (user, bucket, bucketEntry) => {
    const pwd = user.userId;
    const pwdHash = pwdToHex(pwd);
    const credential = Buffer.from(`${user.bridgeUser}:${pwdHash}`).toString('base64');

    const params = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credential}`,
      },
    };

    log.info('[INXT removeFile]: User: %s, Bucket: %s, File: %s', user.bridgeUser, bucket, bucketEntry);

    return axios.delete(`${App.config.get('STORJ_BRIDGE')}/buckets/${bucket}/files/${bucketEntry}`, params);
  };

  return {
    Name: 'Inxt',
    IdToBcrypt,
    RegisterBridgeUser,
    CreateBucket,
    updateBucketLimit,
    DeleteFile,
    renameFile,
    addStorage,
    addStorageByUUID,
  };
};
