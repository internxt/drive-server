"use strict";
var jwt = require('jsonwebtoken');
var passport = require('passport');
var passportAuth = passport.authenticate('jwt', { session: false });
function Sign(data, secret, useNewToken) {
    if (useNewToken === void 0) { useNewToken = false; }
    var token = useNewToken
        ? jwt.sign({ email: data }, secret, { expiresIn: '14d' })
        : jwt.sign(data, secret);
    return token;
}
module.exports = {
    passportAuth: passportAuth,
    Sign: Sign
};
