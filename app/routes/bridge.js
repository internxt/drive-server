const axios = require('axios');

const passport = require('../middleware/passport');

const { passportAuth } = passport;

module.exports = (Router, Service, App) => {
  Router.get('/usage', passportAuth, (req, res) => {
    Service.User.getUsage(req.user).then((result) => {
      res.status(200).send(result);
    }).catch(() => {
      res.status(400).send({ result: 'Error retrieving usage information' });
    });
  });

  // TODO
  Router.get('/limit', passportAuth, (req, res) => {
    const userData = req.user;

    const pwd = userData.userId;
    const pwdHash = Service.Crypt.hashSha256(pwd);

    const credential = Buffer.from(`${userData.email}:${pwdHash}`).toString('base64');

    axios.get(`${App.config.get('STORJ_BRIDGE')}/limit`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credential}`
      }
    }).then((data) => {
      res.status(200).send(data.data);
    }).catch(() => {
      res.status(400).send({ result: 'Error retrieving bridge information' });
    });
  });
};
