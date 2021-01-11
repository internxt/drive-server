const StripeTest = require('stripe')(process.env.STRIPE_SK_TEST, { apiVersion: '2020-03-02' });
const StripeProduction = require('stripe')(process.env.STRIPE_SK, { apiVersion: '2020-03-02' });

module.exports = () => {
  const getStorageProducts = (test = false) => new Promise((resolve, reject) => {
    const stripe = test ? StripeTest : StripeProduction;

    stripe.products.list({}, (err, products) => {
      if (err) {
        reject(err);
      } else {
        const productsMin = products.data
          .filter((p) => !!p.metadata.size_bytes)
          .map((p) => ({ id: p.id, name: p.name, metadata: p.metadata }))
          .sort((a, b) => a.metadata.price_eur * 1 - b.metadata.price_eur * 1);
        resolve(productsMin);
      }
    });
  });

  const getTeamProducts = (test = false) => new Promise((resolve, reject) => {
    const stripe = test ? StripeTest : StripeProduction;

    stripe.products.list({}, (err, products) => {
      if (err) {
        reject(err);
      } else {
        const productsMin = products.data
          .filter((p) => !!p.metadata.team_members)
          .map((p) => ({ id: p.id, name: p.name, metadata: p.metadata }))
          .sort((a, b) => a.metadata.price_eur * 1 - b.metadata.price_eur * 1);
        resolve(productsMin);
      }
    });
  });

  const getStoragePlans = (stripeProduct, test = false) => new Promise((resolve, reject) => {
    const stripe = test ? StripeTest : StripeProduction;

    stripe.plans.list({ product: stripeProduct },
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

  const getTeamPlans = (stripeProduct, test = false) => new Promise((resolve, reject) => {
    const stripe = test ? StripeTest : StripeProduction;

    stripe.plans.list({ product: stripeProduct }, (err, plans) => {
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

  return {
    Name: 'Stripe',
    getStorageProducts,
    getStoragePlans,
    getTeamProducts,
    getTeamPlans
  };
};
