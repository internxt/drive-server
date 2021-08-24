const createHttpError = require('http-errors');
const passport = require('../middleware/passport');
const logger = require('../../lib/logger');

const Logger = logger.getInstance();

const { passportAuth } = passport;

module.exports = (Router, Service) => {
  Router.get('/plan/individual', passportAuth, async (req, res) => {
    try {
      const plan = await Service.Plan.getIndividualPlan(req.user.email);

      if (!plan) {
        throw createHttpError(404, 'Individual plan not found');
      }

      res.status(200).json(plan);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      const errorMessage = error.message || '';

      Logger.error(`Error getting stripe individual plan ${req.user.email}: ${error.message}`);
      res.status(statusCode).send({ error: errorMessage });
    }
  });

  Router.get('/plan/team', passportAuth, async (req, res) => {
    try {
      const team = await Service.Team.getTeamByMember(req.user.email);

      if (!team) {
        throw createHttpError(404, `Team not found by member email: ${req.user.email}`);
      }

      const plan = await Service.Plan.getTeamPlan(team.admin);

      if (!plan) {
        throw createHttpError(404, 'Team plan not found');
      }

      return res.status(200).json(plan);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      const errorMessage = error.message || '';

      Logger.error(`Error getting stripe team plan ${req.user.email}: ${error.message}`);
      return res.status(statusCode).send({ error: errorMessage });
    }
  });
};
