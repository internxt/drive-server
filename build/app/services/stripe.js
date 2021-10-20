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
var StripeTest = require('stripe')(process.env.STRIPE_SK_TEST, { apiVersion: '2020-08-27' });
var StripeProduction = require('stripe')(process.env.STRIPE_SK, { apiVersion: '2020-08-27' });
var async = require('async');
var cache = require('memory-cache');
var RenewalPeriod = {
    Monthly: 'monthly',
    Semiannually: 'semiannually',
    Annually: 'annually',
    Lifetime: 'lifetime'
};
function getMonthCount(intervalCount, timeInterval) {
    var byTimeIntervalCalculator = {
        month: function () { return intervalCount; },
        year: function () { return intervalCount * 12; }
    };
    return byTimeIntervalCalculator[timeInterval]();
}
function getMonthlyAmount(totalPrice, intervalCount, timeInterval) {
    var monthCount = getMonthCount(intervalCount, timeInterval);
    var monthlyPrice = totalPrice / monthCount;
    return monthlyPrice;
}
function getRenewalPeriod(intervalCount, interval) {
    var renewalPeriod = RenewalPeriod.Monthly;
    if (interval === 'month' && intervalCount === 6) {
        renewalPeriod = RenewalPeriod.Semiannually;
    }
    else if (interval === 'year') {
        renewalPeriod = RenewalPeriod.Annually;
    }
    return renewalPeriod;
}
module.exports = function () {
    var getStripe = function (isTest) {
        if (isTest === void 0) { isTest = false; }
        return isTest ? StripeTest : StripeProduction;
    };
    var getStorageProducts = function (test) {
        if (test === void 0) { test = false; }
        return new Promise(function (resolve, reject) {
            var stripe = getStripe(test);
            stripe.products.list({
                limit: 100
            }, function (err, products) {
                if (err) {
                    reject(err);
                }
                else {
                    var productsMin = products.data
                        .filter(function (p) { return p.metadata.is_drive === '1'
                        && p.metadata.show === '1'; })
                        .map(function (p) { return ({ id: p.id, name: p.name, metadata: p.metadata }); })
                        .sort(function (a, b) { return a.metadata.size_bytes * 1 - b.metadata.size_bytes * 1; });
                    resolve(productsMin);
                }
            });
        });
    };
    var getStoragePlans = function (stripeProduct, test) {
        if (test === void 0) { test = false; }
        return new Promise(function (resolve, reject) {
            var stripe = getStripe(test);
            stripe.plans.list({ product: stripeProduct, active: true }, function (err, plans) {
                if (err) {
                    reject(err.message);
                }
                else {
                    var plansMin = plans.data.map(function (p) { return ({
                        id: p.id,
                        price: p.amount,
                        name: p.nickname,
                        interval: p.interval,
                        interval_count: p.interval_count
                    }); }).sort(function (a, b) { return a.price * 1 - b.price * 1; });
                    resolve(plansMin);
                }
            });
        });
    };
    var getProductPrices = function (productId, test) {
        if (test === void 0) { test = false; }
        return new Promise(function (resolve, reject) {
            var stripe = getStripe(test);
            stripe.prices.list({ product: productId, active: true }, function (err, response) {
                if (err) {
                    reject(err.message);
                }
                else {
                    var prices = response.data
                        .filter(function (p) { return !!p.metadata.show; })
                        .map(function (p) { return ({
                        id: p.id,
                        name: p.nickname,
                        amount: p.unit_amount,
                        currency: p.currency,
                        recurring: p.recurring,
                        type: p.type
                    }); })
                        .sort(function (a, b) { return a.amount * 1 - b.amount * 1; });
                    resolve(prices);
                }
            });
        });
    };
    // TODO: Flag force reload
    var getAllStorageProducts = function (isTest) {
        if (isTest === void 0) { isTest = false; }
        return new Promise(function (resolve, reject) {
            var stripe = getStripe(isTest);
            var cacheName = "stripe_plans_v2_" + (isTest ? 'test' : 'production');
            var cachedPlans = cache.get(cacheName);
            if (cachedPlans) {
                return resolve(cachedPlans);
            }
            return stripe.products.list({
                limit: 100
            }, function (err, products) {
                if (err) {
                    reject(err);
                }
                else {
                    var productsMin_1 = products.data
                        .filter(function (p) { return (p.metadata.is_drive === '1' || p.metadata.is_teams === '1')
                        && p.metadata.show === '1' && p.metadata.member_tier === 'subscriber'; })
                        .map(function (p) { return ({ id: p.id, name: p.name, metadata: p.metadata }); })
                        .sort(function (a, b) { return a.metadata.size_bytes * 1 - b.metadata.size_bytes * 1; });
                    async.eachSeries(productsMin_1, function (product) { return __awaiter(void 0, void 0, void 0, function () {
                        var plans;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, getStoragePlans(product.id, isTest)];
                                case 1:
                                    plans = _a.sent();
                                    product.plans = plans;
                                    return [2 /*return*/];
                            }
                        });
                    }); }, function (err2) {
                        // err2: Avoid shadowed variables
                        if (err2) {
                            return reject(err2);
                        }
                        cache.put(cacheName, productsMin_1, 1000 * 60 * 30);
                        return resolve(productsMin_1);
                    });
                }
            });
        });
    };
    /**
     * @description Adds a product for every product.price found
     * @param {*} isTest
     * @returns
     */
    var getAllStorageProducts2 = function (isTest) {
        if (isTest === void 0) { isTest = false; }
        return new Promise(function (resolve, reject) {
            var stripe = getStripe(isTest);
            var cacheName = "stripe_plans_v3_" + (isTest ? 'test' : 'production');
            var cachedPlans = cache.get(cacheName);
            if (cachedPlans) {
                return resolve(cachedPlans);
            }
            return stripe.products.list({
                limit: 100
            }, function (err, response) { return __awaiter(void 0, void 0, void 0, function () {
                var stripeProducts, products_1;
                return __generator(this, function (_a) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        stripeProducts = response.data
                            .filter(function (p) { return (p.metadata.is_drive === '1' || p.metadata.is_teams === '1')
                            && p.metadata.show === '1'; })
                            .map(function (p) { return ({
                            id: p.id,
                            name: p.name,
                            metadata: __assign(__assign({}, p.metadata), { is_drive: !!p.metadata.is_drive, is_teams: !!p.metadata.is_teams, show: !!p.metadata.show, size_bytes: p.metadata.size_bytes && parseInt(p.metadata.size_bytes, 10) })
                        }); })
                            .sort(function (a, b) { return a.metadata.size_bytes * 1 - b.metadata.size_bytes * 1; });
                        products_1 = [];
                        async.eachSeries(stripeProducts, function (stripeProduct) { return __awaiter(void 0, void 0, void 0, function () {
                            var prices;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, getProductPrices(stripeProduct.id, isTest)];
                                    case 1:
                                        prices = _a.sent();
                                        products_1.push.apply(products_1, prices.map(function (price) { return (__assign(__assign({}, stripeProduct), { price: __assign(__assign({}, price), { amount: price.amount * 0.01, monthlyAmount: (price.recurring
                                                    ? getMonthlyAmount(price.amount, price.recurring.interval_count, price.recurring.interval)
                                                    : price.amount) * 0.01 }), renewalPeriod: price.recurring
                                                ? getRenewalPeriod(price.recurring.interval_count, price.recurring.interval)
                                                : RenewalPeriod.Lifetime })); }));
                                        return [2 /*return*/];
                                }
                            });
                        }); }, function (err2) {
                            // err2: Avoid shadowed variables
                            if (err2) {
                                return reject(err2);
                            }
                            cache.put(cacheName, products_1, 1000 * 60 * 30);
                            return resolve(products_1);
                        });
                    }
                    return [2 /*return*/];
                });
            }); });
        });
    };
    var getTeamProducts = function (test) {
        if (test === void 0) { test = false; }
        return new Promise(function (resolve, reject) {
            var stripe = getStripe(test);
            stripe.products.list({
                limit: 100
            }, function (err, products) {
                if (err) {
                    reject(err);
                }
                else {
                    var productsMin = products.data
                        .filter(function (p) { return p.metadata.is_teams === '1' && p.metadata.show === '1'; })
                        .map(function (p) { return ({ id: p.id, name: p.name, metadata: p.metadata }); })
                        .sort(function (a, b) { return a.metadata.size_bytes * 1 - b.metadata.size_bytes * 1; });
                    resolve(productsMin);
                }
            });
        });
    };
    var getTeamPlans = function (stripeProduct, test) {
        if (test === void 0) { test = false; }
        return new Promise(function (resolve, reject) {
            var stripe = getStripe(test);
            stripe.plans.list({ product: stripeProduct, active: true }, function (err, plans) {
                if (err) {
                    reject(err.message);
                }
                else {
                    var plansMin = plans.data
                        .map(function (p) { return ({
                        id: p.id,
                        price: p.amount,
                        name: p.nickname,
                        interval: p.interval,
                        interval_count: p.interval_count
                    }); }).sort(function (a, b) { return a.price * 1 - b.price * 1; });
                    resolve(plansMin);
                }
            });
        });
    };
    var findCustomerByEmail = function (email, isTest) {
        if (isTest === void 0) { isTest = false; }
        return __awaiter(void 0, void 0, void 0, function () {
            var stripe, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        stripe = getStripe(isTest);
                        return [4 /*yield*/, stripe.customers.list({ email: email, limit: 1 })];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.data && result.data[0]];
                }
            });
        });
    };
    var getBilling = function (customerID, url, isTest) {
        if (isTest === void 0) { isTest = false; }
        return __awaiter(void 0, void 0, void 0, function () {
            var stripe, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        stripe = getStripe(isTest);
                        return [4 /*yield*/, stripe.billingPortal.sessions.create({
                                customer: customerID,
                                return_url: url
                            })];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.url];
                }
            });
        });
    };
    var getProductFromUser = function (email) { return __awaiter(void 0, void 0, void 0, function () {
        var isTest, stripe, customer, expandedCustomer, plan, product;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    isTest = process.env.NODE_ENV !== 'production';
                    return [4 /*yield*/, getStripe(isTest)];
                case 1:
                    stripe = _a.sent();
                    return [4 /*yield*/, findCustomerByEmail(email, isTest)];
                case 2:
                    customer = _a.sent();
                    if (!customer) {
                        return [2 /*return*/, customer];
                    }
                    return [4 /*yield*/, stripe.customers.retrieve(customer.id, {
                            expand: ['subscriptions']
                        })];
                case 3:
                    expandedCustomer = _a.sent();
                    expandedCustomer.subscriptions.data.sort(function (a, b) { return b.created - a.created; });
                    plan = expandedCustomer.subscriptions.data[0].plan;
                    return [4 /*yield*/, stripe.products.retrieve(plan.product)];
                case 4:
                    product = _a.sent();
                    return [2 /*return*/, {
                            productId: product.id,
                            name: product.name,
                            price: product.metadata.price_eur,
                            paymentInterval: plan.nickname,
                            planId: plan.id
                        }];
            }
        });
    }); };
    var getUserSubscriptionPlans = function (email) { return __awaiter(void 0, void 0, void 0, function () {
        var isTest, stripe, customer, plans, expandedCustomer;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    isTest = process.env.NODE_ENV !== 'production';
                    return [4 /*yield*/, getStripe(isTest)];
                case 1:
                    stripe = _a.sent();
                    return [4 /*yield*/, findCustomerByEmail(email, isTest)];
                case 2:
                    customer = _a.sent();
                    plans = [];
                    if (!customer) return [3 /*break*/, 4];
                    return [4 /*yield*/, stripe.customers.retrieve(customer.id, {
                            expand: ['subscriptions.data.plan.product']
                        })];
                case 3:
                    expandedCustomer = _a.sent();
                    expandedCustomer.subscriptions.data
                        // .filter((subscription) => subscription.status === 'active')
                        .sort(function (a, b) { return b.created - a.created; });
                    plans = expandedCustomer.subscriptions.data.map(function (subscription) { return ({
                        planId: subscription.plan.id,
                        productId: subscription.plan.product.id,
                        name: subscription.plan.product.name,
                        simpleName: subscription.plan.product.metadata.simple_name,
                        price: subscription.plan.amount * 0.01,
                        monthlyPrice: getMonthlyAmount(subscription.plan.amount * 0.01, subscription.plan.interval_count, subscription.plan.interval),
                        currency: subscription.plan.currency,
                        isTeam: !!subscription.plan.product.metadata.is_teams,
                        storageLimit: subscription.plan.product.metadata.size_bytes,
                        paymentInterval: subscription.plan.nickname,
                        isLifetime: false,
                        renewalPeriod: getRenewalPeriod(subscription.plan.intervalCount, subscription.plan.interval)
                    }); });
                    _a.label = 4;
                case 4: return [2 /*return*/, plans];
            }
        });
    }); };
    return {
        Name: 'Stripe',
        getStorageProducts: getStorageProducts,
        getAllStorageProducts: getAllStorageProducts,
        getAllStorageProducts2: getAllStorageProducts2,
        getStoragePlans: getStoragePlans,
        getProductPrices: getProductPrices,
        getTeamProducts: getTeamProducts,
        getTeamPlans: getTeamPlans,
        findCustomerByEmail: findCustomerByEmail,
        getBilling: getBilling,
        getProductFromUser: getProductFromUser,
        getUserSubscriptionPlans: getUserSubscriptionPlans
    };
};
