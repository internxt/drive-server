// Google ReCaptcha V3
const { default: axios } = require('axios');
const { encode } = require('querystring');
const Logger = require('./logger');

const log = Logger.getInstance();

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

    const scoreThreshold = process.env.RECAPTCHA_V3_SCORE_THRESHOLD || 0.5;
    const { score } = res.data;

    if (score < scoreThreshold) {
      throw Error(`Score ${score} under ${scoreThreshold}`);
    }

    return res.data;
  }).catch((err) => {
    log.error(`RECAPTCHA ERROR ${err.isAxiosError ? JSON.stringify(err.response.data) : err.message}`);

    throw err;
  });
}

module.exports = {
  verify
};
