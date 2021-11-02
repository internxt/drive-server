const Logger = require('../../lib/logger');

module.exports = (Router, Service, App) => {
  const logger = Logger.getInstance();

  Router.post('/newsletter/subscribe', async (req, res) => {
    const { email, groupId } = req.body;

    try {
      await App.services.Newsletter.subscribe(email, groupId);

      res.status(200).send({ message: 'Subscribed to newsletter!' });
    } catch (err) {
      const errMessage = `Error subscribing to newsletter email '${email}': ${err}`;

      logger.error(errMessage);
      res.status(400).send({ error: errMessage });
    }
  });
};
