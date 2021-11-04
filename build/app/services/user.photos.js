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
var sequelize = require('sequelize');
var Op = sequelize.Op;
module.exports = function (Model, App) {
    var Logger = App.logger;
    var UserFindOrCreate = function (user) {
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
                            name: user.name,
                            lastname: user.lastname,
                            password: userPass,
                            mnemonic: user.mnemonic,
                            hKey: userSalt,
                            referral: user.referral,
                            uuid: null,
                            referred: user.referred,
                            credit: user.credit,
                            welcomePack: false
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
                                        if (bridgeUser && bridgeUser.response && bridgeUser.response.status === 500) {
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
    /**
     * If not exists user on Photos database, creates a new photos user entry.
     */
    var UserPhotosFindOrCreate = function (newUser) {
        return Model.usersphotos.sequelize.transaction(function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Model.usersphotos
                        .findOrCreate({
                        where: { user_id: newUser.id },
                        defaults: {
                            userId: newUser.id,
                            rootAlbumId: null,
                            rootPreviewId: null
                        }
                    })
                        .then(function (userResult, created) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            if (created) {
                                // Set created flag for Frontend management
                                Object.assign(userResult, { isCreated: created });
                            }
                            return [2 /*return*/, userResult];
                        });
                    }); })
                        .catch(function (err) {
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
    var GetUserById = function (id) {
        var _a;
        return Model.usersPhotos.findOne({ where: { id: (_a = {}, _a[Op.eq] = id, _a) } });
    };
    var FindUserById = function (id) {
        var _a;
        return Model.usersphotos.findOne({ where: { userId: (_a = {}, _a[Op.eq] = id, _a) } });
    };
    var FindUserByEmail = function (email) {
        var _a;
        return Model.users.findOne({
            where: { username: (_a = {}, _a[Op.eq] = email, _a) },
            include: [{ model: Model.usersphotos }]
        });
    };
    var FindUserByUuid = function (userUuid) {
        var _a;
        return Model.users.findOne({ where: { uuid: (_a = {}, _a[Op.eq] = userUuid, _a) } });
    };
    var GetUserRootAlbum = function () { return Model.usersPhotos.findAll({ include: [Model.album] }); };
    return {
        Name: 'UserPhotos',
        UserFindOrCreate: UserFindOrCreate,
        UserPhotosFindOrCreate: UserPhotosFindOrCreate,
        GetUserById: GetUserById,
        FindUserById: FindUserById,
        FindUserByEmail: FindUserByEmail,
        FindUserByUuid: FindUserByUuid,
        GetUserRootAlbum: GetUserRootAlbum
    };
};
