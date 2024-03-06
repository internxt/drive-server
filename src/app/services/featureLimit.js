const { INDIVIDUAL_FREE_TIER_PLAN_ID } = require('../constants');
const { LimitLabels } = require('../middleware/feature-limits.middleware');
const { NoLimitFoundForUserTierAndLabel } = require('./errors/FeatureLimitsErrors');
const { INDIVIDUAL_FREE_TIER_PLAN_ID } = require('../constants');

const LimitTypes = {
  Counter: 'counter',
  Boolean: 'boolean',
};

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

  const findLimitByLabelAndTier = async (tierId, label) => {
    return Model.limits.findOne({
      where: {
        label,
      },
      include: [
        {
          model: Model.tiers,
          where: {
            id: tierId,
          },
        },
      ],
    });
  };

  const isBooleanLimitNotAvailable = (limit) => {
    return limit.type === LimitTypes.Boolean && limit.value !== 'true';
  };

  const shouldLimitBeEnforced = async (user, limitLabel, data) => {
    const limit = await findLimitByLabelAndTier(user.tierId, limitLabel);

    if (!limit) {
      throw new NoLimitFoundForUserTierAndLabel('No limit found for this user tier and label!');
    }
    if (limit.type === LimitTypes.Boolean) {
      return isBooleanLimitNotAvailable(limit);
    }

    const isLimitSuprassed = await checkCounterLimit(user, limit, data);

    return isLimitSuprassed;
  };

  const checkCounterLimit = (user, limit, data) => {
    switch (limit.label) {
      case LimitLabels.MaxFileUploadSize:
        return isMaxFileSizeLimitSurprassed({ limit, data });
      default:
        return false;
    }
  };

  const isMaxFileSizeLimitSurprassed = async ({ limit, data }) => {
    const {
      file: { size },
    } = data;
    return Number(limit.value) < size;
  };

  return {
    Name: 'FeatureLimits',
    getTierByPlanId,
    getIndividualFreeTier,
    shouldLimitBeEnforced,
    getIndividualFreeTier,
  };
};
