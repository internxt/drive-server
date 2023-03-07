const jwt = require('jsonwebtoken');
const passport = require('passport');

const passportAuth = passport.authenticate('jwt', { session: false });

function Sign(data, secret, expires = false) {
  const token = expires ?
    jwt.sign({ email: data, iat: getDefaultIAT() }, secret, { expiresIn: '14d' }) :
    jwt.sign(Object.assign(data, { iat: getDefaultIAT() }), secret);
  return token;
}

function SignWithOlderIAT(data, secret) {
  return jwt.sign({ email: data, iat: getOlderIAT() }, secret, { expiresIn: '14d' });
}

function SignNewToken(data, secret, expires = false) {
  const token = expires ?
    jwt.sign(getNewTokenPayload(data), secret, { expiresIn: '14d' }) :
    jwt.sign(getNewTokenPayload(data), secret);
  return token;
}

function getNewTokenPayload(userData) {
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
      iat: getDefaultIAT(),
    },
  };
}

function getDefaultIAT() {
  return Math.floor(Date.now() / 1000);
}

function getOlderIAT() {
  return Math.floor(Date.now() / 1000) + 60;
}

module.exports = {
  passportAuth,
  Sign,
  SignNewToken,
  SignWithOlderIAT,
};
