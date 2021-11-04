const basicAuthBuilder = require('../middleware/basic-auth');
const logger = require('../../lib/logger').default;

const Logger = logger.getInstance();

module.exports = (Router, Service) => {
  const { GATEWAY_USER, GATEWAY_PASS } = process.env;
  const basicAuth = basicAuthBuilder.build(GATEWAY_USER, GATEWAY_PASS);

  Router.post('/gateway/plan', basicAuth, (req, res) => {
    const { email, plan } = req.body;

    if (!Service.Plan.isValid(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    const tenGb = 10 * 1024 * 1024 * 1024;
    const bucketLimit = plan.type === 'one_time' ? tenGb : -1;

    let user;

    return Service.User.FindUserObjByEmail(email).then((dbUser) => {
      if (!dbUser) {
        throw new Error('User not found');
      }

      user = dbUser;

      return Service.Plan.createOrUpdate({ ...plan, userId: dbUser.id });

    // eslint-disable-next-line consistent-return
    }).then(() => {
      if (user.backupsBucket) {
        return Service.Inxt.updateBucketLimit(user.backupsBucket, bucketLimit);
      }
    }).then(() => {
      return res.status(200).send();
    })
      .catch((err) => {
        Logger.error('Error creating %s plan "%s" for user %s: %s', plan.type, plan.name, email, err.message);

        return res.status(500).json({ error: err.message });
      });
  });
};