"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var basicAuthBuilder = require('../middleware/basic-auth');
var logger = require('../../lib/logger').default;
var Logger = logger.getInstance();
module.exports = function (Router, Service) {
    var _a = process.env, GATEWAY_USER = _a.GATEWAY_USER, GATEWAY_PASS = _a.GATEWAY_PASS;
    var basicAuth = basicAuthBuilder.build(GATEWAY_USER, GATEWAY_PASS);
    Router.post('/gateway/plan', basicAuth, function (req, res) {
        var _a = req.body, email = _a.email, plan = _a.plan;
        if (!Service.Plan.isValid(plan)) {
            return res.status(400).json({ error: 'Invalid plan' });
        }
        if (!email) {
            return res.status(400).json({ error: 'Missing email' });
        }
        var tenGb = 10 * 1024 * 1024 * 1024;
        var bucketLimit = plan.type === 'one_time' ? tenGb : -1;
        var user;
        return Service.User.FindUserObjByEmail(email).then(function (dbUser) {
            if (!dbUser) {
                throw new Error('User not found');
            }
            user = dbUser;
            return Service.Plan.createOrUpdate(__assign(__assign({}, plan), { userId: dbUser.id }));
            // eslint-disable-next-line consistent-return
        }).then(function () {
            if (user.backupsBucket) {
                return Service.Inxt.updateBucketLimit(user.backupsBucket, bucketLimit);
            }
        }).then(function () {
            return res.status(200).send();
        })
            .catch(function (err) {
            Logger.error('Error creating %s plan "%s" for user %s: %s', plan.type, plan.name, email, err.message);
            return res.status(500).json({ error: err.message });
        });
    });
    Router.post('/gateway/user/update/storage', basicAuth, function (req, res) {
        var email = req.body.email.email;
        var maxSpaceBytes = parseInt(req.body.maxSpaceBytes, 10);
        Service.User.UpdateUserStorage(email, maxSpaceBytes).then(function () {
            return res.status(200).send({ error: null, message: "Storage updated " + maxSpaceBytes + " for user: " + email });
        })
            .catch(function () {
            Logger.error("Error updating user storage " + email + ". Storage requested: " + maxSpaceBytes + " ");
            return res.status(304).send();
        });
    });
    Router.post('/gateway/user/updateOrCreate', basicAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, email, maxSpaceBytes, userExists;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = req.body, email = _a.email, maxSpaceBytes = _a.maxSpaceBytes;
                    return [4 /*yield*/, Service.User.FindUserByEmail(email).catch(function () { return null; })];
                case 1:
                    userExists = _b.sent();
                    if (!!userExists) return [3 /*break*/, 3];
                    return [4 /*yield*/, Service.User.CreateStaggingUser(email).catch(function (err) {
                            Logger.error("Not possible to create a stagging register for user: " + email);
                            return res.status(500).send({ error: err.message });
                        })];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3:
                    Service.User.UpdateUserStorage(email, maxSpaceBytes).then(function () {
                        return res.status(200).send({ error: null, message: "Storage updated " + maxSpaceBytes + " for user: " + email });
                    }).catch(function (err) {
                        Logger.error("Error updating user storage " + email + ". Storage requested: " + maxSpaceBytes + ". Error: " + err + " ");
                        return res.status(304).send();
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    Router.post('/gateway/register/stage', basicAuth, function (req, res) {
        var email = req.body.email;
        Service.User.CreateStaggingUser(email).then(function () {
            res.status(201).send();
        }).catch(function (err) {
            Logger.error("Not possible to create a stagging register for user: " + email);
            res.status(500).send({ error: err.message });
        });
    });
};
