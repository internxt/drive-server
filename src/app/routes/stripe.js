const async = require('async');
const Stripe = require('stripe');

const StripeProduction = Stripe(process.env.STRIPE_SK, { apiVersion: '2020-08-27' });
const StripeTest = Stripe(process.env.STRIPE_SK_TEST, { apiVersion: '2020-08-27' });

const passport = require('../middleware/passport');

const { passportAuth } = passport;

module.exports = (Router, Service) => {

  Router.get('/stripe/session', passportAuth, (req, res) => {
    const sessionId = req.query.sessionId;

    Service.Stripe.findSessionById(sessionId)
      .then((data) => {
        res.status(200).json(data);
      })
      .catch(() => {
        res.status(400).json({ message: 'Error retrieving session data' });
      });
  });

  /**
   * Should create a new Stripe Session token.
   * Stripe Session is neccesary to perform a new payment
   */
  Router.post('/stripe/session', passportAuth, (req, res) => {
    const stripe = req.body.test ? StripeTest : StripeProduction;

    const user = req.user.email;

    async.waterfall(
      [
        (next) => {
          // Retrieve the customer by email, to check if already exists
          stripe.customers.list(
            {
              limit: 1,
              email: user,
            },
            (err, customers) => {
              next(err, customers.data[0]);
            },
          );
        },
        (customer, next) => {
          if (!customer) {
            // The customer does not exists
            // Procede to the subscription
            return next(null, undefined);
          }
          // Get subscriptions
          return stripe.subscriptions.list(
            {
              customer: customer.id,
            },
            (err, response) => {
              if (err) {
                return next();
              }
              const subscriptions = response.data;
              if (subscriptions.length === 0) {
                return next(null, { customer, subscription: null });
              }
              const subscription = subscriptions[0];
              return next(null, { customer, subscription });
            },
          );
        },
        (payload, next) => {
          if (!payload) {
            next(null, {});
          } else {
            const { customer } = payload;

            next(null, customer);
          }
        },
        (customer, next) => {
          // Open session
          const customerId = customer !== null ? customer.id || null : null;

          const sessionParams = {
            payment_method_types: ['card'],
            success_url: req.body.successUrl || `${process.env.HOST_DRIVE_WEB}/checkout/success`,
            cancel_url: req.body.canceledUrl || `${process.env.HOST_DRIVE_WEB}/account?tab=plans`,
            subscription_data: {
              items: [{ plan: req.body.plan }],
            },
            customer_email: user,
            customer: customerId,
            allow_promotion_codes: true,
            billing_address_collection: 'required',
          };

          if (sessionParams.customer) {
            delete sessionParams.customer_email;
          } else {
            delete sessionParams.customer;
          }

          stripe.checkout.sessions
            .create(sessionParams)
            .then((result) => {
              next(null, result);
            })
            .catch((err) => {
              next(err);
            });
        },
      ],
      (err, result) => {
        if (err) {
          res.status(500).send({ error: err.message });
        } else {
          res.status(200).send(result);
        }
      },
    );
  });

  /**
   * Should create a new Stripe Session token.
   * Stripe Session is neccesary to perform a new payment
   */
  Router.post('/v2/stripe/session', passportAuth, (req, res) => {
    const stripe = req.body.test ? StripeTest : StripeProduction;
    const user = req.user.email;

    async.waterfall(
      [
        (next) => {
          // Retrieve the customer by email, to check if already exists
          stripe.customers.list(
            {
              limit: 1,
              email: user,
            },
            (err, customers) => {
              next(err, customers.data[0]);
            },
          );
        },
        (customer, next) => {
          if (!customer) {
            // The customer does not exists
            // Procede to the subscription
            return next(null, undefined);
          }
          // Get subscriptions
          return stripe.subscriptions.list(
            {
              customer: customer.id,
            },
            (err, response) => {
              if (err) {
                return next();
              }
              const subscriptions = response.data;
              if (subscriptions.length === 0) {
                return next(null, { customer, subscription: null });
              }
              const subscription = subscriptions[0];
              return next(null, { customer, subscription });
            },
          );
        },
        (payload, next) => {
          if (!payload) {
            next(null, {});
          } else {
            const { customer } = payload;

            next(null, customer);
          }
        },
        (customer, next) => {
          // Open session
          const customerId = customer !== null ? customer.id || null : null;

          let sessionParams;

          if (req.body.mode === 'subscription') {
            sessionParams = {
              payment_method_types: ['card'],
              success_url: req.body.successUrl || `${process.env.HOST_DRIVE_WEB}/checkout/success`,
              cancel_url: req.body.canceledUrl || `${process.env.HOST_DRIVE_WEB}/account?tab=plans`,
              subscription_data: {
                items: [{ plan: req.body.priceId }],
              },
              customer_email: user,
              customer: customerId,
              allow_promotion_codes: true,
              billing_address_collection: 'required',
            };
          } else if (req.body.mode === 'payment') {
            sessionParams = {
              payment_method_types: ['card'],
              success_url: req.body.successUrl || `${process.env.HOST_DRIVE_WEB}/checkout/success`,
              cancel_url: req.body.canceledUrl || `${process.env.HOST_DRIVE_WEB}/account?tab=plans`,
              mode: req.body.mode,
              line_items: [
                {
                  price: req.body.priceId,
                  quantity: 1,
                },
              ],
              customer_email: user,
              customer: customerId,
              allow_promotion_codes: true,
              billing_address_collection: 'required',
              metadata: {
                member_tier: 'lifetime',
              },
              payment_intent_data: {},
            };
          }

          if (sessionParams.customer) {
            delete sessionParams.customer_email;
          } else {
            delete sessionParams.customer;
          }

          stripe.checkout.sessions
            .create(sessionParams)
            .then((result) => {
              next(null, result);
            })
            .catch((err) => {
              next(err);
            });
        },
      ],
      (err, result) => {
        if (err) {
          res.status(500).send({ error: err.message });
        } else {
          res.status(200).send(result);
        }
      },
    );
  });

  Router.get('/v3/stripe/products', (req, res) => {
    Service.Stripe.getAllStorageProducts2()
      .then((products) => {
        res.status(200).send(products);
      })
      .catch((err) => {
        res.status(500).send({ error: err.message });
      });
  });
};
