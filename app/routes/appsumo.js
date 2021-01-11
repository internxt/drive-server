module.exports = (Router, Service) => {
  Router.post('/appsumo/register', (req, res) => {
    Service.AppSumo.RegisterIncomplete(req.body.email).then((p) => {
      res.status(200).send();
    }).catch((err) => {
      res.status(500).send({ error: err.message });
    });
  });
};
