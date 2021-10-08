const basicAuthBuilder = require('../middleware/basic-auth');
const logger = require('../../lib/logger');

const Logger = logger.getInstance();

module.exports = (Router, Service) => {
  const { GATEWAY_USER, GATEWAY_PASS } = process.env;
  const basicAuth = basicAuthBuilder.build(GATEWAY_USER, GATEWAY_PASS);

  Router.post('/gateway/plan', basicAuth, (req, res) => {
    const { bucket, plan } = req.body;
    const { name, type, limit } = plan;

    // TODO: Retrieve user by stripe?

    if (type !== 'subscription' && type !== 'one_time') {
      return res.status(400).send();
    }

    const tenGb = 10 * 1024 * 1024 * 1024;
    const plan = { name, type, createdAt: new Date(), updatedAt: new Date(), limit };
    const bucketLimit = type === 'one_time' ? tenGb : -1;
    
    Service.Plan.createAndSetBucketLimit(plan, bucket, bucketLimit).then(() => {
      return res.status(200).send();
    }).catch((err) => {
      Logger.error('Error creating a plan for user %s: %s', )
      return res.status(500).send({ error: err.message });
    });
  });
};
