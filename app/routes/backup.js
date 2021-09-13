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

  Router.get('/backup/device/:mac', passportAuth, (req, res) => {
    const { mac } = req.params;
    Service.Backup.getDevice(req.user.id, mac).then((results) => {
      res.status(200).send(results);
    }).catch((err) => {
      if (err.name === 'NOT_FOUND') res.status(404).send({ error: err.message });
      else res.status(500).send({ error: err.message });
    });
  });

  Router.patch('/backup/device/:deviceId', passportAuth, (req, res) => {
    const { deviceId } = req.params;
    const { deviceName } = req.body;
    if (!deviceName) res.status(400).send({ error: 'Device name cant be empty' });
    Service.Backup.updateDevice(req.user.id, deviceId, deviceName).then((results) => {
      res.status(200).send(results);
    }).catch((err) => {
      if (err.name === 'NOT_FOUND') res.status(404).send({ error: err.message });
      else res.status(500).send({ error: err.message });
    });
  });

  Router.post('/backup/device/:mac', passportAuth, (req, res) => {
    const { deviceName } = req.body;
    const { mac } = req.params;

    if (!deviceName) return res.status(400).send({ message: 'deviceName must be present in the body' });

    Service.Backup.createDevice(req.user.id, mac, deviceName)
      .then((device) => res.status(200).send(device))
      .catch((err) => res.status(500).send({ error: err.message }));
  });

  Router.post('/backup/activate', passportAuth, (req, res) => {
    Service.Backup.activate(req.user)
      .then(() => res.status(200).send())
      .catch((err) => res.status(500).send({ error: err.message }));
  });

  Router.post('/backup', passportAuth, (req, res) => {
    const {
      deviceId, path, encryptVersion, interval, enabled
    } = req.body;

    if (!deviceId || !path || !encryptVersion || !interval || enabled === undefined) { return res.status(400).send({ message: 'deviceId, path, interval, encryptVersion and enabled must be present in the body' }); }

    Service.Backup.create({
      userId: req.user.id, path, deviceId, encryptVersion, interval, enabled
    })
      .then((result) => res.status(200).send(result))
      .catch((err) => res.status(500).send({ error: err.message }));
  });

  Router.get('/backup/:mac', passportAuth, (req, res) => {
    const { mac } = req.params;

    const { id: userId } = req.user;

    Service.Backup.getAll(userId, mac)
      .then((result) => res.status(200).send(result))
      .catch((err) => res.status(500).send({ error: err.message }));
  });

  Router.delete('/backup/:id', passportAuth, (req, res) => {
    const { id } = req.params;

    const { id: userId } = req.user;

    Service.Backup.deleteOne(userId, id)
      .then(() => res.status(200).send())
      .catch((err) => res.status(500).send({ error: err.message }));
  });

  Router.patch('/backup/:id', passportAuth, (req, res) => {
    const { id } = req.params;

    const { id: userId } = req.user;

    const {
      fileId, hash, interval, lastBackupAt, enabled
    } = req.body;

    if (!fileId && !hash && !interval && !lastBackupAt && enabled === undefined) return res.status(400).send({ message: 'fileId, hash, interval, enabled or lastBackupAt must be present in the body' });

    Service.Backup.updateOne(userId, id, {
      fileId, hash, interval, lastBackupAt, enabled
    })
      .then((result) => res.status(200).send(result))
      .catch((err) => res.status(500).send({ error: err.message }));
  });

  Router.patch('/backup/fromDevice/:deviceId', passportAuth, (req, res) => {
    const { deviceId } = req.params;

    const { id: userId } = req.user;

    const {
      interval
    } = req.body;

    if (!interval) return res.status(400).send({ message: 'interval must be present in the body' });

    Service.Backup.updateManyOfDevice(userId, deviceId, {
      interval
    })
      .then(() => res.status(200).send())
      .catch((err) => res.status(500).send({ error: err.message }));
  });
};
