const { passportAuth } = require('../middleware/passport');
const AnalyticsService = require('../../lib/analytics/AnalyticsService');

module.exports = (Router) => {
  Router.post('/data', passportAuth, (req, res) => {
    const { actionName } = req.body;
    AnalyticsService.actions[actionName](req);

    res.status(200).send();
  });
};