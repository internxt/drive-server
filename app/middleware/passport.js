const jwt = require('jsonwebtoken');
const passport = require('passport');

const passportAuth = passport.authenticate('jwt', { session: false });

function Sign(data, secret, useNewToken = false) {
  const token = useNewToken
    ? jwt.sign({ email: data }, secret, { expiresIn: '14d' })
    : jwt.sign(data, secret);

  return token;
}

// eslint-disable-next-line no-unused-vars
function Verify(token, secret) {
  throw Error('Not implemented yet');
}

module.exports = {
  passportAuth,
  Sign,
  Verify
};
