const { passportAuth } = require('../middleware/passport');
const AnalyticsService = require('../../lib/analytics/AnalyticsService');

module.exports = (Router, Service) => {
  Router.get('/deactivate', passportAuth, (req, res) => {
    const user = req.user.email;

    Service.User.DeactivateUser(user).then(() => {
      AnalyticsService.trackDeactivationRequest(req.user.uuid);
      res.status(200).send({ error: null, message: 'User deactivated' });
    }).catch((err) => {
      res.status(500).send({ error: err.message });
    });
  });

  Router.get('/reset/:email', (req, res) => {
    const user = req.params.email.toLowerCase();
    Service.User.DeactivateUser(user).then(() => {
      res.status(200).send();
    }).catch(() => {
      res.status(200).send();
    });
  });

  Router.get('/confirmDeactivation/:token', (req, res) => {
    const { token } = req.params;

    Service.User.ConfirmDeactivateUser(token).then(() => {
      res.status(200).send(req.data);
    }).catch((err) => {
      res.status(400).send({ error: err.message });
    });
  });
};
