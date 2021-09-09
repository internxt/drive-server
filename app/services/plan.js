const { FREE_PLAN_BYTES } = require('../constants');

const StripeService = require('./stripe');
const LimitService = require('./limit');

const FREE_PLAN = {
  planId: '',
  productId: '',
  name: 'Free Plan',
  simpleName: '2GB',
  price: 0,
  isTeam: false,
  storageLimit: FREE_PLAN_BYTES,
  paymentInterval: null,
  isLifetime: false
};

const lifetimePlanFactory = (maxSpaceBytes, isTeam) => ({
  planId: '',
  productId: '',
  name: 'Lifetime',
  simpleName: 'lifetime',
  price: 0,
  isTeam,
  storageLimit: maxSpaceBytes,
  paymentInterval: null,
  isLifetime: true
});

module.exports = (Model, App) => {
  const stripeService = StripeService(Model, App);
  const limitService = LimitService(Model, App);

  const getIndividualPlan = async (userEmail, userId) => {
    const subscriptionPlans = (await stripeService.getUserSubscriptionPlans(userEmail, userId))
      .filter((plan) => !plan.isTeam);
    let result = subscriptionPlans[0];

    if (!result) {
      const { maxSpaceBytes } = (await limitService.getLimit(userEmail, userId));

      result = maxSpaceBytes > FREE_PLAN_BYTES
        ? lifetimePlanFactory(maxSpaceBytes, false)
        : FREE_PLAN;
    }

    return result;
  };

  const getTeamPlan = async (userEmail, userId) => {
    const subscriptionPlans = (await stripeService.getUserSubscriptionPlans(userEmail, userId))
      .filter((plan) => plan.isTeam);
    let result = subscriptionPlans[0];

    if (!result) {
      const { maxSpaceBytes } = (await limitService.getLimit(userEmail, userId));

      result = maxSpaceBytes > FREE_PLAN_BYTES
        ? lifetimePlanFactory(maxSpaceBytes, true)
        : FREE_PLAN;
    }

    return result;
  };

  return {
    Name: 'Plan',
    getIndividualPlan,
    getTeamPlan
  };
};
