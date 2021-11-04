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
};
