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
var async = require('async');
var Stripe = require('stripe');
var StripeProduction = Stripe(process.env.STRIPE_SK, { apiVersion: '2020-08-27' });
var StripeTest = Stripe(process.env.STRIPE_SK_TEST, { apiVersion: '2020-08-27' });
var passport = require('../middleware/passport');
var passportAuth = passport.passportAuth;
module.exports = function (Router, Service) {
    Router.get('/plans', passportAuth, function (req, res) {
        Service.Plan.ListAll().then(function (data) {
            res.status(200).json(data);
        }).catch(function () {
            res.status(400).json({ message: 'Error retrieving list of plans' });
        });
    });
    /**
     * Should create a new Stripe Session token.
     * Stripe Session is neccesary to perform a new payment
     */
    Router.post('/stripe/session', passportAuth, function (req, res) {
        var stripe = req.body.test ? StripeTest : StripeProduction;
        var user = req.user.email;
        async.waterfall([
            function (next) {
                // Retrieve the customer by email, to check if already exists
                stripe.customers.list({
                    limit: 1,
                    email: user
                }, function (err, customers) {
                    next(err, customers.data[0]);
                });
            },
            function (customer, next) {
                if (!customer) {
                    // The customer does not exists
                    // Procede to the subscription
                    return next(null, undefined);
                }
                // Get subscriptions
                return stripe.subscriptions.list({
                    customer: customer.id
                }, function (err, response) {
                    if (err) {
                        return next();
                    }
                    var subscriptions = response.data;
                    if (subscriptions.length === 0) {
                        return next(null, { customer: customer, subscription: null });
                    }
                    var subscription = subscriptions[0];
                    return next(null, { customer: customer, subscription: subscription });
                });
            },
            function (payload, next) {
                if (!payload) {
                    next(null, {});
                }
                else {
                    var customer = payload.customer;
                    next(null, customer);
                }
            },
            function (customer, next) {
                // Open session
                var customerId = customer !== null ? customer.id || null : null;
                var sessionParams = {
                    payment_method_types: ['card'],
                    success_url: req.body.successUrl || process.env.HOST_DRIVE_WEB,
                    cancel_url: req.body.canceledUrl || process.env.HOST_DRIVE_WEB,
                    subscription_data: {
                        items: [{ plan: req.body.plan }]
                    },
                    customer_email: user,
                    customer: customerId,
                    allow_promotion_codes: true,
                    billing_address_collection: 'required'
                };
                if (sessionParams.customer) {
                    delete sessionParams.customer_email;
                }
                else {
                    delete sessionParams.customer;
                }
                stripe.checkout.sessions.create(sessionParams).then(function (result) { next(null, result); }).catch(function (err) { next(err); });
            }
        ], function (err, result) {
            if (err) {
                res.status(500).send({ error: err.message });
            }
            else {
                res.status(200).send(result);
            }
        });
    });
    /**
     * Should create a new Stripe Session token.
     * Stripe Session is neccesary to perform a new payment
     */
    Router.post('/stripe/teams/session', passportAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var test, stripe, _a, mode, successUrl, canceledUrl, priceId, quantity;
        return __generator(this, function (_b) {
            test = req.body.test || false;
            stripe = test ? StripeTest : StripeProduction;
            _a = req.body, mode = _a.mode, successUrl = _a.successUrl, canceledUrl = _a.canceledUrl, priceId = _a.priceId, quantity = _a.quantity;
            async.waterfall([
                function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        return [2 /*return*/, Service.Team.getTeamByEmail(req.user.email)];
                    });
                }); },
                function (bridgeUser) { return __awaiter(void 0, void 0, void 0, function () {
                    var newRandomTeam, newTeam;
                    return __generator(this, function (_a) {
                        if (!bridgeUser) {
                            newRandomTeam = Service.Team.randomEmailBridgeUserTeam();
                            newTeam = Service.Team.create({
                                name: 'My team',
                                admin: req.user.email,
                                bridge_user: newRandomTeam.bridge_user,
                                bridge_password: newRandomTeam.password,
                                bridge_mnemonic: req.body.mnemonicTeam
                            });
                            return [2 /*return*/, newTeam];
                        }
                        return [2 /*return*/, bridgeUser];
                    });
                }); },
                function (bridgeUser) { return __awaiter(void 0, void 0, void 0, function () {
                    var sessionParams;
                    return __generator(this, function (_a) {
                        sessionParams = {
                            payment_method_types: ['card'],
                            success_url: successUrl || process.env.HOST_DRIVE_WEB + "/team/success/{CHECKOUT_SESSION_ID}",
                            cancel_url: canceledUrl || process.env.HOST_DRIVE_WEB + "/account?tab=plans",
                            mode: mode,
                            line_items: [
                                {
                                    price: priceId,
                                    quantity: quantity
                                }
                            ],
                            metadata: {
                                is_teams: true,
                                total_members: quantity,
                                team_email: bridgeUser.bridge_user,
                                admin_email: req.user.email
                            },
                            customer_email: req.user.email,
                            allow_promotion_codes: true,
                            billing_address_collection: 'required'
                        };
                        if (sessionParams.customer) {
                            delete sessionParams.customer_email;
                        }
                        else {
                            delete sessionParams.customer;
                        }
                        return [2 /*return*/, stripe.checkout.sessions.create(sessionParams)];
                    });
                }); }
            ], function (err, result) {
                if (err) {
                    res.status(500).send({ error: err.message });
                }
                else {
                    res.status(200).send(result);
                }
            });
            return [2 /*return*/];
        });
    }); });
    /**
     * Should create a new Stripe Session token.
     * Stripe Session is neccesary to perform a new payment
     */
    Router.post('/v2/stripe/session', passportAuth, function (req, res) {
        var stripe = req.body.test ? StripeTest : StripeProduction;
        var user = req.user.email;
        async.waterfall([
            function (next) {
                // Retrieve the customer by email, to check if already exists
                stripe.customers.list({
                    limit: 1,
                    email: user
                }, function (err, customers) {
                    next(err, customers.data[0]);
                });
            },
            function (customer, next) {
                if (!customer) {
                    // The customer does not exists
                    // Procede to the subscription
                    return next(null, undefined);
                }
                // Get subscriptions
                return stripe.subscriptions.list({
                    customer: customer.id
                }, function (err, response) {
                    if (err) {
                        return next();
                    }
                    var subscriptions = response.data;
                    if (subscriptions.length === 0) {
                        return next(null, { customer: customer, subscription: null });
                    }
                    var subscription = subscriptions[0];
                    return next(null, { customer: customer, subscription: subscription });
                });
            },
            function (payload, next) {
                if (!payload) {
                    next(null, {});
                }
                else {
                    var customer = payload.customer;
                    next(null, customer);
                }
            },
            function (customer, next) {
                // Open session
                var customerId = customer !== null ? customer.id || null : null;
                var sessionParams;
                if (req.body.mode === 'subscription') {
                    sessionParams = {
                        payment_method_types: ['card'],
                        success_url: req.body.successUrl || process.env.HOST_DRIVE_WEB,
                        cancel_url: req.body.canceledUrl || process.env.HOST_DRIVE_WEB + "/account?tab=plans",
                        subscription_data: {
                            items: [{ plan: req.body.priceId }]
                        },
                        customer_email: user,
                        customer: customerId,
                        allow_promotion_codes: true,
                        billing_address_collection: 'required'
                    };
                }
                else if (req.body.mode === 'payment') {
                    sessionParams = {
                        payment_method_types: ['card'],
                        success_url: req.body.successUrl || process.env.HOST_DRIVE_WEB,
                        cancel_url: req.body.canceledUrl || process.env.HOST_DRIVE_WEB + "/account?tab=plans",
                        mode: req.body.mode,
                        line_items: [
                            {
                                price: req.body.priceId,
                                quantity: 1
                            }
                        ],
                        customer_email: user,
                        customer: customerId,
                        allow_promotion_codes: true,
                        billing_address_collection: 'required',
                        metadata: {
                            member_tier: 'lifetime'
                        },
                        payment_intent_data: {
                            metadata: {
                                member_tier: 'lifetime',
                                lifetime_tier: req.body.lifetime_tier
                            }
                        }
                    };
                }
                if (sessionParams.customer) {
                    delete sessionParams.customer_email;
                }
                else {
                    delete sessionParams.customer;
                }
                stripe.checkout.sessions.create(sessionParams).then(function (result) { next(null, result); }).catch(function (err) { next(err); });
            }
        ], function (err, result) {
            if (err) {
                res.status(500).send({ error: err.message });
            }
            else {
                res.status(200).send(result);
            }
        });
    });
    /**
     * Retrieve products listed in STRIPE.
     * Products must be inserted on stripe using the dashboard with the required metadata.
     * Required metadata:
     */
    Router.get('/stripe/products', passportAuth, function (req, res) {
        var test = req.query.test || false;
        Service.Stripe.getStorageProducts(test).then(function (products) {
            res.status(200).send(products);
        }).catch(function (err) {
            res.status(500).send({ error: err });
        });
    });
    Router.get('/v2/stripe/products', function (req, res) {
        var test = req.query.test === 'true' || false;
        Service.Stripe.getAllStorageProducts(test).then(function (products) {
            res.status(200).send(products);
        }).catch(function (err) {
            res.status(500).send({ error: err });
        });
    });
    Router.get('/v3/stripe/products', function (req, res) {
        var test = req.query.test === 'true';
        Service.Stripe.getAllStorageProducts2(test).then(function (products) {
            res.status(200).send(products);
        }).catch(function (err) {
            res.status(500).send({ error: err });
        });
    });
    Router.get('/stripe/teams/products', passportAuth, function (req, res) {
        var test = req.query.test || false;
        Service.Stripe.getTeamProducts(test).then(function (products) {
            res.status(200).send(products);
        }).catch(function (err) {
            res.status(500).send({ error: err });
        });
    });
    /**
     * Get available plans from a given product.
     * TODO: cache plans to avoid repetitive api calls
     */
    Router.post('/stripe/plans', passportAuth, function (req, res) {
        var stripe = req.body.test ? StripeTest : StripeProduction;
        var stripeProduct = req.body.product;
        stripe.plans.list({
            product: stripeProduct,
            active: true
        }, function (err, plans) {
            if (err) {
                res.status(500).send({ error: err.message });
            }
            else {
                var plansMin = plans.data
                    .map(function (p) { return ({
                    id: p.id,
                    price: p.amount,
                    name: p.nickname,
                    interval: p.interval,
                    interval_count: p.interval_count
                }); })
                    .sort(function (a, b) { return a.price * 1 - b.price * 1; });
                res.status(200).send(plansMin);
            }
        });
    });
    Router.post('/stripe/teams/plans', passportAuth, function (req, res) {
        var stripeProduct = req.body.product;
        var test = req.body.test || false;
        Service.Stripe.getTeamPlans(stripeProduct, test).then(function (plans) {
            res.status(200).send(plans);
        }).catch(function (err) {
            res.status(500).send({ error: err.message });
        });
    });
    Router.post('/stripe/billing', passportAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var test, email, url;
        return __generator(this, function (_a) {
            test = req.body.test || false;
            email = req.user.email;
            url = 'https://drive.internxt.com/';
            Service.Stripe.findCustomerByEmail(email, test).then(function (customer) {
                var customerId = customer.id;
                Service.Stripe.getBilling(customerId, url, test).then(function (session) {
                    res.status(200).send({ url: session });
                }).catch(function (err) {
                    res.status(500).send({ error: err.message });
                });
            }).catch(function (err) {
                res.status(500).send({ error: err.message });
            });
            return [2 /*return*/];
        });
    }); });
};
