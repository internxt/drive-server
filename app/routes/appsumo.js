const { passportAuth, Sign } = require('../middleware/passport');

module.exports = (Router, Service, App) => {
  Router.post('/appsumo/register', (req, res) => {
    Service.AppSumo.RegisterIncomplete(req.body.email, req.body.plan, req.body.uuid, req.body.invoice).then(() => {
      res.status(200).send();
    }).catch((err) => {
      res.status(500).send({ error: err.message });
    });
  });

  Router.post('/appsumo/update', passportAuth, (req, res) => {
    Service.AppSumo.CompleteInfo(req.user, req.body).then(() => {
      const userData = req.user;

      const token = Sign(userData.email, App.config.get('secrets').JWT, true);

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
        email: userData.email
      };

      res.status(200).send({ token, user });
    }).catch((err) => {
      res.status(500).send({ error: err.message });
    });
  });

  Router.post('/appsumo/license', (req, res) => {
    const parseParams = {
      planId: req.body.plan_id,
      uuid: req.body.uuid,
      invoiceItemUuid: req.body.invoice_item_uuid
    };

    Service.AppSumo.UpdateLicense(req.body.activation_email, parseParams).then(() => {
      res.status(200).send();
    }).catch(() => {
      res.status(400).send();
    });
  });

  Router.get('/appsumo/details', passportAuth, (req, res) => {
    Service.AppSumo.GetDetails(req.user).then((details) => {
      res.status(200).send(details);
    }).catch(() => {
      res.status(400).send({ error: 'No appsumo license found' });
    });
  });
};
