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
var crypto = require('crypto');
var bip39 = require('bip39');
var axios = require('axios').default;
var bytes = require('bytes');
var merge = require('lodash').merge;
var UserService = require('./user');
var CryptService = require('./crypt');
var AppSumoTiers = [
    { name: 'internxt_tier1', size: '500GB' },
    { name: 'internxt_tier2', size: '1TB' },
    { name: 'internxt_tier3', size: '2TB' },
    { name: 'internxt_tier4', size: '3TB' },
    { name: 'internxt_tier5', size: '5TB' },
    { name: 'lifetime_2TB', size: '2TB' },
    { name: 'lifetime_10TB', size: '10TB' },
    { name: 'sharewareonsale', size: '20GB' },
    { name: 'giveawayoftheday', size: '20GB' },
    { name: 'lifetime_infinite', size: '99TB' }
];
function GetLicenseByName(name) {
    return AppSumoTiers.find(function (license) { return license.name === name; });
}
module.exports = function (Model, App) {
    var UserServiceInstance = UserService(Model, App);
    var CryptServiceInstance = CryptService(Model, App);
    var UserExists = function (email) { return __awaiter(void 0, void 0, void 0, function () {
        var user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Model.users.findOne({ where: { username: email }, attributes: ['id'] })];
                case 1:
                    user = _a.sent();
                    return [2 /*return*/, !!user];
            }
        });
    }); };
    var ApplyLicense = function (user, plan) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, GATEWAY_USER, GATEWAY_PASS, license, size;
        return __generator(this, function (_b) {
            _a = process.env, GATEWAY_USER = _a.GATEWAY_USER, GATEWAY_PASS = _a.GATEWAY_PASS;
            license = GetLicenseByName(plan);
            size = bytes.parse(license ? license.size : '10GB');
            return [2 /*return*/, axios.post(process.env.STORJ_BRIDGE + "/gateway/upgrade", {
                    email: user.email, bytes: size
                }, {
                    headers: { 'Content-Type': 'application/json' },
                    auth: { username: GATEWAY_USER, password: GATEWAY_PASS }
                })];
        });
    }); };
    var RandomPassword = function (email) {
        var randomSeed = crypto.pbkdf2Sync(email, process.env.CRYPTO_SECRET, 100000, 8, 'sha512');
        var randomPassword = crypto.createHash('sha512').update(randomSeed).digest().slice(0, 5)
            .toString('hex');
        return randomPassword;
    };
    var updateOrCreate = function (model, where, values) { return __awaiter(void 0, void 0, void 0, function () {
        var exists, finalValues;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, model.findOne(where)];
                case 1:
                    exists = _a.sent();
                    if (exists) {
                        return [2 /*return*/, model.update(values, where)];
                    }
                    finalValues = merge(values, where.where);
                    return [2 /*return*/, model.create(finalValues)];
            }
        });
    }); };
    // EXAMPLE: updateOrCreate(Model.AppSumo, { where: { userId: 244 } }, { uuid: 'lol3', planId: 'plan3', invoiceItemUuid: 'invoice3' });
    var RegisterIncompleteLifetime = function (email, plan) { return __awaiter(void 0, void 0, void 0, function () {
        var randomPassword, encryptedPassword, encryptedHash, encryptedSalt, newMnemonic, encryptedMnemonic, userObject, user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    randomPassword = RandomPassword(email);
                    encryptedPassword = CryptServiceInstance.passToHash({ password: randomPassword });
                    encryptedHash = CryptServiceInstance.encryptText(encryptedPassword.hash);
                    encryptedSalt = CryptServiceInstance.encryptText(encryptedPassword.salt);
                    newMnemonic = bip39.generateMnemonic(256);
                    encryptedMnemonic = CryptServiceInstance.encryptTextWithKey(newMnemonic, randomPassword);
                    userObject = {
                        email: email,
                        name: null,
                        lastname: null,
                        password: encryptedHash,
                        mnemonic: encryptedMnemonic,
                        salt: encryptedSalt,
                        referral: null,
                        uuid: null,
                        credit: 0,
                        welcomePack: true,
                        registerCompleted: false,
                        username: email,
                        bridgeUser: email
                    };
                    return [4 /*yield*/, UserServiceInstance.FindOrCreate(userObject)];
                case 1:
                    user = _a.sent();
                    return [2 /*return*/, ApplyLicense(user, plan)];
            }
        });
    }); };
    var RegisterIncomplete = function (email, plan, uuid, invoice) { return __awaiter(void 0, void 0, void 0, function () {
        var randomPassword, encryptedPassword, encryptedHash, encryptedSalt, newMnemonic, encryptedMnemonic, userObject, user, appSumoLicense;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (plan.includes('lifetime')) {
                        return [2 /*return*/, RegisterIncompleteLifetime(email, plan)];
                    }
                    App.logger.warn('Register activation from APPSUMO for %s', email);
                    randomPassword = RandomPassword(email);
                    encryptedPassword = CryptServiceInstance.passToHash({ password: randomPassword });
                    encryptedHash = CryptServiceInstance.encryptText(encryptedPassword.hash);
                    encryptedSalt = CryptServiceInstance.encryptText(encryptedPassword.salt);
                    newMnemonic = bip39.generateMnemonic(256);
                    encryptedMnemonic = CryptServiceInstance.encryptTextWithKey(newMnemonic, randomPassword);
                    userObject = {
                        email: email,
                        name: null,
                        lastname: null,
                        password: encryptedHash,
                        mnemonic: encryptedMnemonic,
                        salt: encryptedSalt,
                        referral: 'APPSUMO',
                        uuid: null,
                        credit: 0,
                        welcomePack: true,
                        registerCompleted: false,
                        username: email,
                        bridgeUser: email
                    };
                    return [4 /*yield*/, UserServiceInstance.FindOrCreate(userObject)];
                case 1:
                    user = _a.sent();
                    appSumoLicense = {
                        planId: plan,
                        uuid: uuid,
                        invoiceItemUuid: invoice
                    };
                    return [4 /*yield*/, updateOrCreate(Model.AppSumo, { where: { userId: user.id } }, appSumoLicense)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, ApplyLicense(user, plan)];
            }
        });
    }); };
    var CompleteInfo = function (user, info) { return __awaiter(void 0, void 0, void 0, function () {
        var cPassword, cSalt, hashedCurrentPassword, newPassword, newSalt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (user.registerCompleted) {
                        throw Error('User info is up to date');
                    }
                    cPassword = RandomPassword(user.email);
                    cSalt = user.hKey.toString();
                    hashedCurrentPassword = CryptServiceInstance.passToHash({ password: cPassword, salt: cSalt }).hash;
                    newPassword = CryptServiceInstance.decryptText(info.password);
                    newSalt = CryptServiceInstance.decryptText(info.salt);
                    user.name = info.name;
                    user.lastname = info.lastname;
                    // user.registerCompleted = true;
                    return [4 /*yield*/, user.save()];
                case 1:
                    // user.registerCompleted = true;
                    _a.sent();
                    return [4 /*yield*/, UserServiceInstance.UpdatePasswordMnemonic(user, hashedCurrentPassword, newPassword, newSalt, info.mnemonic)];
                case 2:
                    _a.sent();
                    // Finish
                    user.registerCompleted = true;
                    user.sharedWorkspace = true;
                    return [2 /*return*/, user.save()];
            }
        });
    }); };
    var UpdateLicense = function (email, newDetails) { return __awaiter(void 0, void 0, void 0, function () {
        var user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Model.users.findOne({ where: { username: email } })];
                case 1:
                    user = _a.sent();
                    if (user) {
                        return [2 /*return*/, updateOrCreate(Model.AppSumo, { where: { userId: user.id } }, newDetails)];
                    }
                    return [2 /*return*/, null];
            }
        });
    }); };
    var GetDetails = function (userId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, Model.AppSumo.findOne({ where: { userId: userId } }).then(function (license) { return __awaiter(void 0, void 0, void 0, function () {
                    var unlimited;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (!license) {
                                    throw Error('No AppSumo license');
                                }
                                return [4 /*yield*/, Model.plan.findOne({ where: { userId: userId, name: 'appsumo_unlimited_members' } })];
                            case 1:
                                unlimited = _a.sent();
                                if (unlimited) {
                                    license.planId = 'unlimited';
                                }
                                return [2 /*return*/, license];
                        }
                    });
                }); })];
        });
    }); };
    return {
        Name: 'AppSumo',
        UserExists: UserExists,
        RegisterIncomplete: RegisterIncomplete,
        CompleteInfo: CompleteInfo,
        GetDetails: GetDetails,
        UpdateLicense: UpdateLicense,
        ApplyLicense: ApplyLicense
    };
};
