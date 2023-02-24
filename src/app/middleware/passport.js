const jwt = require('jsonwebtoken');
const passport = require('passport');

const passportAuth = passport.authenticate('jwt', { session: false });

function Sign(data, secret, expires = false) {
  const token = expires ? jwt.sign({ email: data }, secret, { expiresIn: '14d' }) : jwt.sign(data, secret);

  return token;
}

function getTokenExpiredDate(token, secret) {
  try {
    const decoded = jwt.verify(token, secret);
    if (decoded?.exp){
      return decoded.exp;
    } else {
      return 0;
    }
  } catch(err) {
    return 0;
  }
}

module.exports = {
  passportAuth,
  Sign,
  getTokenExpiredDate,
};
