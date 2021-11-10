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

  Router.post('/gateway/user/update/storage', basicAuth, (req, res) => {
    const { email } = req.body;
    const maxSpaceBytes = parseInt(req.body.maxSpaceBytes, 10);

    Service.User.UpdateUserStorage(email, maxSpaceBytes).then(() => {
      return res.status(200).send({ error: null, message: `Storage updated ${maxSpaceBytes} for user: ${email}` });
    })
      .catch(() => {
        Logger.error(`Error updating user storage ${email}. Storage requested: ${maxSpaceBytes} `);
        return res.status(500).send();
      });
  });

  Router.post('/gateway/user/updateOrCreate', basicAuth, async (req, res) => {
    const { email, maxSpaceBytes } = req.body;
    const userExists = await Service.User.FindUserByEmail(email).catch(() => null);
    if (!userExists) {
      await Service.User.CreateStaggingUser(email).catch((err) => {
        Logger.error(`Not possible to create a stagging register for user: ${email}`);
        return res.status(500).send({ error: err.message });
      });
    }
    Service.User.UpdateUserStorage(email, maxSpaceBytes).then(() => {
      return res.status(200).send({ error: null, message: `Storage updated ${maxSpaceBytes} for user: ${email}` });
    }).catch((err) => {
      Logger.error(`Error updating user storage ${email}. Storage requested: ${maxSpaceBytes}. Error: ${err} `);
      return res.status(304).send();
    });
  });

  Router.post('/gateway/register/stage', basicAuth, (req, res) => {
    const { email } = req.body;
    Service.User.CreateStaggingUser(email).then(() => {
      res.status(201).send();
    }).catch((err) => {
      Logger.error(`Not possible to create a stagging register for user: ${email}`);
      res.status(500).send({ error: err.message });
    });
  });
};
