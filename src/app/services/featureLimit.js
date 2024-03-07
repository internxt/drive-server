const { INDIVIDUAL_FREE_TIER_PLAN_ID } = require('../constants');

module.exports = (Model, App) => {
  const getTierByPlanId = async (planId) => {
    return Model.paidPlans.findOne({
      where: { planId },
      include: [Model.tiers],
    });
  };

  const getIndividualFreeTier = async () => {
    return getTierByPlanId(INDIVIDUAL_FREE_TIER_PLAN_ID);
  };

  return {
    Name: 'FeatureLimits',
    getTierByPlanId,
    getIndividualFreeTier,
  };
};
