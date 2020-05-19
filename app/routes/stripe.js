const async = require('async')
const passport = require('../middleware/passport')
const passportAuth = passport.passportAuth

module.exports = (Router, Service, Logger, App) => {

  Router.get('/plans', passportAuth, function (req, res) {
    Service.Plan.ListAll().then((data) => {
      res.status(200).json(data);
    }).catch((e) => {
      res.status(400).json({ message: 'Error retrieving list of plans' });
    });
  });

  /**
   * Should create a new Stripe Session token.
   * Stripe Session is neccesary to perform a new payment
   */
  Router.post('/stripe/session', passportAuth, (req, res) => {
    const planToSubscribe = req.body.plan;

    let stripe = require('stripe')(process.env.STRIPE_SK, {apiVersion: '2020-03-02'});

    if (req.body.test) {
      stripe = require('stripe')(process.env.STRIPE_SK_TEST, {apiVersion: '2020-03-02'});
    }

    const user = req.user.email

    async.waterfall([
      (next) => {
        // Retrieve the customer by email, to check if already exists
        stripe.customers.list({
          limit: 1, email: user
        }, (err, customers) => {
          next(err, customers.data[0]);
        });
      },
      (customer, next) => {
        if (!customer) {
          // The customer does not exists
          // Procede to the subscription
          console.debug('Customer does not exists, won\'t check any subcription');
          next(null, undefined);
        } else {
          // Get subscriptions
          const subscriptions = customer.subscriptions.data;
          if (subscriptions.length === 0) {
            console.log('Customer exists, but doesn\'t have a subscription');
            next(null, { customer, subscription: null });
          } else {
            console.log('Customer already has a subscription');
            const subscription = subscriptions[0];
            next(null, { customer, subscription });
          }
        }
      },
      (payload, next) => {
        if (!payload) {
          console.debug('Customer does not exists');
          next(null, {});
        } else {
          const { customer, subscription } = payload;
          console.debug('Payload', subscription);

          if (subscription) {
            // Delete subscription (must be improved in the future)
            /*
            stripe.subscriptions.del(subscription.id, (err, result) => {
              next(err, customer);
            });
            */
            next(Error('Already subscribed'));
          } else {
            next(null, customer);
          }
        }
      },
      (customer, next) => {
        // Open session
        const customerId = customer !== null ? customer.id || null : null;

        const sessionParams = {
          payment_method_types: ['card'],
          success_url: 'https://drive.internxt.com/',
          cancel_url: 'https://drive.internxt.com/',
          subscription_data: {
            items: [{ plan: req.body.plan }],
            trial_period_days: 30
          },
          customer_email: user,
          customer: customerId,
          billing_address_collection: 'required'
        };

        if (sessionParams.customer) {
          delete sessionParams.customer_email;
        } else {
          delete sessionParams.customer;
        }

        stripe.checkout.sessions.create(sessionParams).then((result) => {
          next(null, result);
        }).catch((err) => { next(err); });
      }
    ], (err, result) => {
      if (err) {
        console.log('Error', err.message);
        res.status(500).send({ error: err.message });
      } else {
        console.log('Correcto', result);
        res.status(200).send(result);
      }
    })
  });

  /**
   * Retrieve products listed in STRIPE.
   * Products must be inserted on stripe using the dashboard with the required metadata.
   * Required metadata:
   */
  Router.get('/stripe/products', passportAuth, (req, res) => {
    const stripe = require('stripe')(req.query.test ? process.env.STRIPE_SK_TEST : process.env.STRIPE_SK, {apiVersion: '2020-03-02'});
    stripe.products.list({}, (err, products) => {
      if (err) {
        res.status(500).send({ error: err });
      } else {
        const productsMin = products.data.filter(p => !(!p.metadata.size_bytes)).map((p) => {
          return { id: p.id, name: p.name, metadata: p.metadata };
        }).sort((a, b) => a.metadata.price_eur * 1 - b.metadata.price_eur * 1);
        res.status(200).send(productsMin);
      }
    });
  });

  /**
   * Get available plans from a given product.
   * TODO: cache plans to avoid repetitive api calls
   */
  Router.post('/stripe/plans', passportAuth, (req, res) => {
    const stripe = require('stripe')(req.body.test ? process.env.STRIPE_SK_TEST : process.env.STRIPE_SK, {apiVersion: '2020-03-02'});
    const stripeProduct = req.body.product;

    stripe.plans.list({
      product: stripeProduct
    }, (err, plans) => {
      if (err) {
        res.status(500).send({ error: err.message });
      } else {
        const plansMin = plans.data.map((p) => {
          return {
            id: p.id,
            price: p.amount,
            name: p.nickname,
            interval: p.interval,
            interval_count: p.interval_count
          }
        }).sort((a, b) => a.price * 1 - b.price * 1);
        res.status(200).send(plansMin);
      }
    });
  });
}