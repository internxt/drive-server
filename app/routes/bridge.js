const passport = require('../middleware/passport');

const { passportAuth } = passport;

module.exports = (Router, Service) => {
  Router.get('/usage', passportAuth, (req, res) => {
    Service.User.getUsage(req.user).then((result) => {
      res.status(200).send(result);
    }).catch(() => {
      res.status(400).send({ result: 'Error retrieving usage information' });
    });
  });

  Router.get('/limit', passportAuth, (req, res) => {
    const { user } = req;

    Service.Limit.getLimit(user.email, user.userId).then((data) => {
      res.status(200).send(data);
    }).catch(() => {
      res.status(400).send({ result: 'Error retrieving bridge information' });
    });
  });
};
