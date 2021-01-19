const { passportAuth } = require('../middleware/passport');

module.exports = (Router, Service) => {
  Router.post('/appsumo/register', (req, res) => {
    Service.AppSumo.RegisterIncomplete(req.body.email, req.body.plan, req.body.uuid, req.body.invoice).then(() => {
      res.status(200).send();
    }).catch((err) => {
      console.log(err);
      res.status(500).send({ error: err.message });
    });
  });

  Router.post('/appsumo/update', passportAuth, (req, res) => {
    Service.AppSumo.CompleteInfo(req.user, req.body).then(() => {
      res.status(200).send();
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

    console.log('BODY', req.body)

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
