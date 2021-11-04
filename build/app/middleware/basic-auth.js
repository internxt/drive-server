"use strict";
var build = function (user, pass) { return function (req, res, next) {
    var receivedAuth = req.headers.authorization;
    var auth = "Basic " + Buffer.from(user + ":" + pass).toString('base64');
    if (receivedAuth !== auth) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    return next();
}; };
module.exports = {
    build: build
};
