// Google ReCaptcha V3
const { default: axios } = require('axios');
const { encode } = require('querystring');

const GOOGLE_RECAPTCHA_V3_ENDPOINT = 'https://www.google.com/recaptcha/api/siteverify';

async function verify(captcha, remoteip = undefined) {
  const body = {
    secret: process.env.RECAPTCHA_V3,
    response: captcha,
    remoteip
  };

  return axios.post(GOOGLE_RECAPTCHA_V3_ENDPOINT, encode(body), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }).then((res) => {
    if (!res.data.success) {
      throw Error(res.data['error-codes']);
    }
  });
}

module.exports = {
  verify
};
