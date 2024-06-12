const { default: axios } = require('axios');
const { MAX_FREE_PLAN_BYTES, FREE_PLAN_BYTES } = require('../constants');

const StripeService = require('./stripe');
const LimitService = require('./limit');

const FREE_PLAN = {
  planId: '',
  productId: '',
  name: 'Free Plan',
  simpleName: '2GB',
  price: 0,
  monthlyPrice: 0,
  currency: '',
  isTeam: false,
  storageLimit: FREE_PLAN_BYTES,
  paymentInterval: null,
  isLifetime: false,
  renewalPeriod: '',
};

const lifetimePlanFactory = (maxSpaceBytes, isTeam) => ({
  planId: '',
  productId: '',
  name: 'Lifetime',
  simpleName: 'lifetime',
  price: 0,
  monthlyPrice: 0,
  currency: '',
  isTeam,
  storageLimit: maxSpaceBytes,
  paymentInterval: null,
  isLifetime: true,
  renewalPeriod: 'lifetime',
});

module.exports = (Model, App) => {
  const stripeService = StripeService(Model, App);
  const limitService = LimitService(Model, App);

  const getByUserId = (userId) => Model.plan.findOne({ userId });
  const getByName = (name) => Model.plan.findOne({ name });
  const create = ({ userId, name, type, limit }) => {
    return Model.plan.create({
      userId,
      name,
      type,
      limit,
    });
  };

  const createOrUpdate = (plan) => {
    return Model.plan.findOne({ where: { userId: plan.userId } }).then((dbPlan) => {
      if (!dbPlan) {
        return create(plan);
      }

      dbPlan.name = plan.name;
      dbPlan.type = plan.type;
      dbPlan.limit = plan.limit;

      return dbPlan.save();
    });
  };
  const deleteByUserId = (userId) => Model.plan.destroy({ where: { userId } });
  const createAndSetBucketLimit = (newPlan, bucketId, bucketLimit) => {
    const { GATEWAY_USER, GATEWAY_PASS } = process.env;

    return create(newPlan).then(() => {
      return axios.patch(
        `${process.env.STORJ_BRIDGE}/gateway/bucket/${bucketId}`,
        {
          limit: bucketLimit,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          auth: { username: GATEWAY_USER, password: GATEWAY_PASS },
        },
      );
    });
  };

  const getIndividualPlan = async (userEmail, userId) => {
    const subscriptionPlans = (await stripeService.getUserSubscriptionPlans(userEmail, userId))
      .filter((subscription) => subscription.status === 'active' || subscription.status === 'trialing')
      .filter((plan) => !plan.isTeam);
    let result = subscriptionPlans[0];

    if (!result) {
      const { maxSpaceBytes } = await limitService.getLimit(userEmail, userId);

      result = maxSpaceBytes > MAX_FREE_PLAN_BYTES ? lifetimePlanFactory(maxSpaceBytes, false) : FREE_PLAN;
    }

    return result;
  };

  const hasBeenIndividualSubscribedAnyTime = async (user, networkUser, networkPass) => {
    const userExistsInPayments = await stripeService.userExistsInPayments(user);
    const { maxSpaceBytes } = await limitService.getLimit(networkUser, networkPass);
    const isLifetime = maxSpaceBytes > MAX_FREE_PLAN_BYTES;

    return userExistsInPayments || isLifetime;
  };

  const isValid = (plan) => {
    return plan && plan.name && plan.limit > 0 && (plan.type === 'subscription' || plan.type === 'one_time');
  };

  const getTeamPlan = async (userEmail, userId) => {
    const subscriptionPlans = (await stripeService.getUserSubscriptionPlans(userEmail, userId))
      .filter((subscription) => subscription.status === 'active' || subscription.status === 'trialing')
      .filter((plan) => plan.isTeam);
    let result = subscriptionPlans[0];

    if (!result) {
      const { maxSpaceBytes } = await limitService.getLimit(userEmail, userId);

      result = maxSpaceBytes > FREE_PLAN_BYTES ? lifetimePlanFactory(maxSpaceBytes, true) : FREE_PLAN;
    }

    return result;
  };

  return {
    Name: 'Plan',
    getIndividualPlan,
    getTeamPlan,
    isValid,
    create,
    createOrUpdate,
    getByName,
    getByUserId,
    deleteByUserId,
    createAndSetBucketLimit,
    hasBeenIndividualSubscribedAnyTime,
  };
};
