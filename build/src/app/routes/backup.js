"use strict";
var passportAuth = require('../middleware/passport').passportAuth;
module.exports = function (Router, Service) {
    Router.get('/user/backupsBucket', passportAuth, function (req, res) {
        Service.User.FindUserByEmail(req.user.email)
            .then(function (results) {
            var backupsBucket = results.backupsBucket;
            res.status(200).send({ backupsBucket: backupsBucket });
        })
            .catch(function (err) {
            res.status(500).send({ error: err.message });
        });
    });
    Router.get('/backup/device/:mac', passportAuth, function (req, res) {
        var mac = req.params.mac;
        Service.Backup.getDevice(req.user.id, mac)
            .then(function (results) {
            res.status(200).send(results);
        })
            .catch(function (err) {
            if (err.name === 'NOT_FOUND') {
                res.status(404).send({ error: err.message });
            }
            else
                res.status(500).send({ error: err.message });
        });
    });
    Router.get('/backup/device', passportAuth, function (req, res) {
        Service.Backup.getAllDevices(req.user.id)
            .then(function (results) {
            res.status(200).send(results);
        })
            .catch(function (err) {
            res.status(500).send({ error: err.message });
        });
    });
    Router.patch('/backup/device/:deviceId', passportAuth, function (req, res) {
        var deviceId = req.params.deviceId;
        var deviceName = req.body.deviceName;
        if (!deviceName) {
            res.status(400).send({ error: 'Device name cant be empty' });
        }
        Service.Backup.updateDevice(req.user.id, deviceId, deviceName)
            .then(function (results) {
            res.status(200).send(results);
        })
            .catch(function (err) {
            if (err.name === 'NOT_FOUND') {
                res.status(404).send({ error: err.message });
            }
            else
                res.status(500).send({ error: err.message });
        });
    });
    Router.post('/backup/device/:mac', passportAuth, function (req, res) {
        var _a = req.body, deviceName = _a.deviceName, platform = _a.platform;
        var mac = req.params.mac;
        if (!deviceName) {
            return res
                .status(400)
                .send({ message: 'deviceName must be present in the body' });
        }
        return Service.Backup.createDevice(req.user.id, mac, deviceName, platform)
            .then(function (device) { return res.status(200).send(device); })
            .catch(function (err) { return res.status(500).send({ error: err.message }); });
    });
    Router.post('/backup/activate', passportAuth, function (req, res) {
        Service.Backup.activate(req.user)
            .then(function () { return res.status(200).send(); })
            .catch(function (err) { return res.status(500).send({ error: err.message }); });
    });
    Router.post('/backup', passportAuth, function (req, res) {
        var _a = req.body, deviceId = _a.deviceId, path = _a.path, encryptVersion = _a.encryptVersion, interval = _a.interval, enabled = _a.enabled;
        if (!deviceId
            || !path
            || !encryptVersion
            || !interval
            || enabled === undefined) {
            return res.status(400).send({
                message: 'deviceId, path, interval, encryptVersion and enabled must be present in the body'
            });
        }
        return Service.Backup.create({
            userId: req.user.id,
            path: path,
            deviceId: deviceId,
            encryptVersion: encryptVersion,
            interval: interval,
            enabled: enabled
        })
            .then(function (result) { return res.status(200).send(result); })
            .catch(function (err) { return res.status(500).send({ error: err.message }); });
    });
    Router.get('/backup/:mac', passportAuth, function (req, res) {
        var mac = req.params.mac;
        var userId = req.user.id;
        Service.Backup.getAll(userId, mac)
            .then(function (result) { return res.status(200).send(result); })
            .catch(function (err) { return res.status(500).send({ error: err.message }); });
    });
    Router.delete('/backup/:id', passportAuth, function (req, res) {
        var id = req.params.id;
        Service.Backup.deleteOne(req.user, id)
            .then(function () { return res.status(200).send(); })
            .catch(function (err) { return res.status(500).send({ error: err.message }); });
    });
    Router.patch('/backup/:id', passportAuth, function (req, res) {
        var id = req.params.id;
        var userId = req.user.id;
        var expectedProperties = [
            'fileId',
            'hash',
            'interval',
            'lastBackupAt',
            'enabled',
            'path',
            'size'
        ];
        var bodyFiltered = Object.keys(req.body)
            .filter(function (key) { return expectedProperties.includes(key); })
            .reduce(function (obj, key) {
            obj[key] = req.body[key];
            return obj;
        }, {});
        if (Object.keys(bodyFiltered).length === 0) {
            return res.status(400).send({
                message: "At least one of these properties (" + expectedProperties.join(', ') + ") must be present in the body"
            });
        }
        return Service.Backup.updateOne(userId, id, bodyFiltered)
            .then(function (result) { return res.status(200).send(result); })
            .catch(function (err) { return res.status(500).send({ error: err.message }); });
    });
    Router.patch('/backup/fromDevice/:deviceId', passportAuth, function (req, res) {
        var deviceId = req.params.deviceId;
        var userId = req.user.id;
        var interval = req.body.interval;
        if (!interval) {
            return res
                .status(400)
                .send({ message: 'interval must be present in the body' });
        }
        return Service.Backup.updateManyOfDevice(userId, deviceId, {
            interval: interval
        })
            .then(function () { return res.status(200).send(); })
            .catch(function (err) { return res.status(500).send({ error: err.message }); });
    });
};
