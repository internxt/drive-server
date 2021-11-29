const { passportAuth, Sign } = require('../middleware/passport');
const { getInstance } = require('../../lib/logger').default;

const logger = getInstance();

module.exports = (Router, Service, App) => {
  Router.post('/appsumo/register', (req, res) => {
    Service.AppSumo.RegisterIncomplete(req.body.email, req.body.plan, req.body.uuid, req.body.invoice)
      .then(() => {
        res.status(200).send();

        logger.info('[APPSUMO/REGISTER]: Register incomplete for user %s', req.body.email);
      })
      .catch((err) => {
        res.status(500).send({ error: err.message });

        logger.error('[APPSUMO/REGISTER]: ERROR for user %s: %s', req.body.email, err.message);
      });
  });

  Router.post('/appsumo/update', passportAuth, (req, res) => {
    Service.AppSumo.CompleteInfo(req.user, req.body)
      .then(async () => {
        const userData = req.user;
        const token = Sign(userData.email, App.config.get('secrets').JWT, true);
        let appSumoDetails = null;

        appSumoDetails = await Service.AppSumo.GetDetails(userData.id).catch(() => null);

        const user = {
          userId: userData.userId,
          mnemonic: userData.mnemonic.toString(),
          root_folder_id: userData.root_folder_id,
          name: userData.name,
          lastname: userData.lastname,
          uuid: userData.uuid,
          credit: userData.credit,
          createdAt: userData.createdAt,
          registerCompleted: userData.registerCompleted,
          email: userData.email,
          bridgeUser: userData.email,
          username: userData.email,
          appSumoDetails: appSumoDetails || null,
          sharedWorkspace: true,
        };

        res.status(200).send({ token, user });

        logger.info('[APPSUMO/UPDATE]: User %s updated', user.email);
      })
      .catch((err) => {
        res.status(500).send({ error: err.message });

        logger.error('[APPSUMO/UPDATE]: ERROR for user %s: %s', req.user.email, err.message);
      });
  });

  Router.post('/appsumo/license', (req, res) => {
    const parseParams = {
      planId: req.body.plan_id,
      uuid: req.body.uuid,
      invoiceItemUuid: req.body.invoice_item_uuid,
    };

    Service.AppSumo.UpdateLicense(req.body.activation_email, parseParams)
      .then(() => {
        res.status(200).send();

        logger.info(
          '[APPSUMO/LICENSE]: License updated to plan %s for user %s',
          parseParams.planId,
          req.body.activation_email,
        );
      })
      .catch((err) => {
        res.status(500).send();

        logger.error('[APPSUMO/LICENSE]: ERROR for user %s: %s', req.body.activation_email, err.message);
      });
  });

  Router.get('/appsumo/details', passportAuth, (req, res) => {
    Service.AppSumo.GetDetails(req.user.id)
      .then((details) => {
        res.status(200).send(details);
      })
      .catch((err) => {
        res.status(500).send({ error: 'No appsumo license found' });

        logger.error('[APPSUMO/DETAILS]: ERROR for user %s: %s', req.user.email, err.message);
      });
  });
};
