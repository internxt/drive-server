"use strict";
var passportAuth = require('../middleware/passport').passportAuth;
var sharedMiddlewareBuilder = require('../middleware/shared-workspace');
module.exports = function (Router, Service) {
    var sharedAdapter = sharedMiddlewareBuilder.build(Service);
    Router.get('/share/list', passportAuth, sharedAdapter, function (req, res) {
        Service.Share.list(req.behalfUser).then(function (results) {
            res.status(200).send(results);
        }).catch(function (err) {
            res.status(500).send({ error: err.message });
        });
    });
};
