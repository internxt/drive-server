const jwt = require('jsonwebtoken');
const passport = require('passport');

const passportAuth = passport.authenticate('jwt', { session: false });

function Sign(data, secret, expires = false) {
  const token = expires ? jwt.sign({ email: data }, secret, { expiresIn: '14d' }) : jwt.sign(data, secret);

  return token;
}

module.exports = {
  passportAuth,
  Sign,
};
