const jwt = require('jsonwebtoken');
const passport = require('passport');

const passportAuth = passport.authenticate('jwt', { session: false });

function Sign(data, secret, expires = false) {
  const token = expires ?
    jwt.sign({ email: data, iat: getDefaultIAT() }, secret, { expiresIn: '14d' }) :
    jwt.sign({ email: data, iat: getDefaultIAT() }, secret);
  return token;
}

function SignWithFutureIAT(data, secret) {
  return jwt.sign({ email: data, iat: getFutureIAT() }, secret, { expiresIn: '14d' });
}

function SignNewTokenWithFutureIAT(data, secret, expires = false) {
  const futureIat = getFutureIAT();
  return expires
    ? jwt.sign(getNewTokenPayload(data, futureIat), secret, { expiresIn: '14d' })
    : jwt.sign(getNewTokenPayload(data, futureIat), secret);
}

function SignNewToken(data, secret, expires = false) {
  const token = expires ?
    jwt.sign(getNewTokenPayload(data), secret, { expiresIn: '14d' }) :
    jwt.sign(getNewTokenPayload(data), secret);
  return token;
}

function getNewTokenPayload(userData, customIat) {
  return {
    payload: {
      uuid: userData.uuid,
      email: userData.email,
      name: userData.name,
      lastname: userData.lastname,
      username: userData.username,
      sharedWorkspace: true,
      networkCredentials: {
        user: userData.bridgeUser,
        pass: userData.userId,
      },
    },
    iat: customIat ?? getDefaultIAT(),
  };
}

function getDefaultIAT() {
  return Math.floor(Date.now() / 1000);
}

function getFutureIAT() {
  return Math.floor(Date.now() / 1000) + 60;
}

module.exports = {
  passportAuth,
  Sign,
  SignNewToken,
  SignWithFutureIAT,
  SignNewTokenWithFutureIAT,
};
