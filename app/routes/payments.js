const axios = require('axios');
const sgMail = require('@sendgrid/mail');
const { passportAuth } = require('../middleware/passport');

module.exports = (Router, Service, App) => {
  Router.post('/token/buy', passportAuth, (req, res) => {
    const { currency, email, message, plan, pay, inxt, wallet } = req.body;

    // eslint-disable-next-line max-len
    const emailBody = `Account Email: ${email}. \nCurrency: ${currency}. \nPlan: ${plan}. \nPay: ${pay}. ${message ? `\nMessage:  ${message}.` : ''}\nWallet: ${wallet}.\nINXT: ${inxt}`;

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: 'hello@internxt.com',
      from: 'hello@internxt.com',
      subject: 'Payment with INXT Token',
      text: emailBody
    };

    sgMail.send(msg).then(() => {
      res.status(200).send({});
    }).catch((err) => {
      res.status(500).send(err);
    });
  });

  Router.get('/token/info', passportAuth, (req, res) => {
    // eslint-disable-next-line max-len
    const URL = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?CMC_PRO_API_KEY=${process.env.COIN_MARKET_CAP_API_KEY}&symbol=INXT&convert=EUR`;
    axios.get(URL).then((data) => {
      res.status(200).send(data.data.data);
    });
  });
};
