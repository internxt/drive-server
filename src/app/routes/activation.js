const { passportAuth } = require('../middleware/passport');
const logger = require('../../lib/logger').default;

const Logger = logger.getInstance();

module.exports = (Router, Service) => {
  Router.get('/deactivate', passportAuth, (req, res) => {
    const user = req.user.email;

    Service.User.DeactivateUser(user).then(() => {
      Service.Analytics.track({ userId: req.user.uuid, event: 'user-deactivation-request', properties: { email: user } });
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

  Router.get('/user/resend/:email', (req, res) => {
    Service.User.ResendActivationEmail(req.params.email).then(() => {
      res.status(200).send({ message: 'ok' });
    }).catch((err) => {
      Logger.error('Resend activation email error %s', err ? err.message : err);
      res.status(500).send({
        error:
          err.response && err.response.data && err.response.data.error
            ? err.response.data.error
            : 'Internal server error'
      });
    });
  });
};
