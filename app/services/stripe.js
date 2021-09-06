const StripeTest = require('stripe')(process.env.STRIPE_SK_TEST, { apiVersion: '2020-08-27' });
const StripeProduction = require('stripe')(process.env.STRIPE_SK, { apiVersion: '2020-08-27' });

const async = require('async');
const cache = require('memory-cache');

const envService = require('./envService')();

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
          .filter((p) => p.metadata.is_drive === '1' && p.metadata.show === '1')
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

  // TODO: Flag force reload
  const getAllStorageProducts = (isTest = false) => new Promise((resolve, reject) => {
    const stripe = getStripe(isTest);

    const cacheName = `stripe_plans_${isTest ? 'test' : 'production'}`;

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
            && p.metadata.show === '1')
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

  const getBilling = async (customerID, url, isTest = false) => {
    const stripe = getStripe(isTest);
    const result = await stripe.billingPortal.sessions.create({
      customer: customerID,
      return_url: url
    });
    return result.url;
  };

  const getProductFromUser = async (email) => {
    const isTest = !envService.isProduction();
    const stripe = await getStripe(isTest);
    const customer = await findCustomerByEmail(email, isTest);

    if (!customer) {
      return customer;
    }

    const expandedCustomer = await stripe.customers.retrieve(customer.id, {
      expand: ['subscriptions']
    });

    expandedCustomer.subscriptions.data.sort((a, b) => b.created - a.created);

    const { plan } = expandedCustomer.subscriptions.data[0];

    const product = await stripe.products.retrieve(plan.product);

    return {
      productId: product.id,
      name: product.name,
      price: product.metadata.price_eur,
      paymentInterval: plan.nickname,
      planId: plan.id
    };
  };

  const getUserSubscriptionPlans = async (email) => {
    const isTest = !envService.isProduction();
    const stripe = await getStripe(isTest);
    const customer = await findCustomerByEmail(email, isTest);
    let plans = [];

    if (customer) {
      const expandedCustomer = await stripe.customers.retrieve(customer.id, {
        expand: ['subscriptions.data.plan.product']
      });

      expandedCustomer.subscriptions.data
        // .filter((subscription) => subscription.status === 'active')
        .sort((a, b) => b.created - a.created);

      plans = expandedCustomer.subscriptions.data.map((subscription) => ({
        planId: subscription.plan.id,
        productId: subscription.plan.product.id,
        name: subscription.plan.product.name,
        simpleName: subscription.plan.product.metadata.simple_name,
        price: subscription.plan.product.metadata.price_eur,
        isTeam: !!subscription.plan.product.metadata.is_teams,
        storageLimit: subscription.plan.product.metadata.size_bytes,
        paymentInterval: subscription.plan.nickname,
        isLifetime: false
      }));
    }

    return plans;
  };

  return {
    Name: 'Stripe',
    getStorageProducts,
    getAllStorageProducts,
    getStoragePlans,
    getTeamProducts,
    getTeamPlans,
    findCustomerByEmail,
    getBilling,
    getProductFromUser,
    getUserSubscriptionPlans
  };
};
