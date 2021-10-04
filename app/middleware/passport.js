const jwt = require('jsonwebtoken');
const passport = require('passport');

const passportAuth = passport.authenticate('jwt', { session: false });

function Sign(data, secret, useNewToken = false) {
  const token = useNewToken
    ? jwt.sign({ email: data }, secret, { expiresIn: '14d' })
    : jwt.sign(data, secret);

  return token;
}

module.exports = {
  passportAuth,
  Sign
};
