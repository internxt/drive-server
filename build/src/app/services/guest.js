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
var bip39 = require('bip39');
var AesUtil = require('../../lib/AesUtil');
var CryptService = require('./crypt');
var logger = require('../../lib/logger').default;
var Logger = logger.getInstance();
var APPSUMO_TIER_LIMITS = {
    internxt_free1: 0,
    internxt_tier1: 1,
    internxt_tier2: 5,
    internxt_tier3: 10,
    internxt_tier4: 25,
    internxt_tier5: 100
};
module.exports = function (Model, App) {
    var cryptService = CryptService(Model, App);
    var getHost = function (email) {
        return Model.users.findOne({ where: { username: email } });
    };
    var inviteUsage = function (host) { return __awaiter(void 0, void 0, void 0, function () {
        var invitations;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Model.Invitation.findAll({ where: { host: host.id } })];
                case 1:
                    invitations = _a.sent();
                    if (!invitations) {
                        return [2 /*return*/, 0];
                    }
                    return [2 /*return*/, invitations.length];
            }
        });
    }); };
    var inviteLimit = function (host) { return __awaiter(void 0, void 0, void 0, function () {
        var appsumo, unlimitedMembers;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Model.AppSumo.findOne({ where: { user_id: host.id } })];
                case 1:
                    appsumo = _a.sent();
                    if (!appsumo) {
                        // Not appsumo user
                        return [2 /*return*/, 0];
                    }
                    return [4 /*yield*/, Model.plan.findOne({ where: { userId: host.id, name: 'appsumo_unlimited_members' } })];
                case 2:
                    unlimitedMembers = _a.sent();
                    if (unlimitedMembers) {
                        // Infinite?
                        return [2 /*return*/, Number.MAX_SAFE_INTEGER];
                    }
                    if (!Object.keys(APPSUMO_TIER_LIMITS).indexOf(appsumo.planId) === -1) {
                        // Not valid appsumo  plan
                        return [2 /*return*/, 0];
                    }
                    return [2 /*return*/, APPSUMO_TIER_LIMITS[appsumo.planId]];
            }
        });
    }); };
    var invitationsLeft = function (host) { return __awaiter(void 0, void 0, void 0, function () {
        var usage, limit;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, inviteUsage(host)];
                case 1:
                    usage = _a.sent();
                    return [4 /*yield*/, inviteLimit(host)];
                case 2:
                    limit = _a.sent();
                    return [2 /*return*/, Math.max(limit - usage, 0)];
            }
        });
    }); };
    var canInvite = function (host, guest) { return __awaiter(void 0, void 0, void 0, function () {
        var invitation, left;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!guest) {
                        throw Error('Guest does not exists');
                    }
                    if (guest.email !== guest.bridgeUser) {
                        throw Error('Guest is already in other workspace');
                    }
                    if (guest.sharedWorkspace) {
                        throw Error('Guest is a host');
                    }
                    return [4 /*yield*/, Model.Invitation.findOne({
                            where: {
                                host: host.id,
                                guest: guest.id
                            }
                        })];
                case 1:
                    invitation = _a.sent();
                    if (invitation) {
                        throw Error('Guest already invited');
                    }
                    return [4 /*yield*/, invitationsLeft(host)];
                case 2:
                    left = _a.sent();
                    if (left === 0) {
                        throw Error('No invitations left');
                    }
                    return [2 /*return*/, true];
            }
        });
    }); };
    var invite = function (host, guestEmail, key) { return __awaiter(void 0, void 0, void 0, function () {
        var guest;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Model.users.findOne({ where: { username: guestEmail } })];
                case 1:
                    guest = _a.sent();
                    return [4 /*yield*/, canInvite(host, guest)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, Model.Invitation.create({
                            host: host.id,
                            guest: guest.id,
                            inviteId: key
                        })];
            }
        });
    }); };
    var acceptInvitation = function (guestUser, payload) { return __awaiter(void 0, void 0, void 0, function () {
        var invitation, hostUser, hostKey, masterKey, guestKey, newKey;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!payload) {
                        throw Error('Missing user key');
                    }
                    return [4 /*yield*/, Model.Invitation.findOne({ where: { guest: guestUser.id } })];
                case 1:
                    invitation = _a.sent();
                    if (!invitation) {
                        throw Error('User not invited');
                    }
                    return [4 /*yield*/, Model.users.findOne({ where: { id: invitation.host } })];
                case 2:
                    hostUser = _a.sent();
                    hostKey = AesUtil.decrypt(invitation.inviteId);
                    masterKey = bip39.entropyToMnemonic(hostKey);
                    guestKey = Buffer.from(payload, 'hex').toString();
                    newKey = cryptService.encryptTextWithKey(masterKey, guestKey);
                    guestUser.mnemonic = newKey;
                    guestUser.bridgeUser = hostUser.bridgeUser;
                    guestUser.root_folder_id = hostUser.root_folder_id;
                    guestUser.userId = hostUser.userId;
                    invitation.accepted = true;
                    return [4 /*yield*/, invitation.save()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, guestUser.save()];
                case 4:
                    _a.sent();
                    Logger.info('User %s accepted shared workspace. Host: %s', guestUser.email, hostUser.email);
                    return [2 /*return*/];
            }
        });
    }); };
    return {
        Name: 'Guest',
        getHost: getHost,
        invite: invite,
        acceptInvitation: acceptInvitation
    };
};
