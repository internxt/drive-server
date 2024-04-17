const { passportAuth } = require('../middleware/passport');
const { getInstance } = require('../../lib/logger').default;

const logger = getInstance();

module.exports = (Router, Service) => {
  Router.get('/user/backupsBucket', passportAuth, (req, res) => {
    Service.User.FindUserByEmail(req.user.email)
      .then((results) => {
        const { backupsBucket } = results;

        res.status(200).send({ backupsBucket });
      })
      .catch((err) => {
        res.status(500).send({ error: err.message });

        logger.error('[USER/BACKUPSBUCKET]: ERROR for user %s: %s', req.user.email, err.message);
      });
  });

  Router.get('/backup/device/:mac', passportAuth, (req, res) => {
    const { mac } = req.params;
    Service.Backup.getDevice(req.user.id, mac)
      .then((results) => {
        res.status(200).send(results);
      })
      .catch((err) => {
        if (err.name === 'NOT_FOUND') {
          return res.status(404).send({ error: err.message });
        }
        res.status(500).send({ error: err.message });

        logger.error('[BACKUP/DEVICE/:MAC]: ERROR for user %s: %s', req.user.email, err.message);
      });
  });

  Router.get('/backup/device', passportAuth, (req, res) => {
    Service.Backup.getAllDevices(req.user.id)
      .then((results) => {
        res.status(200).send(results);
      })
      .catch((err) => {
        res.status(500).send({ error: err.message });

        logger.error('[BACKUP/DEVICE]: ERROR for user %s: %s', req.user.email, err.message);
      });
  });

  Router.patch('/backup/device/:deviceId', passportAuth, (req, res) => {
    const { deviceId } = req.params;
    const { deviceName } = req.body;
    if (!deviceName) {
      res.status(400).send({ error: 'Device name cant be empty' });
    }
    Service.Backup.updateDevice(req.user.id, deviceId, deviceName)
      .then((results) => {
        res.status(200).send(results);
      })
      .catch((err) => {
        if (err.name === 'NOT_FOUND') {
          res.status(404).send({ error: err.message });
        } else res.status(500).send({ error: err.message });
      });
  });

  Router.delete('/backup/device/:deviceId', passportAuth, (req, res) => {
    const { deviceId } = req.params;

    Service.Backup.deleteDevice(req.user, deviceId)
      .then(() => {
        res.status(200).send();
      })
      .catch((err) => {
        if (err.name === 'NOT_FOUND') {
          res.status(404).send({ error: err.message });
        } else res.status(500).send({ error: err.message });
      });
  });

  Router.post('/backup/device/:mac', passportAuth, (req, res) => {
    const { deviceName, platform } = req.body;
    const { mac } = req.params;

    if (!deviceName) {
      return res.status(400).send({ message: 'deviceName must be present in the body' });
    }

    return Service.Backup.createDevice(req.user.id, mac, deviceName, platform)
      .then((device) => res.status(200).send(device))
      .catch((err) => res.status(500).send({ error: err.message }));
  });

  Router.post('/backup/activate', passportAuth, (req, res) => {
    Service.Backup.activate(req.user)
      .then(() => res.status(200).send())
      .catch((err) => res.status(500).send({ error: err.message }));
  });

  Router.post('/backup/deviceAsFolder', passportAuth, async (req, res) => {
    const { deviceName } = req.body;
    const folder = await Service.Backup.createDeviceAsFolder(req.user, deviceName);
    return res.status(200).send(folder);
  });
  Router.get('/backup/deviceAsFolder/:id', passportAuth, async (req, res) => {
    const folder = await Service.Backup.getDeviceAsFolder(req.user, req.params.id);
    return res.status(200).send(folder);
  });

  Router.patch('/backup/deviceAsFolder/:id', passportAuth, async (req, res) => {
    const expectedProperties = ['deviceName'];
    logger.info('[BACKUP/DEVICEASFOLDER/:ID]: Received body payload %s', JSON.stringify(req.body));
    const bodyFiltered = Object.keys(req.body)
      .filter((key) => expectedProperties.includes(key))
      .reduce((obj, key) => {
        if (key === 'deviceName') {
          obj.name = req.body[key];
        } else {
          obj[key] = req.body[key];
        }
        return obj;
      }, {});

    if (Object.keys(bodyFiltered).length === 0) {
      return res.status(400).send({
        message: `At least one of these properties (${expectedProperties.join(', ')}) must be present in the body`,
      });
    }

    const folder = await Service.Backup.updateDeviceAsFolder(req.user, req.params.id, bodyFiltered);
    return res.status(200).send(folder);
  });

  Router.get('/backup/deviceAsFolder', passportAuth, async (req, res) => {
    const folders = await Service.Backup.getDevicesAsFolder(req.user);
    return res.status(200).send(folders);
  });

  Router.post('/backup', passportAuth, (req, res) => {
    const { deviceId, path, encryptVersion, interval, enabled } = req.body;

    if (!deviceId || !path || !encryptVersion || !interval || enabled === undefined) {
      return res.status(400).send({
        message: 'deviceId, path, interval, encryptVersion and enabled must be present in the body',
      });
    }

    return Service.Backup.create({
      userId: req.user.id,
      path,
      deviceId,
      encryptVersion,
      interval,
      enabled,
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

    Service.Backup.deleteOne(req.user, id)
      .then(() => res.status(200).send())
      .catch((err) => res.status(500).send({ error: err.message }));
  });

  Router.patch('/backup/:id', passportAuth, (req, res) => {
    const { id } = req.params;

    const { id: userId } = req.user;

    const expectedProperties = ['fileId', 'hash', 'interval', 'lastBackupAt', 'enabled', 'path', 'size'];

    const bodyFiltered = Object.keys(req.body)
      .filter((key) => expectedProperties.includes(key))
      .reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});

    if (Object.keys(bodyFiltered).length === 0) {
      return res.status(400).send({
        message: `At least one of these properties (${expectedProperties.join(', ')}) must be present in the body`,
      });
    }

    return Service.Backup.updateOne(userId, id, bodyFiltered)
      .then((result) => res.status(200).send(result))
      .catch((err) => res.status(500).send({ error: err.message }));
  });

  Router.patch('/backup/fromDevice/:deviceId', passportAuth, (req, res) => {
    const { deviceId } = req.params;

    const { id: userId } = req.user;

    const { interval } = req.body;

    if (!interval) {
      return res.status(400).send({ message: 'interval must be present in the body' });
    }

    return Service.Backup.updateManyOfDevice(userId, deviceId, {
      interval,
    })
      .then(() => res.status(200).send())
      .catch((err) => res.status(500).send({ error: err.message }));
  });
};
