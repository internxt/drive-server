
module.exports = (Model, App) => {
  const getTierByPlanId = async (planId) => {
    return Model.paidPlans.findOne({
      where: { planId },
      include: [Model.tiers],
    });
  };

  return {
    Name: 'FeatureLimits',
    getTierByPlanId,
  };
};
