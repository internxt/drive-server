const StripeTest = require('stripe')(process.env.STRIPE_SK_TEST, { apiVersion: '2020-08-27' });
const StripeProduction = require('stripe')(process.env.STRIPE_SK, { apiVersion: '2020-08-27' });

const async = require('async');
const cache = require('memory-cache');

const RenewalPeriod = {
  Monthly: 'monthly',
  Semiannually: 'semiannually',
  Annually: 'annually',
  Lifetime: 'lifetime'
};

function getMonthCount(intervalCount, timeInterval) {
  const byTimeIntervalCalculator = {
    month: () => intervalCount,
    year: () => intervalCount * 12
  };

  return byTimeIntervalCalculator[timeInterval]();
}

function getMonthlyAmount(totalPrice, intervalCount, timeInterval) {
  const monthCount = getMonthCount(intervalCount, timeInterval);
  const monthlyPrice = totalPrice / monthCount;

  return monthlyPrice;
}

function getRenewalPeriod(intervalCount, interval) {
  let renewalPeriod = RenewalPeriod.Monthly;

  if (interval === 'month' && intervalCount === 6) {
    renewalPeriod = RenewalPeriod.Semiannually;
  } else if (interval === 'year') {
    renewalPeriod = RenewalPeriod.Annually;
  }

  return renewalPeriod;
}

