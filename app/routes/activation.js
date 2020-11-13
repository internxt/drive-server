const passport = require('../middleware/passport');

const { passportAuth } = passport;

module.exports = (Router, Service, Logger, App) => {

  Router.get('/user/activations/:token', (req, res) => {
    Service.User.ActivateUser(req.params.token).then((response) => {
      const body = response.data;
      Service.Analytics.track({ userId: body.uuid, event: 'user-activated', email: body.id })
      res.status(200).send(body);
    }).catch(err => {
      res.status(err.response.status).send(err.response.data)
    })
  })

  Router.get('/user/isactivated', passportAuth, (req, res) => {
    const user = req.user.email;

    Service.Storj.IsUserActivated(user)
      .then((response) => {
        if (response.data) {
          res.status(200).send({ activated: response.data.activated });
        } else {
          res.status(400).send({ error: 'User activation info not found' });
        }
      })
      .catch((error) => {
        Logger.error(error.stack);
        res.status(500).json({ error: error.message });
      });
  });

  Router.get('/deactivate', passportAuth, (req, res) => {
    const user = req.user.email;

    Service.User.DeactivateUser(user)
      .then(() => {
        Service.Analytics.track({ userId: req.user.uuid, event: 'user-deactivation-request' })
        res.status(200).send({ error: null, message: 'User deactivated' });
      })
      .catch((err) => {
        res.status(500).send({ error: err.message });
      });
  });

  Router.get('/reset/:email', (req, res) => {
    const user = req.params.email.toLowerCase();
    Service.User.DeactivateUser(user)
      .then(() => {
        res.status(200).send();
      })
      .catch(() => {
        res.status(200).send();
      });
  });

  Router.get('/confirmDeactivation/:token', (req, res) => {
    const { token } = req.params;

    Service.User.ConfirmDeactivateUser(token)
      .then((resConfirm) => {
        res.status(resConfirm.status).send(req.data);
      })
      .catch((err) => {
        log.error('Deactivation request to Server failed: %s', err.message);
        res.status(400).send({ error: err.message });
      });
  });

  Router.get('/user/resend/:email', (req, res) => {
    Service.User.ResendActivationEmail(req.params.email)
      .then(() => {
        res.status(200).send({ message: 'ok' });
      })
      .catch((err) => {
        res.status(500).send({
          error:
            err.response.data && err.response.data.error
              ? err.response.data.error
              : 'Internal server error',
        });
      });
  });
};
