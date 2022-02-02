const { passportAuth } = require('../middleware/passport');
const { page } = require('../middleware/analytics');
const AnalyticsService = require('../../lib/analytics/AnalyticsService');

module.exports = (Router) => {
  Router.post('/data', passportAuth, (req, res) => {
    res.status(200).send();
    try {
      const { actionName } = req.body;
      AnalyticsService.actions[actionName](req);
    }
    catch(err) {
      // NO OP
    };
  });

  Router.post('/data/p', page, (req, res) => {
    res.status(200).send();
  });

  Router.post('/data/t', (req, res) => {
    res.status(200).send();
    try {
      const { actionName } = req.body;
      AnalyticsService.actions[actionName](req);
    }
    catch(err) {
      // NO OP
    };
  });

};
