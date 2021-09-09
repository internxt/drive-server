const { passportAuth } = require('../middleware/passport');

module.exports = (Router, Service) => {
  Router.get('/user/backupsBucket', passportAuth, (req, res) => {
    Service.User.FindUserByEmail(req.user.email).then((results) => {
      const { backupsBucket } = results;
      res.status(200).send({ backupsBucket });
    }).catch((err) => {
      res.status(500).send({ error: err.message });
    });
  });

  Router.post('/backup/activate', passportAuth, (req, res) => {
    const { deviceId, deviceName } = req.body;

    if (!deviceId || !deviceName) return res.status(400).send({ message: 'deviceId and deviceName must be present in the body' });

    Service.Backup.activate(req.user, deviceId, deviceName)
      .then(() => res.status(200).send())
      .catch((err) => res.status(500).send({ error: err.message }));
  });

  Router.post('/backup', passportAuth, (req, res) => {
    const {
      deviceId, path, encryptVersion, interval
    } = req.body;

    if (!deviceId || !path || !encryptVersion || !interval) { return res.status(400).send({ message: 'deviceId, path, interval and encryptVersion must be present in the body' }); }

    Service.Backup.create(req.user.id, path, deviceId, encryptVersion, interval)
      .then((result) => res.status(200).send(result))
      .catch((err) => res.status(500).send({ error: err.message }));
  });

  Router.get('/backup/:deviceId', passportAuth, (req, res) => {
    const { deviceId } = req.params;

    const { id: userId } = req.user;

    Service.Backup.getAll(userId, deviceId)
      .then((result) => res.status(200).send(result))
      .catch((err) => res.status(500).send({ error: err.message }));
  });

  Router.delete('/backup/:deviceId/:id', passportAuth, (req, res) => {
    const { deviceId, id } = req.params;

    const { id: userId } = req.user;

    Service.Backup.deleteOne(userId, deviceId, id)
      .then(() => res.status(200).send())
      .catch((err) => res.status(500).send({ error: err.message }));
  });

  Router.patch('/backup/:deviceId/:id', passportAuth, (req, res) => {
    const { deviceId, id } = req.params;

    const { id: userId } = req.user;

    const { fileId, hash, interval } = req.body;

    if (!fileId && !hash && !interval) return res.status(400).send({ message: 'fileId, hash or interval must be present in the body' });

    Service.Backup.updateOne(userId, deviceId, id, { fileId, hash, interval })
      .then((result) => res.status(200).send(result))
      .catch((err) => res.status(500).send({ error: err.message }));
  });
};
