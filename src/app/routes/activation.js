const { passportAuth } = require('../middleware/passport');
const logger = require('../../lib/logger').default.getInstance();
const AnalyticsService = require('../../lib/analytics/AnalyticsService');

module.exports = (Router, Service) => {
  Router.get('/deactivate', passportAuth, (req, res) => {
    const { email, uuid } = req.user;

    Service.User.DeactivateUser(user).then(() => {
      res.status(200).send({ error: null, message: 'User deactivated' });
      AnalyticsService.trackDeactivationRequest(req);
    }).catch((err) => {
      res.status(500).send({ error: err.message });

      logger.error('[DEACTIVATE]: ERROR deactivating user %s: %s', email, err.message);
    });
  });

  Router.get('/reset/:email', (req, res) => {
    const email = req.params.email.toLowerCase();

    Service.User.DeactivateUser(email).then(() => {
      res.status(200).send();

      logger.info('[RESET]: User %s deactivated', email);
    }).catch((err) => {
      res.status(200).send();

      logger.info('[RESET]: ERROR for user %s: %s', email, err.message);
    });
  });

  Router.get('/confirmDeactivation/:token', (req, res) => {
    const { token } = req.params;

    Service.User.ConfirmDeactivateUser(token).then(() => {
      res.status(200).send(req.data);

      logger.info('[CONFIRM-DEACTIVATION]: Token %s used for deactivation', token);
    }).catch((err) => {
      res.status(500).send({ error: err.message });

      logger.info('[CONFIRM-DEACTIVATION]: ERROR token %s used: %s', token, err.message);
    });
  });
};
