"use strict";
var crypto = require('crypto');
var bcrypt = require('bcryptjs');
var axios = require('axios');
var bip39 = require('bip39');
var BUCKET_META_MAGIC = Buffer.from([66, 150, 71, 16, 50, 114, 88, 160, 163, 35, 154, 65, 162,
    213, 226, 215, 70, 138, 57, 61, 52, 19, 210, 170, 38, 164, 162, 200, 86, 201, 2, 81]);
module.exports = function (Model, App) {
    var log = App.logger;
    function encryptFilename(mnemonic, bucketId, decryptedName) {
        var seed = bip39.mnemonicToSeedSync(mnemonic).toString('hex');
        var sha512input = seed + bucketId;
        var bucketKey = crypto.createHash('sha512').update(Buffer.from(sha512input, 'hex')).digest('hex').slice(0, 64);
        if (!bucketKey) {
            throw Error('Bucket key missing');
        }
        var key = crypto.createHmac('sha512', Buffer.from(bucketKey, 'hex')).update(BUCKET_META_MAGIC).digest('hex');
        var iv = crypto.createHmac('sha512', Buffer.from(bucketKey, 'hex')).update(bucketId).update(decryptedName).digest('hex');
        var cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex').slice(0, 32), Buffer.from(iv, 'hex').slice(0, 32));
        var encrypted = Buffer.concat([cipher.update(decryptedName, 'utf8'), cipher.final()]);
        var digest = cipher.getAuthTag();
        var finalEnc = Buffer.concat([digest, Buffer.from(iv, 'hex').slice(0, 32), encrypted]);
        return finalEnc.toString('base64');
    }
    function pwdToHex(pwd) {
        try {
            return crypto.createHash('sha256').update(pwd).digest('hex');
        }
        catch (error) {
            log.error('[CRYPTO sha256] ', error);
            return null;
        }
    }
    function IdToBcrypt(id) {
        try {
            return bcrypt.hashSync(id.toString(), 8);
        }
        catch (error) {
            log.error('[BCRYPTJS]', error);
            return null;
        }
    }
    var renameFile = function (email, password, mnemonic, bucket, bucketEntry, newName) {
        var pwdHash = pwdToHex(password);
        var credential = Buffer.from(email + ":" + pwdHash).toString('base64');
        // encryptFilename may throw an error
        var newNameEncrypted = encryptFilename(mnemonic, bucket, newName);
        var params = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: "Basic " + credential
            }
        };
        return axios.patch(App.config.get('STORJ_BRIDGE') + "/buckets/" + bucket + "/files/" + bucketEntry, {
            name: newNameEncrypted
        }, params);
    };
    var RegisterBridgeUser = function (email, password) {
        var hashPwd = pwdToHex(password);
        var params = { headers: { 'Content-Type': 'application/json' } };
        var data = { email: email, password: hashPwd };
        return axios.post(App.config.get('STORJ_BRIDGE') + "/users", data, params);
    };
    // TODO: Remove mnemonic param
    var CreateBucket = function (email, password, mnemonic, name) {
        var pwdHash = pwdToHex(password);
        var credential = Buffer.from(email + ":" + pwdHash).toString('base64');
        var params = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: "Basic " + credential
            }
        };
        log.info('[INXT createBucket]: User: %s, Bucket: %s', email, name);
        return axios.post(App.config.get('STORJ_BRIDGE') + "/buckets", {}, params).then(function (res) { return res.data; }).catch(function (err) {
            if (err.isAxiosError) {
                throw Error(err.response.data.error || 'Unknown error');
            }
            throw err;
        });
    };
    var updateBucketLimit = function (bucketId, limit) {
        var _a = process.env, GATEWAY_USER = _a.GATEWAY_USER, GATEWAY_PASS = _a.GATEWAY_PASS;
        return axios.patch(App.config.get('STORJ_BRIDGE') + "/gateway/bucket/" + bucketId, {
            maxFrameSize: limit
        }, {
            headers: { 'Content-Type': 'application/json' },
            auth: { username: GATEWAY_USER, password: GATEWAY_PASS }
        });
    };
    var DeleteFile = function (user, bucket, bucketEntry) {
        var pwd = user.userId;
        var pwdHash = pwdToHex(pwd);
        var credential = Buffer.from(user.bridgeUser + ":" + pwdHash).toString('base64');
        var params = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: "Basic " + credential
            }
        };
        log.info('[INXT removeFile]: User: %s, Bucket: %s, File: %s', user.bridgeUser, bucket, bucketEntry);
        return axios.delete(App.config.get('STORJ_BRIDGE') + "/buckets/" + bucket + "/files/" + bucketEntry, params);
    };
    return {
        Name: 'Inxt',
        IdToBcrypt: IdToBcrypt,
        RegisterBridgeUser: RegisterBridgeUser,
        CreateBucket: CreateBucket,
        updateBucketLimit: updateBucketLimit,
        DeleteFile: DeleteFile,
        renameFile: renameFile
    };
};
