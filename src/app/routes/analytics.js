const { passportAuth } = require('../middleware/passport');
const { page } = require('../middleware/analytics');
const AnalyticsService = require('../../lib/analytics/AnalyticsService');

module.exports = (Router) => {
  Router.post('/data', passportAuth, (req, res) => {
    res.status(200).send();
    const { actionName } = req.body;
    AnalyticsService.actions[actionName](req);
  });

  Router.post('/data/p', page, (req, res) => {
    res.status(200).send();
  });

  Router.post('/data/t', page, (req, res) => {
    res.status(200).send();
  });
};
