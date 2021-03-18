const { passportAuth } = require('../middleware/passport');
const logger = require('../../lib/logger');

const Logger = logger.getInstance();

module.exports = (Router, Service) => {
  Router.get('/user/activations/:token', (req, res) => {
    Service.User.ActivateUser(req.params.token).then((response) => {
      const body = response.data;
      res.status(200).send(body);
    }).catch((err) => {
      res.status(err.response.status).send(err.response.data);
    });
  });

  Router.get('/user/isactivated', passportAuth, (req, res) => {
    const user = req.user.email;

    Service.Storj.IsUserActivated(user).then((response) => {
      if (response.data) {
        res.status(200).send({ activated: response.data.activated });
      } else {
        res.status(400).send({ error: 'User activation info not found' });
      }
    }).catch((error) => {
      Logger.error(error.stack);
      res.status(500).json({ error: error.message });
    });
  });

  Router.get('/team/isactivated/:email', passportAuth, (req, res) => {
    const user = req.user.email;
    const bridgeUser = req.params.email;

    Service.Team.getTeamByMember(user).then((team) => {
      if (team.dataValues.bridge_user === bridgeUser) {
        Service.Storj.IsUserActivated(bridgeUser).then((responseTeam) => {
          if (responseTeam.status === 200) {
            const isTeamActivated = responseTeam.data.activated;
            const teamId = team.id;

            res.status(200).send({
              isTeamActivated,
              teamId
            });
          } else {
            res.status(400).send({ error: 'User activation info not found' });
          }
        }).catch((error) => {
          Logger.error(error.stack);
          res.status(500).json({ error: error.message });
        });
      } else {
        res.status(500).json({});
      }
    }).catch((error) => {
      if (!error) {
        // Not admin
        res.status(200).json({});
      }
      Logger.error(error.stack);
    });
  });

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
