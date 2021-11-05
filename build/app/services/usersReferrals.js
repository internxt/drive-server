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
var createHttpError = require('http-errors');
module.exports = function (Model, App) {
    var createUserReferrals = function (userId) { return __awaiter(void 0, void 0, void 0, function () {
        var referrals, userReferralsToCreate;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, App.services.Referrals.getAllEnabled()];
                case 1:
                    referrals = _a.sent();
                    userReferralsToCreate = [];
                    referrals.forEach(function (referral) {
                        var applied = referral.key === 'create-account';
                        Array(referral.steps).fill().forEach(function () {
                            userReferralsToCreate.push({
                                user_id: userId,
                                referral_id: referral.id,
                                start_date: new Date(),
                                applied: applied
                            });
                        });
                    });
                    return [4 /*yield*/, Model.users_referrals.bulkCreate(userReferralsToCreate, { individualHooks: true, fields: ['user_id', 'referral_id', 'start_date', 'applied'] })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var update = function (data, userReferralId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, Model.users_referrals
                    .update({
                    referred: data.referred,
                    applied: data.applied
                }, { where: { id: userReferralId } })];
        });
    }); };
    var getByUserId = function (userId) { return __awaiter(void 0, void 0, void 0, function () {
        var userReferrals, userReferralGroups;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Model.users_referrals.findAll({ where: { user_id: userId }, include: Model.referrals })];
                case 1:
                    userReferrals = _a.sent();
                    userReferralGroups = [];
                    userReferrals.forEach(function (userReferral) {
                        var userReferralGroup = userReferralGroups.find(function (group) { return group.key === userReferral.referral.key; });
                        if (userReferralGroup) {
                            userReferralGroup.completedSteps += userReferral.applied ? 1 : 0;
                        }
                        else {
                            userReferralGroups.push({
                                key: userReferral.referral.key,
                                type: userReferral.referral.type,
                                credit: userReferral.referral.credit,
                                steps: userReferral.referral.steps,
                                completedSteps: userReferral.applied ? 1 : 0
                            });
                        }
                    });
                    return [2 /*return*/, userReferralGroups.map(function (group) { return (__assign(__assign({}, group), { isCompleted: group.steps === group.completedSteps })); })];
            }
        });
    }); };
    var hasReferralsProgram = function (id, userEmail, userId) { return __awaiter(void 0, void 0, void 0, function () {
        var appSumoDetails, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, App.services.AppSumo.GetDetails(id).catch(function () { return null; })];
                case 1:
                    appSumoDetails = _b.sent();
                    _a = !appSumoDetails;
                    if (!_a) return [3 /*break*/, 3];
                    return [4 /*yield*/, App.services.Plan.hasBeenIndividualSubscribedAnyTime(userEmail, userId)];
                case 2:
                    _a = !(_b.sent());
                    _b.label = 3;
                case 3: return [2 /*return*/, _a];
            }
        });
    }); };
    var redeemUserReferral = function (userEmail, userId, type, credit) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (type === 'storage') {
                // TODO: call bridge increase storage endpoint
            }
            App.logger.info("(usersReferralsService.redeemUserReferral) The user '" + userEmail + "' (id: " + userId + ") has redeemed a referral: " + type + " - " + credit);
            return [2 /*return*/];
        });
    }); };
    var applyUserReferral = function (userId, referralKey, referred) { return __awaiter(void 0, void 0, void 0, function () {
        var referral, user, userReferral, userHasReferralsProgram;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, App.services.Referrals.getByKey(referralKey)];
                case 1:
                    referral = _a.sent();
                    return [4 /*yield*/, App.services.User.findById(userId)];
                case 2:
                    user = _a.sent();
                    if (!user) {
                        throw createHttpError(500, "(usersReferralsService.applyUserReferral) user with id " + userId + " not found");
                    }
                    if (!referral) {
                        throw createHttpError(500, "(usersReferralsService.applyUserReferral) referral with key '" + referralKey + "' not found");
                    }
                    return [4 /*yield*/, Model.users_referrals.findOne({ where: { user_id: userId, referral_id: referral.id, applied: 0 } })];
                case 3:
                    userReferral = _a.sent();
                    if (!userReferral) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, hasReferralsProgram(userId, user.bridgeUser, user.userId)];
                case 4:
                    userHasReferralsProgram = _a.sent();
                    if (!userHasReferralsProgram) {
                        throw createHttpError(403, '(usersReferralsService.applyUserReferral) referrals program not enabled for this user');
                    }
                    return [4 /*yield*/, update({ referred: referred, applied: 1 }, userReferral.id)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, redeemUserReferral(user.bridgeUser, userId, referral.type, referral.credit)];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    return {
        Name: 'UsersReferrals',
        createUserReferrals: createUserReferrals,
        getByUserId: getByUserId,
        applyUserReferral: applyUserReferral,
        hasReferralsProgram: hasReferralsProgram
    };
};
