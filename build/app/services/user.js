"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var axios = require('axios');
var sequelize = require('sequelize');
var async = require('async');
var CryptoJS = require('crypto-js');
var crypto = require('crypto');
var AnalyticsService = require('./analytics');
var KeyServerService = require('./keyserver');
var passport = require('../middleware/passport');
var SYNC_KEEPALIVE_INTERVAL_MS = require('../constants').SYNC_KEEPALIVE_INTERVAL_MS;
var Op = sequelize.Op, col = sequelize.col, fn = sequelize.fn;
module.exports = function (Model, App) {
    var Logger = App.logger;
    var KeyServer = KeyServerService(Model, App);
    var analytics = AnalyticsService(Model, App);
    var FindOrCreate = function (user) {
        // Create password hashed pass only when a pass is given
        var userPass = user.password ? App.services.Crypt.decryptText(user.password) : null;
        var userSalt = user.salt ? App.services.Crypt.decryptText(user.salt) : null;
        // Throw error when user email. pass, salt or mnemonic is missing
        if (!user.email || !userPass || !userSalt || !user.mnemonic) {
            throw Error('Wrong user registration data');
        }
        return Model.users.sequelize.transaction(function (t) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Model.users.findOrCreate({
                        where: { username: user.email },
                        defaults: {
                            email: user.email,
                            name: user.name,
                            lastname: user.lastname,
                            password: userPass,
                            mnemonic: user.mnemonic,
                            hKey: userSalt,
                            referral: user.referral,
                            uuid: null,
                            credit: user.credit,
                            welcomePack: true,
                            registerCompleted: user.registerCompleted,
                            username: user.username,
                            bridgeUser: user.bridgeUser
                        },
                        transaction: t
                    }).then(function (_a) {
                        var userResult = _a[0], isNewRecord = _a[1];
                        return __awaiter(void 0, void 0, void 0, function () {
                            var bcryptId, bridgeUser;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        if (!isNewRecord) return [3 /*break*/, 4];
                                        if (user.publicKey && user.privateKey && user.revocationKey) {
                                            Model.keyserver.findOrCreate({
                                                where: { user_id: userResult.id },
                                                defaults: {
                                                    user_id: user.id,
                                                    private_key: user.privateKey,
                                                    public_key: user.publicKey,
                                                    revocation_key: user.revocationKey,
                                                    encrypt_version: null
                                                },
                                                transaction: t
                                            });
                                        }
                                        return [4 /*yield*/, App.services.Inxt.IdToBcrypt(userResult.email)];
                                    case 1:
                                        bcryptId = _b.sent();
                                        return [4 /*yield*/, App.services.Inxt.RegisterBridgeUser(userResult.email, bcryptId)];
                                    case 2:
                                        bridgeUser = _b.sent();
                                        if (bridgeUser && bridgeUser.response && (bridgeUser.response.status === 500 || bridgeUser.response.status === 400)) {
                                            throw Error(bridgeUser.response.data.error);
                                        }
                                        if (!bridgeUser.data) {
                                            throw Error('Error creating bridge user');
                                        }
                                        Logger.info('User Service | created brigde user: %s', userResult.email);
                                        // Store bcryptid on user register
                                        return [4 /*yield*/, userResult.update({
                                                userId: bcryptId,
                                                uuid: bridgeUser.data.uuid
                                            }, { transaction: t })];
                                    case 3:
                                        // Store bcryptid on user register
                                        _b.sent();
                                        // Set created flag for Frontend management
                                        Object.assign(userResult, { isNewRecord: isNewRecord });
                                        _b.label = 4;
                                    case 4: 
                                    // TODO: proveriti userId kao pass
                                    return [2 /*return*/, userResult];
                                }
                            });
                        });
                    }).catch(function (err) {
                        if (err.response) {
                            // This happens when email is registered in bridge
                            Logger.error(err.response.data);
                        }
                        else {
                            Logger.error(err.stack);
                        }
                        throw Error(err);
                    })];
            });
        }); }); // end transaction
    };
    var InitializeUser = function (user) { return Model.users.sequelize.transaction(function (t) {
        var _a;
        return Model.users
            .findOne({ where: { username: (_a = {}, _a[Op.eq] = user.email, _a) } }).then(function (userData) { return __awaiter(void 0, void 0, void 0, function () {
            var _a, Inxt, Crypt, rootBucket, rootFolderName, rootFolder, updatedUser;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (userData.root_folder_id) {
                            userData.mnemonic = user.mnemonic;
                            return [2 /*return*/, userData];
                        }
                        _a = App.services, Inxt = _a.Inxt, Crypt = _a.Crypt;
                        return [4 /*yield*/, Inxt.CreateBucket(userData.email, userData.userId, user.mnemonic)];
                    case 1:
                        rootBucket = _b.sent();
                        Logger.info('User init | root bucket created %s', rootBucket.name);
                        return [4 /*yield*/, Crypt.encryptName("" + rootBucket.name)];
                    case 2:
                        rootFolderName = _b.sent();
                        return [4 /*yield*/, userData.createFolder({
                                name: rootFolderName,
                                bucket: rootBucket.id
                            })];
                    case 3:
                        rootFolder = _b.sent();
                        Logger.info('User init | root folder created, id: %s', rootFolder.id);
                        // Update user register with root folder Id
                        return [4 /*yield*/, userData.update({ root_folder_id: rootFolder.id }, { transaction: t })];
                    case 4:
                        // Update user register with root folder Id
                        _b.sent();
                        updatedUser = userData;
                        updatedUser.mnemonic = user.mnemonic;
                        updatedUser.bucket = rootBucket.id;
                        return [2 /*return*/, updatedUser];
                }
            });
        }); });
    }); };
    var FindUserByEmail = function (email) { return new Promise(function (resolve, reject) {
        var _a;
        Model.users
            .findOne({ where: { username: (_a = {}, _a[Op.eq] = email, _a) } }).then(function (userData) {
            if (!userData) {
                Logger.error('ERROR user %s not found on database', email);
                return reject(Error('Wrong email/password'));
            }
            var user = userData.dataValues;
            if (user.mnemonic) {
                user.mnemonic = user.mnemonic.toString();
            }
            return resolve(user);
        }).catch(function (err) { return reject(err); });
    }); };
    var FindUserByUuid = function (userUuid) {
        var _a;
        return Model.users.findOne({ where: { uuid: (_a = {}, _a[Op.eq] = userUuid, _a) } });
    };
    var FindUserObjByEmail = function (email) {
        var _a;
        return Model.users.findOne({ where: { username: (_a = {}, _a[Op.eq] = email, _a) } });
    };
    var DeactivateUser = function (email) { return new Promise(function (resolve, reject) {
        var _a;
        return Model.users
            .findOne({ where: { username: (_a = {}, _a[Op.eq] = email, _a) } }).then(function (user) {
            var password = CryptoJS.SHA256(user.userId).toString();
            var auth = Buffer.from(user.email + ":" + password).toString('base64');
            axios
                .delete(App.config.get('STORJ_BRIDGE') + "/users/" + email, {
                headers: {
                    Authorization: "Basic " + auth,
                    'Content-Type': 'application/json'
                }
            }).then(function (data) {
                resolve(data);
            }).catch(function (err) {
                Logger.warn(err.response.data);
                reject(err);
            });
        }).catch(reject);
    }); };
    var ConfirmDeactivateUser = function (token) {
        var userEmail = null;
        return async.waterfall([
            function (next) {
                axios
                    .get(App.config.get('STORJ_BRIDGE') + "/deactivationStripe/" + token, {
                    headers: { 'Content-Type': 'application/json' }
                }).then(function (res) {
                    Logger.warn('User deleted from bridge');
                    next(null, res);
                }).catch(function (err) {
                    Logger.error('Error user deleted from bridge: %s', err.message);
                    next(err.response.data.error || err.message);
                });
            },
            function (data, next) {
                var _a;
                userEmail = data.data.email;
                Model.users.findOne({ where: { username: (_a = {}, _a[Op.eq] = userEmail, _a) } }).then(function (user) { return __awaiter(void 0, void 0, void 0, function () {
                    var keys, appSumo, usersPhoto, photos, photoIds, err_1, tempUsername;
                    var _a, _b;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                if (!user) {
                                    return [2 /*return*/];
                                }
                                _c.label = 1;
                            case 1:
                                _c.trys.push([1, 19, , 21]);
                                // DELETE FOREIGN KEYS (not cascade)
                                user.root_folder_id = null;
                                return [4 /*yield*/, user.save()];
                            case 2:
                                _c.sent();
                                return [4 /*yield*/, user.getKeyserver()];
                            case 3:
                                keys = _c.sent();
                                if (!keys) return [3 /*break*/, 5];
                                return [4 /*yield*/, keys.destroy()];
                            case 4:
                                _c.sent();
                                _c.label = 5;
                            case 5: return [4 /*yield*/, user.getAppSumo()];
                            case 6:
                                appSumo = _c.sent();
                                if (!appSumo) return [3 /*break*/, 8];
                                return [4 /*yield*/, appSumo.destroy()];
                            case 7:
                                _c.sent();
                                _c.label = 8;
                            case 8: return [4 /*yield*/, user.getUsersphoto()];
                            case 9:
                                usersPhoto = _c.sent();
                                if (!usersPhoto) return [3 /*break*/, 15];
                                return [4 /*yield*/, usersPhoto.getPhotos()];
                            case 10:
                                photos = _c.sent();
                                photoIds = photos.map(function (x) { return x.id; });
                                if (!(photoIds.length > 0)) return [3 /*break*/, 13];
                                return [4 /*yield*/, Model.previews.destroy({ where: { photoId: (_a = {}, _a[Op.in] = photoIds, _a) } })];
                            case 11:
                                _c.sent();
                                return [4 /*yield*/, Model.photos.destroy({ where: { id: (_b = {}, _b[Op.in] = photoIds, _b) } })];
                            case 12:
                                _c.sent();
                                _c.label = 13;
                            case 13:
                                if (!usersPhoto) return [3 /*break*/, 15];
                                return [4 /*yield*/, usersPhoto.destroy()];
                            case 14:
                                _c.sent();
                                _c.label = 15;
                            case 15: return [4 /*yield*/, Model.backup.destroy({ where: { userId: user.id } })];
                            case 16:
                                _c.sent();
                                return [4 /*yield*/, Model.device.destroy({ where: { userId: user.id } })];
                            case 17:
                                _c.sent();
                                return [4 /*yield*/, user.destroy()];
                            case 18:
                                _c.sent();
                                Logger.info('User deactivation, remove on sql: %s', userEmail);
                                return [3 /*break*/, 21];
                            case 19:
                                err_1 = _c.sent();
                                tempUsername = user.email + "-" + crypto.randomBytes(5).toString('hex') + "-DELETED";
                                Logger.error('ERROR deactivation, user %s renamed to: %s. Reason: %s', user.email, tempUsername, err_1.message);
                                user.email = tempUsername;
                                user.username = tempUsername;
                                user.bridgeUser = tempUsername;
                                return [4 /*yield*/, user.save()];
                            case 20:
                                _c.sent();
                                return [3 /*break*/, 21];
                            case 21:
                                analytics.track({
                                    userId: user.uuid,
                                    event: 'user-deactivation-confirm',
                                    properties: { email: userEmail }
                                });
                                next();
                                return [2 /*return*/];
                        }
                    });
                }); }).catch(next);
            }
        ]);
    };
    var Store2FA = function (user, key) {
        var _a;
        return Model.users.update({ secret_2FA: key }, { where: { username: (_a = {}, _a[Op.eq] = user, _a) } });
    };
    var Delete2FA = function (user) {
        var _a;
        return Model.users.update({ secret_2FA: null }, { where: { username: (_a = {}, _a[Op.eq] = user, _a) } });
    };
    var updatePrivateKey = function (user, privateKey) {
        var _a;
        return Model.keyserver.update({
            private_key: privateKey
        }, {
            where: { user_id: (_a = {}, _a[Op.eq] = user.id, _a) }
        });
    };
    var UpdatePasswordMnemonic = function (user, currentPassword, newPassword, newSalt, mnemonic, privateKey) { return __awaiter(void 0, void 0, void 0, function () {
        var storedPassword;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    storedPassword = user.password.toString();
                    if (storedPassword !== currentPassword) {
                        throw Error('Invalid password');
                    }
                    return [4 /*yield*/, Model.users.update({
                            password: newPassword,
                            mnemonic: mnemonic,
                            hKey: newSalt
                        }, {
                            where: { username: (_a = {}, _a[Op.eq] = user.email, _a) }
                        })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, updatePrivateKey(user, privateKey)];
                case 2:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var recoverPassword = function (user, newPassword, newSalt, oldMnemonic, oldPrivateKey) { return __awaiter(void 0, void 0, void 0, function () {
        var keys;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Update password, salt & mnemonic
                    user.hKey = newSalt;
                    user.mnemonic = oldMnemonic;
                    user.password = newPassword;
                    return [4 /*yield*/, user.save()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, user.getKeyserver()];
                case 2:
                    keys = _a.sent();
                    if (!!oldPrivateKey) return [3 /*break*/, 3];
                    keys.destroy();
                    return [3 /*break*/, 5];
                case 3:
                    keys.private_key = oldPrivateKey;
                    return [4 /*yield*/, keys.save().catch(function () {
                            // eslint-disable-next-line no-empty
                        })];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var LoginFailed = function (user, loginFailed) { return Model.users.update({
        errorLoginCount: loginFailed ? sequelize.literal('error_login_count + 1') : 0
    }, { where: { username: user } }); };
    var ResendActivationEmail = function (user) { return axios.post(process.env.STORJ_BRIDGE + "/activations", { email: user }); };
    var UpdateAccountActivity = function (user) { return Model.users.update({ updated_at: new Date() }, { where: { username: user } }); };
    var getSyncDate = function () {
        var syncDate = Date.now();
        syncDate += SYNC_KEEPALIVE_INTERVAL_MS;
        return new Date(syncDate);
    };
    var hasUserSyncEnded = function (sync) {
        if (!sync) {
            return true;
        }
        var now = Date.now();
        var syncTime = sync.getTime();
        return now - syncTime > SYNC_KEEPALIVE_INTERVAL_MS;
    };
    var GetUserBucket = function (userObject) {
        var _a;
        return Model.folder.findOne({
            where: { id: (_a = {}, _a[Op.eq] = userObject.root_folder_id, _a) },
            attributes: ['bucket']
        }).then(function (folder) { return folder.bucket; }).catch(function () { return null; });
    };
    var UpdateUserSync = function (user, toNull) { return __awaiter(void 0, void 0, void 0, function () {
        var sync, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sync = null;
                    if (!toNull) {
                        sync = getSyncDate();
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, Model.users.update({ syncDate: sync }, { where: { username: user.email } })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    Logger.error(err_2);
                    throw Error('Internal server error');
                case 4: return [2 /*return*/, sync];
            }
        });
    }); };
    var GetOrSetUserSync = function (user) { return __awaiter(void 0, void 0, void 0, function () {
        var currentSync, userSyncEnded;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    currentSync = user.syncDate;
                    userSyncEnded = hasUserSyncEnded(currentSync);
                    if (!(!currentSync || userSyncEnded)) return [3 /*break*/, 2];
                    return [4 /*yield*/, UpdateUserSync(user, false)];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [2 /*return*/, !userSyncEnded];
            }
        });
    }); };
    var UnlockSync = function (user) {
        user.syncDate = null;
        return user.save();
    };
    var RegisterUser = function (newUser) { return __awaiter(void 0, void 0, void 0, function () {
        var email, password, hasReferral, referrer, userData, token, user, keys, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    email = newUser.email, password = newUser.password;
                    // Data validation for process only request with all data
                    if (!(email && password)) {
                        throw Error('You must provide registration data');
                    }
                    newUser.email = newUser.email.toLowerCase().trim();
                    newUser.username = newUser.email;
                    newUser.bridgeUser = newUser.email;
                    newUser.credit = 0;
                    newUser.referral = newUser.referrer;
                    Logger.warn('Register request for %s', email);
                    hasReferral = false;
                    referrer = null;
                    return [4 /*yield*/, FindOrCreate(newUser)];
                case 1:
                    userData = _a.sent();
                    if (!userData) {
                        throw Error('User can not be created');
                    }
                    if (!userData.isNewRecord) {
                        throw Error('This account already exists');
                    }
                    if (hasReferral) {
                        analytics.identify({
                            userId: userData.uuid,
                            traits: { referred_by: referrer.uuid }
                        });
                    }
                    token = passport.Sign(userData.email, App.config.get('secrets').JWT);
                    user = {
                        userId: userData.userId,
                        mnemonic: userData.mnemonic,
                        root_folder_id: userData.root_folder_id,
                        name: userData.name,
                        lastname: userData.lastname,
                        uuid: userData.uuid,
                        credit: userData.credit,
                        createdAt: userData.createdAt,
                        registerCompleted: userData.registerCompleted,
                        email: userData.email,
                        username: userData.username,
                        bridgeUser: userData.bridgeUser
                    };
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, KeyServer.getKeys(userData)];
                case 3:
                    keys = _a.sent();
                    user.privateKey = keys.private_key;
                    user.publicKey = keys.public_key;
                    user.revocationKey = keys.revocation_key;
                    return [3 /*break*/, 5];
                case 4:
                    e_1 = _a.sent();
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/, { token: token, user: user, uuid: userData.uuid }];
            }
        });
    }); };
    var updateKeys = function (user, data) { return __awaiter(void 0, void 0, void 0, function () {
        var userKeys;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!data.privateKey) {
                        throw new Error('No Private key provided');
                    }
                    if (!data.publicKey) {
                        throw new Error('No Public key provided');
                    }
                    if (!data.revocationKey) {
                        throw new Error('No Revocation key provided');
                    }
                    return [4 /*yield*/, user.getKeyserver()];
                case 1:
                    userKeys = _a.sent();
                    userKeys.private_key = data.privateKey;
                    userKeys.public_key = data.publicKey;
                    userKeys.revocation_key = data.revocationKey;
                    return [2 /*return*/, userKeys.save()];
            }
        });
    }); };
    var getUsage = function (user) { return __awaiter(void 0, void 0, void 0, function () {
        var targetUser, usage, driveUsage, photosUsage, backupsQuery, backupsUsage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Model.users.findOne({ where: { username: user.bridgeUser } })];
                case 1:
                    targetUser = _a.sent();
                    return [4 /*yield*/, Model.folder.findAll({
                            where: { user_id: targetUser.id },
                            include: [{ model: Model.file, attributes: [] }],
                            attributes: [[fn('sum', col('size')), 'total']],
                            raw: true
                        })];
                case 2:
                    usage = _a.sent();
                    driveUsage = usage[0].total;
                    return [4 /*yield*/, (function () { return __awaiter(void 0, void 0, void 0, function () {
                            var photosUser, photosList, photosSizeList;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, Model.usersphotos.findOne({ where: { userId: targetUser.id } })];
                                    case 1:
                                        photosUser = _a.sent();
                                        return [4 /*yield*/, photosUser.getPhotos()];
                                    case 2:
                                        photosList = _a.sent();
                                        photosSizeList = photosList.map(function (p) { return p.size; });
                                        return [2 /*return*/, photosSizeList.reduce(function (a, b) { return a + b; })];
                                }
                            });
                        }); })().catch(function () { return 0; })];
                case 3:
                    photosUsage = _a.sent();
                    return [4 /*yield*/, Model.backup.findAll({
                            where: { userId: targetUser.id },
                            attributes: [[fn('sum', col('size')), 'total']],
                            raw: true
                        })];
                case 4:
                    backupsQuery = _a.sent();
                    backupsUsage = backupsQuery[0].total ? backupsQuery[0].total : 0;
                    return [2 /*return*/, {
                            total: driveUsage + photosUsage + backupsUsage, _id: user.email, photos: photosUsage, drive: driveUsage || 0, backups: backupsUsage
                        }];
            }
        });
    }); };
    return {
        Name: 'User',
        FindOrCreate: FindOrCreate,
        RegisterUser: RegisterUser,
        FindUserByEmail: FindUserByEmail,
        FindUserObjByEmail: FindUserObjByEmail,
        FindUserByUuid: FindUserByUuid,
        InitializeUser: InitializeUser,
        DeactivateUser: DeactivateUser,
        ConfirmDeactivateUser: ConfirmDeactivateUser,
        Store2FA: Store2FA,
        Delete2FA: Delete2FA,
        UpdatePasswordMnemonic: UpdatePasswordMnemonic,
        LoginFailed: LoginFailed,
        ResendActivationEmail: ResendActivationEmail,
        UpdateAccountActivity: UpdateAccountActivity,
        GetOrSetUserSync: GetOrSetUserSync,
        UpdateUserSync: UpdateUserSync,
        UnlockSync: UnlockSync,
        GetUserBucket: GetUserBucket,
        getUsage: getUsage,
        updateKeys: updateKeys,
        recoverPassword: recoverPassword
    };
};
