const passport = require('~middleware/passport');

const { passportAuth } = passport;

module.exports = (Router, Service, Logger, App) => {
  Router.get('/user/isactivated', passportAuth, function (req, res) {
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

  Router.get('/deactivate', passportAuth, function (req, res) {
    const user = req.user.email;


    console.log(user.credit);

    Service.User.DeactivateUser(user)
      .then((bridgeRes) => {
        res.status(200).send({ error: null, message: 'User deactivated' });
      })
      .catch((err) => {
        res.status(500).send({ error: err.message });
      });
  });

  Router.get('/reset/:email', function (req, res) {
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
        console.log('Deactivation request to Server failed');
        console.log(err);
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
