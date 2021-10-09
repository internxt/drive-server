const { passportAuth } = require('../middleware/passport');
const sharedMiddlewareBuilder = require('../middleware/shared-workspace');

module.exports = (Router, Service) => {
  const sharedAdapter = sharedMiddlewareBuilder.build(Service);

  Router.get('/share/list', passportAuth, sharedAdapter, (req, res) => {
    Service.Share.list(req.behalfUser).then((results) => {
      res.status(200).send(results);
    }).catch((err) => {
      res.status(500).send({ error: err.message });
    });
  });
};
