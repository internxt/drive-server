const async = require('async');
const { default: Stripe } = require('stripe');
const crypto = require('crypto');

const passport = require('../middleware/passport');

const { passportAuth } = passport;

module.exports = (Router, Service, Logger, App) => {
  Router.get('/plans', passportAuth, (req, res) => {
    Service.Plan.ListAll()
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((e) => {
        res.status(400).json({ message: 'Error retrieving list of plans' });
      });
  });

  /**
   * Should create a new Stripe Session token.
   * Stripe Session is neccesary to perform a new payment
   */
  Router.post('/stripe/session', passportAuth, (req, res) => {
    const productToSubscribe = req.body.product;
    const sessionType = req.body.sessionType || null;
    const test = req.body.test || false;
    const mnemonicTeam = req.body.mnemonicTeam;

    console.log('Mnemonic', mnemonicTeam)

    let stripe = require('stripe')(process.env.STRIPE_SK, {
      apiVersion: '2020-03-02'
    });

    if (test) {
      stripe = require('stripe')(process.env.STRIPE_SK_TEST, {
        apiVersion: '2020-03-02'
      });
    }

    const user = req.user.email;

    async.waterfall(
      [
        (next) => {
          // Retrieve the customer by email, to check if already exists
          stripe.customers.list(
            {
              limit: 1,
              email: user
            },
            (err, customers) => {
              next(err, customers.data[0]);
            }
          );
        },
        (customer, next) => {
          if (!customer) {
            // The customer does not exists
            // Procede to the subscription
            console.debug(
              "Customer does not exists, won't check any subcription"
            );
            next(null, undefined);
          } else {
            // Get subscriptions
            const subscriptions = customer.subscriptions.data;
            if (subscriptions.length === 0) {
              console.log("Customer exists, but doesn't have a subscription");
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

            if (subscription) {
              // Delete subscription (must be improved in the future)
              /*
            stripe.subscriptions.del(subscription.id, (err, result) => {
              next(err, customer);
            });
            */

              Service.Stripe.getStorageProducts(test)
                .then((storageProducts) => {
                  Service.Stripe.getTeamProducts(test)
                    .then((teamProducts) => {
                      if (storageProducts.find((storageProduct) => storageProduct.id === subscription.plan.product)) {
                        if (storageProducts.find((storageProduct) => storageProduct.id === productToSubscribe)) {
                          next(Error('Already subscribed in a storage plan'));
                        } else {
                          next(null, customer);
                        }
                      } else if (
                        teamProducts.find((teamProduct) => teamProduct.id === subscription.plan.product)
                      ) {
                        if (
                          teamProducts.find(
                            (teamProduct) => teamProduct.id === productToSubscribe
                          )
                        ) {
                          next(Error('Already subscribed in a team plan'));
                        } else {
                          next(null, customer);
                        }
                      } else {
                        next(Error('Already subscribed'));
                      }
                    })
                    .catch((err) => {
                      next(Error('Already subscribed'));
                    });
                })
                .catch((err) => {
                  next(Error('Already subscribed'));
                });
            } else {
              next(null, customer);
            }
          }
        },
        (customer, next) => {
          // Open session
          const customerId = customer !== null ? customer.id || null : null;

          const newBridgeUser = Service.Team.generateBridgeTeamUser();
          const successUrl = process.env.HOST_DRIVE_WEB;
          const cancelUrl = successUrl;

          const sessionParams = {
            payment_method_types: ['card'],
            success_url: successUrl,
            cancel_url: cancelUrl,
            subscription_data: {
              items: [{ plan: req.body.plan }],
              trial_period_days: 30
            },
            metadata: {},
            customer_email: user,
            customer: customerId,
            billing_address_collection: 'required'
          };

          if (sessionType && sessionType === 'team') {
            // sessionParams.successUrl = `${successUrl}/team/settings`; // Redirect to settings team page
            sessionParams.metadata.team_email = newBridgeUser.email;

            const salt = crypto.randomBytes(128 / 8).toString('hex');
            console.log('SALT', salt)
            const newPassword = App.services.Crypt.encryptText('team', salt);

            const encryptedPassword = App.services.Crypt.encryptText(newPassword);
            const encryptedSalt = App.services.Crypt.encryptText(salt);

            Service.User.FindOrCreate(
              {
                name: newBridgeUser.email,
                email: newBridgeUser.email,
                mnemonic: newBridgeUser.password,
                lastname: '',
                password: encryptedPassword,
                salt: encryptedSalt,
                referral: ''
              }
            ).then((userData) => {
              if (!userData.isCreated) {
                next({ message: 'This account already exists' });
              } else {

                Service.Team.create({
                  name: 'My team',
                  admin: user,
                  bridge_user: userData.email,
                  bridge_password: userData.password,
                  bridge_mnemonic: mnemonicTeam
                }).then((team) => {
                  const teamId = team.id;
                  const teamAdmin = team.admin;
                  Service.TeamsMembers.addTeamMember(teamId, teamAdmin).then((newMember) => {
                  }).catch((err) => { });
                }).catch((err) => {
                  console.log(err);
                });
              }
            })
              .catch((err) => {
                next(err);
              });
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
        }
      ],
      (err, result) => {
        if (err) {
          console.log('Error', err.message);
          res.status(500).send({ error: err.message });
        } else {
          console.log('Correcto', result);
          res.status(200).send(result);
        }
      }
    );
  });

  /**
   * Retrieve products listed in STRIPE.
   * Products must be inserted on stripe using the dashboard with the required metadata.
   * Required metadata:
   */
  Router.get('/stripe/products', passportAuth, (req, res) => {
    const test = req.query.test || false;

    Service.Stripe.getStorageProducts(test)
      .then((products) => {
        res.status(200).send(products);
      })
      .catch((err) => {
        res.status(500).send({ error: err });
      });
  });

  Router.get('/stripe/teams/products', passportAuth, (req, res) => {
    const test = req.query.test || false;

    Service.Stripe.getTeamProducts(test)
      .then((products) => {
        res.status(200).send(products);
      })
      .catch((err) => {
        res.status(500).send({ error: err });
      });
  });

  /**
   * Get available plans from a given product.
   * TODO: cache plans to avoid repetitive api calls
   */
  Router.post('/stripe/plans', passportAuth, (req, res) => {
    const stripeProduct = req.body.product;
    const test = req.body.test || false;

    Service.Stripe.getStoragePlans(stripeProduct, test)
      .then((plans) => {
        res.status(200).send(plans);
      })
      .catch((err) => {
        res.status(500).send({ error: err });
      });
  });

  Router.post('/stripe/teams/plans', passportAuth, (req, res) => {
    const stripeProduct = req.body.product;
    const test = req.body.test || false;

    Service.Stripe.getTeamPlans(stripeProduct, test)
      .then((plans) => {
        res.status(200).send(plans);
      })
      .catch((err) => {
        res.status(500).send({ error: err.message });
      });
  });
};
