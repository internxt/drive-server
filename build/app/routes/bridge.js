"use strict";
var passport = require('../middleware/passport');
var passportAuth = passport.passportAuth;
module.exports = function (Router, Service) {
    Router.get('/usage', passportAuth, function (req, res) {
        Service.User.getUsage(req.user).then(function (result) {
            res.status(200).send(result);
        }).catch(function () {
            res.status(400).send({ result: 'Error retrieving usage information' });
        });
    });
    Router.get('/limit', passportAuth, function (req, res) {
        var user = req.user;
        Service.Limit.getLimit(user.bridgeUser, user.userId).then(function (data) {
            res.status(200).send(data);
        }).catch(function () {
            res.status(400).send({ result: 'Error retrieving bridge information' });
        });
    });
};
