const createHttpError = require('http-errors');
const passport = require('../middleware/passport');
const logger = require('../../lib/logger').default;

const Logger = logger.getInstance();

const { passportAuth } = passport;

module.exports = (Router, Service) => {
  Router.get('/plan/individual', passportAuth, async (req, res) => {
    try {
      const { user } = req;

      const appSumoPlan = await Service.AppSumo.GetDetails(user).catch(() => null);

      if (appSumoPlan && appSumoPlan.planId !== 'internxt_free1') {
        const result = {
          isAppSumo: true,
          price: 0,
          details: appSumoPlan,
        };

        return res.status(200).send(result);
      }

      const plan = await Service.Plan.getIndividualPlan(user.bridgeUser, user.userId);

      if (!plan) {
        throw createHttpError(404, 'Individual plan not found');
      }

      return res.status(200).json(plan);
    } catch (error) {
      const errorMessage = error.message || '';

      Logger.error(`Error getting stripe individual plan ${req.user.email}: ${error.message}`);
      return res.status(500).send({ error: errorMessage });
    }
  });
};
