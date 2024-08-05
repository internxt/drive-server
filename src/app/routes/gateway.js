const { INDIVIDUAL_FREE_TIER_PLAN_ID } = require('../constants');
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

    return Service.User.FindUserObjByEmail(email)
      .then((dbUser) => {
        if (!dbUser) {
          throw new Error('User not found');
        }

        user = dbUser;

        return Service.Plan.createOrUpdate({ ...plan, userId: dbUser.id });

        // eslint-disable-next-line consistent-return
      })
      .then(() => {
        // TODO: updateBucketLimit is malfunctioning and no longer needed
        if (user.backupsBucket) {
          return Service.Inxt.updateBucketLimit(user.backupsBucket, bucketLimit);
        }
      })
      .then(() => {
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

    Service.User.UpdateUserStorage(email, maxSpaceBytes)
      .then(() => {
        return res.status(200).send({ error: null, message: `Storage updated ${maxSpaceBytes} for user: ${email}` });
      })
      .catch(() => {
        Logger.error(`Error updating user storage ${email}. Storage requested: ${maxSpaceBytes} `);
        return res.status(500).send();
      });
  });

  Router.put('/gateway/user/update/tier', basicAuth, async (req, res) => {
    const { planId } = req.body;
    const uuid = req.body.uuid;

    if (!uuid) {
      return res.status(400).send({ error: 'Users uuid is required' });
    }

    if (!planId) {
      return res.status(400).send({ error: 'You need to asign a tier to the user' });
    }

    await Service.Limit.expireLimit(uuid).catch((err) => {
      Logger.error(`Error expiring limit for user ${uuid}: ${err.message}`);
    });

    let user = await Service.User.FindUserByUuid(uuid);
    if (!user) {
      Logger.error('[GATEWAY/TIER]: Failed to get user', uuid);
      return res.status(500).send();
    }

    let paidPlanTier = await Service.FeatureLimits.getTierByPlanId(
      planId === 'free_individual_tier' ? INDIVIDUAL_FREE_TIER_PLAN_ID : planId,
    );

    if (!paidPlanTier) {
      Logger.error(
        `[GATEWAY/TIER]: Plan id not found, assigning free tier by default. id: ${planId}, email: ${user.email}`,
      );
      paidPlanTier = await Service.FeatureLimits.getIndividualFreeTier();
    }

    await Service.User.updateTier(user, paidPlanTier.tierId);

    return res.status(200).send({ error: null, user: { ...user.dataValues, tierId: paidPlanTier.tierId } });
  });

  Router.post('/gateway/user/updateOrCreate', basicAuth, async (req, res) => {
    const { maxSpaceBytes } = req.body;
    const email = req.body.email.toLowerCase();
    let user = await Service.User.FindUserByEmail(email).catch(() => null);
    if (!user) {
      try {
        user = await Service.User.CreateStaggingUser(email);
      } catch (err) {
        Logger.error(`[GATEWAY]: Create stagging error for user ${email}: ${err.message}`, err);
        return res.status(500).send({ error: err.message });
      }
    }
    Service.User.UpdateUserStorage(email, maxSpaceBytes)
      .then(() => {
        return res.status(200).send({ error: null, user });
      })
      .catch((err) => {
        Logger.error(`[GATEWAY]: Error updating storage to ${maxSpaceBytes} for user ${email}: ${err.message}`);
        return res.status(304).send();
      });
  });

  Router.post('/gateway/register/stage', basicAuth, (req, res) => {
    const { email } = req.body;
    Service.User.CreateStaggingUser(email)
      .then(() => {
        res.status(201).send();
      })
      .catch((err) => {
        Logger.error(`[GATEWAY]: Create stagging error for user ${email}: %s`, err.message);
        res.status(500).send({ error: err.message });
      });
  });

  Router.get('/gateway/users', basicAuth, (req, res) => {
    const email = req.query.email;

    return Service.User.FindUserByEmail(email)
      .then((user) => {
        res.status(200).send(user);
      })
      .catch((err) => {
        Logger.error(`[Gateway]: Failed to get user: ${email}: %s`, err.message);
        res.status(500).send({ error: 'Failed to get user' });
      });
  });

  Router.get('/gateway/checkout/session', basicAuth, async (req, res) => {
    const sessionId = req.query.sessionId;

    const session = await Service.Stripe.findSessionById(sessionId).catch((err) => {
      Logger.error('[Gateway]: Failed to get stripe session %s', err.message);
      res.status(500).send({ error: 'Failed to get stripe session' });
    });

    res.status(200).send(session);
  });

  Router.get('/gateway/files/:fileId', basicAuth, async (req, res) => {
    const fileId = req.params.fileId;

    try {
      const file = await Service.Files.getFileByFileId(fileId);

      res.status(200).send(file);
    } catch (err) {
      if (err.message === 'File not found') {
        return res.status(404).send({ error: err.message });
      }
      Logger.error('[Gateway]: Failed to get file :%s', fileId, err.message);
      res.status(500).send({ error: err.message });
    }
  });
};
