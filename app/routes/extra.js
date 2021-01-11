const { passportAuth } = require('../middleware/passport');
const logger = require('../../lib/logger');

const Logger = logger.getInstance();

module.exports = (Router) => {
  Router.get('/welcome', passportAuth, (req, res) => {
    res.status(200).send({ file_exists: !!req.user.welcomePack });
  });

  Router.delete('/welcome', passportAuth, (req, res) => {
    req.user.welcomePack = false;
    req.user.save().then(() => {
      res.status(200).send();
    }).catch((err) => {
      Logger.error('Cannot delete welcome files: %s', err.message);
      res.status(500).send({ error: 'Welcome files cannot be deleted' });
    });
  });
};
