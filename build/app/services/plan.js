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
var axios = require('axios').default;
var _a = require('../constants'), MAX_FREE_PLAN_BYTES = _a.MAX_FREE_PLAN_BYTES, FREE_PLAN_BYTES = _a.FREE_PLAN_BYTES;
var StripeService = require('./stripe');
var LimitService = require('./limit');
var FREE_PLAN = {
    planId: '',
    productId: '',
    name: 'Free Plan',
    simpleName: '2GB',
    price: 0,
    monthlyPrice: 0,
    currency: '',
    isTeam: false,
    storageLimit: FREE_PLAN_BYTES,
    paymentInterval: null,
    isLifetime: false,
    renewalPeriod: ''
};
var lifetimePlanFactory = function (maxSpaceBytes, isTeam) { return ({
    planId: '',
    productId: '',
    name: 'Lifetime',
    simpleName: 'lifetime',
    price: 0,
    monthlyPrice: 0,
    currency: '',
    isTeam: isTeam,
    storageLimit: maxSpaceBytes,
    paymentInterval: null,
    isLifetime: true,
    renewalPeriod: 'lifetime'
}); };
module.exports = function (Model, App) {
    var stripeService = StripeService(Model, App);
    var limitService = LimitService(Model, App);
    var getByUserId = function (userId) { return Model.plan.findOne({ userId: userId }); };
    var getByName = function (name) { return Model.plan.findOne({ name: name }); };
    var create = function (_a) {
        var userId = _a.userId, name = _a.name, type = _a.type, limit = _a.limit;
        return Model.plan.create({
            userId: userId,
            name: name,
            type: type,
            limit: limit
        });
    };
    var createOrUpdate = function (plan) {
        return Model.plan.findOne({ where: { userId: plan.userId } }).then(function (dbPlan) {
            if (!dbPlan) {
                return create(plan);
            }
            dbPlan.name = plan.name;
            dbPlan.type = plan.type;
            dbPlan.limit = plan.limit;
            return dbPlan.save();
        });
    };
    var deleteByUserId = function (userId) { return Model.plan.destroy({ where: { userId: userId } }); };
    var createAndSetBucketLimit = function (newPlan, bucketId, bucketLimit) {
        var _a = process.env, GATEWAY_USER = _a.GATEWAY_USER, GATEWAY_PASS = _a.GATEWAY_PASS;
        return create(newPlan).then(function () {
            return axios.patch(process.env.STORJ_BRIDGE + "/gateway/bucket/" + bucketId, {
                limit: bucketLimit
            }, {
                headers: { 'Content-Type': 'application/json' },
                auth: { username: GATEWAY_USER, password: GATEWAY_PASS }
            });
        });
    };
    var getIndividualPlan = function (userEmail, userId) { return __awaiter(void 0, void 0, void 0, function () {
        var subscriptionPlans, result, maxSpaceBytes;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, stripeService.getUserSubscriptionPlans(userEmail, userId)];
                case 1:
                    subscriptionPlans = (_a.sent())
                        .filter(function (subscription) { return subscription.status === 'active'; })
                        .filter(function (plan) { return !plan.isTeam; });
                    result = subscriptionPlans[0];
                    if (!!result) return [3 /*break*/, 3];
                    return [4 /*yield*/, limitService.getLimit(userEmail, userId)];
                case 2:
                    maxSpaceBytes = (_a.sent()).maxSpaceBytes;
                    result = maxSpaceBytes > MAX_FREE_PLAN_BYTES
                        ? lifetimePlanFactory(maxSpaceBytes, false)
                        : FREE_PLAN;
                    _a.label = 3;
                case 3: return [2 /*return*/, result];
            }
        });
    }); };
    var hasBeenIndividualSubscribedAnyTime = function (userEmail, userId) { return __awaiter(void 0, void 0, void 0, function () {
        var subscriptionPlans, maxSpaceBytes, isLifetime;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, stripeService.getUserSubscriptionPlans(userEmail)];
                case 1:
                    subscriptionPlans = (_a.sent())
                        .filter(function (plan) { return !plan.isTeam; });
                    return [4 /*yield*/, limitService.getLimit(userEmail, userId)];
                case 2:
                    maxSpaceBytes = (_a.sent()).maxSpaceBytes;
                    isLifetime = maxSpaceBytes > MAX_FREE_PLAN_BYTES;
                    return [2 /*return*/, subscriptionPlans.length > 0 || isLifetime];
            }
        });
    }); };
    var isValid = function (plan) {
        return plan && plan.name && plan.limit > 0 && (plan.type === 'subscription' || plan.type === 'one_time');
    };
    var getTeamPlan = function (userEmail, userId) { return __awaiter(void 0, void 0, void 0, function () {
        var subscriptionPlans, result, maxSpaceBytes;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, stripeService.getUserSubscriptionPlans(userEmail, userId)];
                case 1:
                    subscriptionPlans = (_a.sent())
                        .filter(function (subscription) { return subscription.status === 'active'; })
                        .filter(function (plan) { return plan.isTeam; });
                    result = subscriptionPlans[0];
                    if (!!result) return [3 /*break*/, 3];
                    return [4 /*yield*/, limitService.getLimit(userEmail, userId)];
                case 2:
                    maxSpaceBytes = (_a.sent()).maxSpaceBytes;
                    result = maxSpaceBytes > FREE_PLAN_BYTES
                        ? lifetimePlanFactory(maxSpaceBytes, true)
                        : FREE_PLAN;
                    _a.label = 3;
                case 3: return [2 /*return*/, result];
            }
        });
    }); };
    return {
        Name: 'Plan',
        getIndividualPlan: getIndividualPlan,
        getTeamPlan: getTeamPlan,
        isValid: isValid,
        create: create,
        createOrUpdate: createOrUpdate,
        getByName: getByName,
        getByUserId: getByUserId,
        deleteByUserId: deleteByUserId,
        createAndSetBucketLimit: createAndSetBucketLimit,
        hasBeenIndividualSubscribedAnyTime: hasBeenIndividualSubscribedAnyTime
    };
};
