// Google ReCaptcha V3
import axios from 'axios';
import { encode } from 'querystring';
import { isProduction } from '../config/environments/env';

const GOOGLE_RECAPTCHA_V3_ENDPOINT = 'https://www.google.com/recaptcha/api/siteverify';

export async function verify(captcha: any, remoteip?: string) {
  if (!isProduction()) {
    return {};
  }
  const body = {
    secret: process.env.RECAPTCHA_V3,
    response: captcha,
    remoteip,
  };

  return axios
    .post(GOOGLE_RECAPTCHA_V3_ENDPOINT, encode(body), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    .then((res: any) => {
      if (!res.data.success) {
        throw Error(res.data['error-codes']);
      }

      const scoreThreshold = process.env.RECAPTCHA_V3_SCORE_THRESHOLD || 0.5;
      const { score } = res.data;

      if (score < scoreThreshold) {
        throw Error(`Score ${score} under ${scoreThreshold}`);
      }

      return res.data;
    });
}
