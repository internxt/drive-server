"use strict";
var passportAuth = require('../middleware/passport').passportAuth;
var logger = require('../../lib/logger').default;
var Logger = logger.getInstance();
module.exports = function (Router, Service) {
    Router.get('/deactivate', passportAuth, function (req, res) {
        var user = req.user.email;
        Service.User.DeactivateUser(user).then(function () {
            Service.Analytics.track({ userId: req.user.uuid, event: 'user-deactivation-request', properties: { email: user } });
            res.status(200).send({ error: null, message: 'User deactivated' });
        }).catch(function (err) {
            res.status(500).send({ error: err.message });
        });
    });
    Router.get('/reset/:email', function (req, res) {
        var user = req.params.email.toLowerCase();
        Service.User.DeactivateUser(user).then(function () {
            res.status(200).send();
        }).catch(function () {
            res.status(200).send();
        });
    });
    Router.get('/confirmDeactivation/:token', function (req, res) {
        var token = req.params.token;
        Service.User.ConfirmDeactivateUser(token).then(function () {
            res.status(200).send(req.data);
        }).catch(function (err) {
            res.status(400).send({ error: err.message });
        });
    });
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
};
