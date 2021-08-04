const { passportAuth } = require('../middleware/passport');

module.exports = (Router, Service, App) => {
  Router.get('/share/list', passportAuth, (req, res) => {
    Service.Share.list(req.user).then((results) => {
      res.status(200).send(results);
    }).catch((err) => {
      res.status(500).send({ error: err.message });
    });
  });
};
