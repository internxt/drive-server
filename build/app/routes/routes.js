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
var speakeasy = require('speakeasy');
var ActivationRoutes = require('./activation');
var StorageRoutes = require('./storage');
var BridgeRoutes = require('./bridge');
var StripeRoutes = require('./stripe');
var DesktopRoutes = require('./desktop');
var MobileRoutes = require('./mobile');
var TwoFactorRoutes = require('./twofactor');
var AppSumoRoutes = require('./appsumo');
var PlanRoutes = require('./plan');
var PhotosRoutes = require('./photos');
var ShareRoutes = require('./share');
var BackupsRoutes = require('./backup');
var GuestRoutes = require('./guest');
var GatewayRoutes = require('./gateway');
var UsersReferralsRoutes = require('./usersReferrals');
var NewsletterRoutes = require('./newsletter');
var UserRoutes = require('./user');
var passport = require('../middleware/passport');
var TeamsRoutes = require('./teams');
var logger = require('../../lib/logger').default;
var ReCaptchaV3 = require('../../lib/recaptcha');
var passportAuth = passport.passportAuth;
var Logger = logger.getInstance();
module.exports = function (Router, Service, App) {
    // User account activation/deactivation
    ActivationRoutes(Router, Service, App);
    // Files/folders operations
    StorageRoutes(Router, Service, App);
    // Calls to the BRIDGE api
    BridgeRoutes(Router, Service, App);
    // Calls to STRIPE api
    StripeRoutes(Router, Service, App);
    // Routes used by X-Cloud-Desktop
    DesktopRoutes(Router, Service, App);
    // Routes used by X-Cloud-Mobile
    MobileRoutes(Router, Service, App);
    // Routes to create, edit and delete the 2-factor-authentication
    TwoFactorRoutes(Router, Service, App);
    // Teams routes
    TeamsRoutes(Router, Service, App);
    // AppSumo routes
    AppSumoRoutes(Router, Service, App);
    // Plan routes
    PlanRoutes(Router, Service, App);
    // Routes used by Internxt Photos
    PhotosRoutes(Router, Service, App);
    // Routes used by Internxt Photos
    ShareRoutes(Router, Service, App);
    // Routes used by Desktop Backups
    BackupsRoutes(Router, Service, App);
    // Invite guest routes
    GuestRoutes(Router, Service, App);
    // Gateway comunication
    GatewayRoutes(Router, Service, App);
    UsersReferralsRoutes(Router, Service, App);
    NewsletterRoutes(Router, Service, App);
    UserRoutes(Router, Service, App);
    Router.post('/login', function (req, res) {
        if (!req.body.email) {
            return res.status(400).send({ error: 'No email address specified' });
        }
        try {
            req.body.email = req.body.email.toLowerCase();
        }
        catch (e) {
            return res.status(400).send({ error: 'Invalid username' });
        }
        // Call user service to find user
        return Service.User.FindUserByEmail(req.body.email).then(function (userData) {
            var encSalt = App.services.Crypt.encryptText(userData.hKey.toString());
            var required2FA = userData.secret_2FA && userData.secret_2FA.length > 0;
            return Service.KeyServer.keysExists(userData).then(function (keyExist) {
                res.status(200).send({ hasKeys: keyExist, sKey: encSalt, tfa: required2FA });
            });
        }).catch(function () {
            res.status(401).send({ error: 'Wrong email/password' });
        });
    });
    Router.post('/access', function (req, res) {
        var MAX_LOGIN_FAIL_ATTEMPTS = 10;
        // Call user service to find or create user
        Service.User.FindUserByEmail(req.body.email).then(function (userData) { return __awaiter(void 0, void 0, void 0, function () {
            var pass, needsTfa, tfaResult, internxtClient, token, userBucket, keyExists, keys, hasTeams, appSumoDetails, user, userTeam, tokenTeam;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (userData.errorLoginCount >= MAX_LOGIN_FAIL_ATTEMPTS) {
                            return [2 /*return*/, res.status(500).send({ error: 'Your account has been blocked for security reasons. Please reach out to us' })];
                        }
                        pass = App.services.Crypt.decryptText(req.body.password);
                        needsTfa = userData.secret_2FA && userData.secret_2FA.length > 0;
                        tfaResult = true;
                        if (needsTfa) {
                            tfaResult = speakeasy.totp.verifyDelta({
                                secret: userData.secret_2FA,
                                token: req.body.tfa,
                                encoding: 'base32',
                                window: 2
                            });
                        }
                        if (!tfaResult) {
                            return [2 /*return*/, res.status(400).send({ error: 'Wrong 2-factor auth code' })];
                        }
                        if (!(pass === userData.password.toString() && tfaResult)) return [3 /*break*/, 9];
                        internxtClient = req.headers['internxt-client'];
                        token = passport.Sign(userData.email, App.config.get('secrets').JWT, internxtClient === 'drive-web');
                        Service.User.LoginFailed(req.body.email, false);
                        Service.User.UpdateAccountActivity(req.body.email);
                        return [4 /*yield*/, Service.User.GetUserBucket(userData)];
                    case 1:
                        userBucket = _b.sent();
                        return [4 /*yield*/, Service.KeyServer.keysExists(userData)];
                    case 2:
                        keyExists = _b.sent();
                        if (!(!keyExists && req.body.publicKey)) return [3 /*break*/, 4];
                        return [4 /*yield*/, Service.KeyServer.addKeysLogin(userData, req.body.publicKey, req.body.privateKey, req.body.revocateKey)];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4: return [4 /*yield*/, Service.KeyServer.getKeys(userData)];
                    case 5:
                        keys = _b.sent();
                        return [4 /*yield*/, Service.Team.getTeamByMember(req.body.email)];
                    case 6:
                        hasTeams = !!(_b.sent());
                        appSumoDetails = null;
                        return [4 /*yield*/, Service.AppSumo.GetDetails(userData.id).catch(function () { return null; })];
                    case 7:
                        appSumoDetails = _b.sent();
                        _a = {
                            email: req.body.email,
                            userId: userData.userId,
                            mnemonic: userData.mnemonic,
                            root_folder_id: userData.root_folder_id,
                            name: userData.name,
                            lastname: userData.lastname,
                            uuid: userData.uuid,
                            credit: userData.credit,
                            createdAt: userData.createdAt,
                            privateKey: keys ? keys.private_key : null,
                            publicKey: keys ? keys.public_key : null,
                            revocateKey: keys ? keys.revocation_key : null,
                            bucket: userBucket,
                            registerCompleted: userData.registerCompleted,
                            teams: hasTeams,
                            username: userData.username,
                            bridgeUser: userData.bridgeUser,
                            sharedWorkspace: userData.sharedWorkspace,
                            appSumoDetails: appSumoDetails || null
                        };
                        return [4 /*yield*/, Service.UsersReferrals.hasReferralsProgram(req.body.email, userData.userId)];
                    case 8:
                        user = (_a.hasReferralsProgram = _b.sent(),
                            _a.backupsBucket = userData.backupsBucket,
                            _a);
                        userTeam = null;
                        if (userTeam) {
                            tokenTeam = passport.Sign(userTeam.bridge_user, App.config.get('secrets').JWT, internxtClient === 'drive-web');
                            return [2 /*return*/, res.status(200).json({
                                    user: user,
                                    token: token,
                                    userTeam: userTeam,
                                    tokenTeam: tokenTeam
                                })];
                        }
                        return [2 /*return*/, res.status(200).json({ user: user, token: token, userTeam: userTeam })];
                    case 9:
                        // Wrong password
                        if (pass !== userData.password.toString()) {
                            Service.User.LoginFailed(req.body.email, true);
                        }
                        return [2 /*return*/, res.status(401).json({ error: 'Wrong email/password' })];
                }
            });
        }); }).catch(function (err) {
            Logger.error('ERROR access %s, reason: %s', req.body.email, err.message);
            return res.status(401).send({ error: 'Wrong email/password' });
        });
    });
    Router.get('/user/refresh', passportAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, publicKey, privateKey, revocateKey, userData, keyExists, keys, userBucket, internxtClient, token, hasTeams, appSumoDetails, user;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = req.body, publicKey = _a.publicKey, privateKey = _a.privateKey, revocateKey = _a.revocateKey;
                    userData = req.user;
                    return [4 /*yield*/, Service.KeyServer.keysExists(userData)];
                case 1:
                    keyExists = _c.sent();
                    if (!(!keyExists && publicKey)) return [3 /*break*/, 3];
                    return [4 /*yield*/, Service.KeyServer.addKeysLogin(userData, publicKey, privateKey, revocateKey)];
                case 2:
                    _c.sent();
                    _c.label = 3;
                case 3: return [4 /*yield*/, Service.KeyServer.getKeys(userData)];
                case 4:
                    keys = _c.sent();
                    return [4 /*yield*/, Service.User.GetUserBucket(userData)];
                case 5:
                    userBucket = _c.sent();
                    internxtClient = req.headers['internxt-client'];
                    token = passport.Sign(userData.email, App.config.get('secrets').JWT, internxtClient === 'x-cloud-web' || internxtClient === 'drive-web');
                    return [4 /*yield*/, Service.Team.getTeamByMember(userData.email)];
                case 6:
                    hasTeams = !!(_c.sent());
                    appSumoDetails = null;
                    return [4 /*yield*/, Service.AppSumo.GetDetails(userData.id).catch(function () { return null; })];
                case 7:
                    appSumoDetails = _c.sent();
                    _b = {
                        email: userData.email,
                        userId: userData.userId,
                        mnemonic: userData.mnemonic,
                        root_folder_id: userData.root_folder_id,
                        name: userData.name,
                        lastname: userData.lastname,
                        uuid: userData.uuid,
                        credit: userData.credit,
                        createdAt: userData.createdAt,
                        privateKey: keys ? keys.private_key : null,
                        publicKey: keys ? keys.public_key : null,
                        revocateKey: keys ? keys.revocation_key : null,
                        bucket: userBucket,
                        registerCompleted: userData.registerCompleted,
                        teams: hasTeams,
                        username: userData.username,
                        bridgeUser: userData.bridgeUser,
                        sharedWorkspace: userData.sharedWorkspace,
                        appSumoDetails: appSumoDetails || null
                    };
                    return [4 /*yield*/, Service.UsersReferrals.hasReferralsProgram(userData.email, userData.userId)];
                case 8:
                    user = (_b.hasReferralsProgram = _c.sent(),
                        _b.backupsBucket = userData.backupsBucket,
                        _b);
                    res.status(200).json({
                        user: user,
                        token: token
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    Router.post('/register', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var ipaddress, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    if (!(req.headers['internxt-client'] !== 'drive-mobile')) return [3 /*break*/, 2];
                    ipaddress = req.header('x-forwarded-for') || req.socket.remoteAddress;
                    return [4 /*yield*/, ReCaptchaV3.verify(req.body.captcha, ipaddress)];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    return [2 /*return*/, res.status(400).send({ error: 'Only humans allowed' })];
                case 4: return [2 /*return*/, Service.User.RegisterUser(req.body)
                        .then(function (result) {
                        res.status(200).send(result);
                    })
                        .catch(function (err) {
                        res.status(400).send({
                            error: err.message,
                            message: err.message
                        });
                        Logger.error('Error in register %s', req.body.email);
                        Logger.error(err);
                    })];
            }
        });
    }); });
    Router.post('/initialize', function (req, res) {
        // Call user service to find or create user
        Service.User.InitializeUser(req.body).then(function (userData) { return __awaiter(void 0, void 0, void 0, function () {
            var user, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!userData.root_folder_id) return [3 /*break*/, 7];
                        user = {
                            email: userData.email,
                            bucket: userData.bucket,
                            mnemonic: userData.mnemonic,
                            root_folder_id: userData.root_folder_id
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, Service.Folder.Create(userData, 'Family', user.root_folder_id)];
                    case 2:
                        (_a.sent()).save();
                        return [4 /*yield*/, Service.Folder.Create(userData, 'Personal', user.root_folder_id)];
                    case 3:
                        (_a.sent()).save();
                        return [3 /*break*/, 6];
                    case 4:
                        e_1 = _a.sent();
                        Logger.error('Cannot initialize welcome folders: %s', e_1.message);
                        return [3 /*break*/, 6];
                    case 5:
                        res.status(200).send({ user: user });
                        return [7 /*endfinally*/];
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        // User initialization unsuccessful
                        res.status(400).send({ message: 'Your account can\'t be initialized' });
                        _a.label = 8;
                    case 8: return [2 /*return*/];
                }
            });
        }); }).catch(function (err) {
            Logger.error(err.message + "\n" + err.stack);
            res.send(err.message);
        });
    });
    return Router;
};
