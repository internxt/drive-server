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
var openpgp = require('openpgp');
var createHttpError = require('http-errors');
var passportAuth = require('../middleware/passport').passportAuth;
var logger = require('../../lib/logger').default;
var AnalyticsService = require('../services/analytics');
var Logger = logger.getInstance();
module.exports = function (Router, Service, App) {
    var analytics = AnalyticsService();
    Router.patch('/user/password', passportAuth, function (req, res) {
        var currentPassword = App.services.Crypt.decryptText(req.body.currentPassword);
        var newPassword = App.services.Crypt.decryptText(req.body.newPassword);
        var newSalt = App.services.Crypt.decryptText(req.body.newSalt);
        var _a = req.body, mnemonic = _a.mnemonic, privateKey = _a.privateKey;
        Service.User.UpdatePasswordMnemonic(req.user, currentPassword, newPassword, newSalt, mnemonic, privateKey).then(function () {
            res.status(200).send({});
        }).catch(function (err) {
            res.status(500).send({ error: err.message });
        });
    });
    Router.patch('/user/recover', passportAuth, function (req, res) {
        var newPassword = App.services.Crypt.decryptText(req.body.password);
        var newSalt = App.services.Crypt.decryptText(req.body.salt);
        // Old data, but re-encrypted
        var _a = req.body, oldMnemonic = _a.mnemonic, oldPrivateKey = _a.privateKey;
        Service.User.recoverPassword(req.user, newPassword, newSalt, oldMnemonic, oldPrivateKey).then(function () {
            res.status(200).send({});
        }).catch(function () {
            res.status(500).send({ error: 'Could not restore password' });
        });
    });
    Router.patch('/user/keys', passportAuth, function (req, res) {
        Service.User.updateKeys(req.user, req.body).then(function () {
            res.status(200).send({});
        }).catch(function (err) {
            res.status(500).send({ error: err.message });
        });
    });
    Router.get('/user/credit', passportAuth, function (req, res) {
        var user = req.user;
        return res.status(200).send({ userCredit: user.credit });
    });
    Router.get('/user/keys/:email', passportAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var email, user, existsKeys, keys, publicKeyArmored, codpublicKey;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    email = req.params.email;
                    return [4 /*yield*/, Service.User.FindUserByEmail(email).catch(function () { return null; })];
                case 1:
                    user = _a.sent();
                    if (!user) return [3 /*break*/, 6];
                    return [4 /*yield*/, Service.KeyServer.keysExists(user)];
                case 2:
                    existsKeys = _a.sent();
                    if (!existsKeys) return [3 /*break*/, 4];
                    return [4 /*yield*/, Service.KeyServer.getKeys(user)];
                case 3:
                    keys = _a.sent();
                    res.status(200).send({ publicKey: keys.public_key });
                    return [3 /*break*/, 5];
                case 4:
                    res.status(400).send({ error: 'This user cannot be invited' });
                    _a.label = 5;
                case 5: return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, openpgp.generateKey({
                        userIDs: [{ email: 'inxt@inxt.com' }],
                        curve: 'ed25519'
                    })];
                case 7:
                    publicKeyArmored = (_a.sent()).publicKeyArmored;
                    codpublicKey = Buffer.from(publicKeyArmored).toString('base64');
                    res.status(200).send({ publicKey: codpublicKey });
                    _a.label = 8;
                case 8: return [2 /*return*/];
            }
        });
    }); });
    Router.get('/user/resend/:email', function (req, res) {
        Service.User.ResendActivationEmail(req.params.email).then(function () {
            res.status(200).send({ message: 'ok' });
        }).catch(function (err) {
            Logger.error('Resend activation email error %s', err ? err.message : err);
            res.status(500).send({
                error: err.response && err.response.data && err.response.data.error
                    ? err.response.data.error
                    : 'Internal server error'
            });
        });
    });
    Router.post('/user/invite', passportAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var inviteEmail, user, hostFullName, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    inviteEmail = req.body.email;
                    user = req.user;
                    hostFullName = user.name && (user.name + (user.lastname ? " " + user.lastname : ''));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    if (!inviteEmail) {
                        throw createHttpError(400, 'You have to specify an email address');
                    }
                    if (inviteEmail === user.email) {
                        throw createHttpError(400, 'You cannot invite yourself');
                    }
                    return [4 /*yield*/, Service.User.invite({
                            inviteEmail: inviteEmail,
                            hostEmail: user.email,
                            hostFullName: hostFullName,
                            hostReferralCode: user.referralCode
                        })];
                case 2:
                    _a.sent();
                    analytics.track({
                        userId: user.uuid,
                        event: 'Invitation Sent',
                        properties: { sent_to: inviteEmail }
                    });
                    res.status(200).send({ message: "Internxt invitation sent to " + inviteEmail });
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    Logger.error('Error inviting user with email %s: %s', inviteEmail, err_1 ? err_1.message : err_1);
                    res.status((err_1 && err_1.status) || 500).send({
                        error: err_1 ? err_1.message : err_1
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
};