module.exports = () => {
  const getStripe = (isTest = false) => {
    return isTest ? StripeTest : StripeProduction;
  };

  const getStorageProducts = (test = false) => new Promise((resolve, reject) => {
    const stripe = getStripe(test);

    stripe.products.list({
      limit: 100
    }, (err, products) => {
      if (err) {
        reject(err);
      } else {
        const productsMin = products.data
          .filter((p) => p.metadata.is_drive === '1'
            && p.metadata.show === '1')
          .map((p) => ({ id: p.id, name: p.name, metadata: p.metadata }))
          .sort((a, b) => a.metadata.size_bytes * 1 - b.metadata.size_bytes * 1);
        resolve(productsMin);
      }
    });
  });

  const getStoragePlans = (stripeProduct, test = false) => new Promise((resolve, reject) => {
    const stripe = getStripe(test);

    stripe.plans.list({ product: stripeProduct, active: true },
      (err, plans) => {
        if (err) {
          reject(err.message);
        } else {
          const plansMin = plans.data.map((p) => ({
            id: p.id,
            price: p.amount,
            name: p.nickname,
            interval: p.interval,
            interval_count: p.interval_count
          })).sort((a, b) => a.price * 1 - b.price * 1);
          resolve(plansMin);
        }
      });
  });

  const getProductPrices = (productId, test = false) => new Promise((resolve, reject) => {
    const stripe = getStripe(test);

    stripe.prices.list({ product: productId, active: true },
      (err, response) => {
        if (err) {
          reject(err.message);
        } else {
          const prices = response.data
            .filter((p) => !!p.metadata.show)
            .map((p) => ({
              id: p.id,
              name: p.nickname,
              amount: p.unit_amount,
              currency: p.currency,
              recurring: p.recurring,
              type: p.type
            }))
            .sort((a, b) => a.amount * 1 - b.amount * 1);

          resolve(prices);
        }
      });
  });

  // TODO: Flag force reload
  const getAllStorageProducts = (isTest = false) => new Promise((resolve, reject) => {
    const stripe = getStripe(isTest);

    const cacheName = `stripe_plans_v2_${isTest ? 'test' : 'production'}`;

    const cachedPlans = cache.get(cacheName);

    if (cachedPlans) {
      return resolve(cachedPlans);
    }

    return stripe.products.list({
      limit: 100
    }, (err, products) => {
      if (err) {
        reject(err);
      } else {
        const productsMin = products.data
          .filter((p) => (p.metadata.is_drive === '1' || p.metadata.is_teams === '1')
            && p.metadata.show === '1' && p.metadata.member_tier === 'subscriber')
          .map((p) => ({ id: p.id, name: p.name, metadata: p.metadata }))
          .sort((a, b) => a.metadata.size_bytes * 1 - b.metadata.size_bytes * 1);

        async.eachSeries(productsMin, async (product) => {
          const plans = await getStoragePlans(product.id, isTest);
          product.plans = plans;
        }, (err2) => {
          // err2: Avoid shadowed variables
          if (err2) {
            return reject(err2);
          }

          cache.put(cacheName, productsMin, 1000 * 60 * 30);
          return resolve(productsMin);
        });
      }
    });
  });

  /**
   * @description Adds a product for every product.price found
   * @param {*} isTest
   * @returns
   */
  const getAllStorageProducts2 = (isTest = false) => new Promise((resolve, reject) => {
    const stripe = getStripe(isTest);
    const cacheName = `stripe_plans_v3_${isTest ? 'test' : 'production'}`;
    const cachedPlans = cache.get(cacheName);

    if (cachedPlans) {
      return resolve(cachedPlans);
    }

    return stripe.products.list({
      limit: 100
    }, async (err, response) => {
      if (err) {
        reject(err);
      } else {
        const stripeProducts = response.data
          .filter((p) => (p.metadata.is_drive === '1' || p.metadata.is_teams === '1')
            && p.metadata.show === '1')
          .map((p) => ({
            id: p.id,
            name: p.name,
            metadata: {
              ...p.metadata,
              is_drive: !!p.metadata.is_drive,
              is_teams: !!p.metadata.is_teams,
              show: !!p.metadata.show,
              size_bytes: p.metadata.size_bytes && parseInt(p.metadata.size_bytes, 10)
            }
          }))
          .sort((a, b) => a.metadata.size_bytes * 1 - b.metadata.size_bytes * 1);
        const products = [];

        async.eachSeries(stripeProducts, async (stripeProduct) => {
          const prices = await getProductPrices(stripeProduct.id, isTest);

          products.push(...prices.map((price) => ({
            ...stripeProduct,
            price: {
              ...price,
              amount: price.amount * 0.01,
              monthlyAmount: (price.recurring
                ? getMonthlyAmount(price.amount, price.recurring.interval_count, price.recurring.interval)
                : price.amount) * 0.01
            },
            renewalPeriod: price.recurring
              ? getRenewalPeriod(price.recurring.interval_count, price.recurring.interval)
              : RenewalPeriod.Lifetime
          })));
        }, (err2) => {
          // err2: Avoid shadowed variables
          if (err2) {
            return reject(err2);
          }

          cache.put(cacheName, products, 1000 * 60 * 30);
          return resolve(products);
        });
      }
    });
  });

  const getTeamProducts = (test = false) => new Promise((resolve, reject) => {
    const stripe = getStripe(test);

    stripe.products.list({
      limit: 100
    }, (err, products) => {
      if (err) {
        reject(err);
      } else {
        const productsMin = products.data
          .filter((p) => p.metadata.is_teams === '1' && p.metadata.show === '1')
          .map((p) => ({ id: p.id, name: p.name, metadata: p.metadata }))
          .sort((a, b) => a.metadata.size_bytes * 1 - b.metadata.size_bytes * 1);
        resolve(productsMin);
      }
    });
  });

  const getTeamPlans = (stripeProduct, test = false) => new Promise((resolve, reject) => {
    const stripe = getStripe(test);

    stripe.plans.list({ product: stripeProduct, active: true }, (err, plans) => {
      if (err) {
        reject(err.message);
      } else {
        const plansMin = plans.data
          .map((p) => ({
            id: p.id,
            price: p.amount,
            name: p.nickname,
            interval: p.interval,
            interval_count: p.interval_count
          })).sort((a, b) => a.price * 1 - b.price * 1);
        resolve(plansMin);
      }
    });
  });

  const findCustomerByEmail = async (email, isTest = false) => {
    const stripe = getStripe(isTest);
    const result = await stripe.customers.list({ email, limit: 1 });
    return result.data && result.data[0];
  };

  /**
   * ! To fix duplicated stripe customers
   */
  const findCustomersByEmail = async (email, isTest = false) => {
    const stripe = getStripe(isTest);
    const result = await stripe.customers.list({ email });
    return result.data;
  };

  const getBilling = async (customerID, url, isTest = false) => {
    const stripe = getStripe(isTest);
    const result = await stripe.billingPortal.sessions.create({
      customer: customerID,
      return_url: url
    });
    return result.url;
  };

  const getUserSubscriptionPlans = async (email) => {
    const isTest = process.env.NODE_ENV !== 'production';
    const stripe = await getStripe(isTest);
    const customers = await findCustomersByEmail(email, isTest);
    const plans = [];

    if (customers) {
      // ! To fix duplicated stripe customers
      await async.eachSeries(customers, async (customer) => {
        const expandedCustomer = await stripe.customers.retrieve(customer.id, {
          expand: ['subscriptions.data.plan.product']
        });

        expandedCustomer.subscriptions.data
          .sort((a, b) => b.created - a.created);

        plans.push(...expandedCustomer.subscriptions.data.map((subscription) => ({
          status: subscription.status,
          planId: subscription.plan.id,
          productId: subscription.plan.product.id,
          name: subscription.plan.product.name,
          simpleName: subscription.plan.product.metadata.simple_name,
          price: subscription.plan.amount * 0.01,
          monthlyPrice: getMonthlyAmount(subscription.plan.amount * 0.01, subscription.plan.interval_count, subscription.plan.interval),
          currency: subscription.plan.currency,
          isTeam: !!subscription.plan.product.metadata.is_teams,
          storageLimit: subscription.plan.product.metadata.size_bytes,
          paymentInterval: subscription.plan.nickname,
          isLifetime: false,
          renewalPeriod: getRenewalPeriod(subscription.plan.intervalCount, subscription.plan.interval)
        })));
      });
    }

    return plans;
  };

  return {
    Name: 'Stripe',
    getStorageProducts,
    getAllStorageProducts,
    getAllStorageProducts2,
    getStoragePlans,
    getProductPrices,
    getTeamProducts,
    getTeamPlans,
    findCustomerByEmail,
    getBilling,
    getUserSubscriptionPlans
  };
};
