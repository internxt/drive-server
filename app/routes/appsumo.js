const { passportAuth } = require('../middleware/passport');

module.exports = (Router, Service) => {
  Router.post('/appsumo/register', (req, res) => {
    Service.AppSumo.RegisterIncomplete(req.body.email).then(() => {
      res.status(200).send();
    }).catch((err) => {
      res.status(500).send({ error: err.message });
    });
  });

  Router.post('/appsumo/update', passportAuth, (req, res) => {
    Service.AppSumo.CompleteInfo(req.user, req.body).then(() => {
      res.status(200).send();
    }).catch((err) => {
      res.status(500).send({ error: err.message });
    });
  });
};
