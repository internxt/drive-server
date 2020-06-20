const useragent = require('useragent');

const passport = require('~middleware/passport');

const { passportAuth } = passport;

module.exports = (Router, Service, Logger, App) => {
  Router.get('/storage/tree', passportAuth, function (req, res) {
    const { user } = req;
    const agent = useragent.parse(req.headers['user-agent']);

    if (agent && agent.family === 'Electron') {
      Service.Statistics.Insert({
        name: 'X Cloud Desktop',
        user: user.email,
        userAgent: agent.source,
      })
        .then(() => {})
        .catch((err) => {
          console.log('Error creating statistics:', err);
        });
    }

    Service.User.UpdateAccountActivity(user.email);

    Service.Folder.GetTree(user)
      .then((result) => {
        res.status(200).send(result);
      })
      .catch((err) => {
        res.status(500).send({ error: err.message });
      });
  });

  Router.put('/user/sync', passportAuth, function (req, res) {
    const { user, body } = req;
    res.setHeader('Content-Type', 'application/json');
    Service.User.UpdateUserSync(user.email, body.toNull)
      .then((result) => {
        res.status(200).json({ data: result });
      })
      .catch((err) => {
        res.status(500).json({ error: err.message });
      });
  });

  Router.get('/user/sync', passportAuth, function (req, res) {
    const { user } = req;
    res.setHeader('Content-Type', 'application/json');
    Service.User.GetOrSetUserSync(user.email)
      .then((result) => {
        res.status(200).json({ data: result });
      })
      .catch((err) => {
        res.status(500).json({ error: err.message });
      });
  });
};
