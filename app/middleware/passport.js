const jwt = require('jsonwebtoken');
const passport = require('passport')

const passportAuth = passport.authenticate('jwt', { session: false });

function Sign(data, secret, useNewToken) {
    const token = useNewToken ? jwt.sign(
        {
            email: data.email
        },
        secret,
        {
        expiresIn: '14d'
    })
        :
        jwt.sign(data, secret);

    return token
}

function Verify(token, secret) {
    throw Error('Not implemented yet')
}

module.exports = {
    passportAuth,
    Sign,
    Verify
}