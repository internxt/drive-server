const { FREE_PLAN_BYTES } = require('../constants');

const stripeService = require('./stripe')();

const FREE_PLAN = {
  planId: '',
  productId: '',
  name: 'Free Plan',
  simpleName: '2GB',
  price: 0,
  isTeam: false,
  storageLimit: FREE_PLAN_BYTES,
  paymentInterval: null
};

module.exports = () => {
  const getIndividualPlan = async (email) => {
    const subscriptionPlans = (await stripeService.getUserSubscriptionPlans(email))
      .filter((plan) => !plan.isTeam);
    const lifetimePlans = (await stripeService.getUserLifetimePlans(email))
      .filter((plan) => !plan.isTeam);

    return lifetimePlans[0] || subscriptionPlans[0] || FREE_PLAN;
  };

  const getTeamPlan = async (email) => {
    const subscriptionPlans = (await stripeService.getUserSubscriptionPlans(email))
      .filter((plan) => plan.isTeam);
    const lifetimePlans = (await stripeService.getUserLifetimePlans(email))
      .filter((plan) => plan.isTeam);

    return lifetimePlans[0] || subscriptionPlans[0] || FREE_PLAN;
  };

  return {
    Name: 'Plan',
    getIndividualPlan,
    getTeamPlan
  };
};
