"use strict";
var path = require('path');
var async = require('async');
var passportAuth = require('../middleware/passport').passportAuth;
var logger = require('../../lib/logger').default;
var Logger = logger.getInstance();
module.exports = function (Router, Service) {
    Router.get('/storage/tree', passportAuth, function (req, res) {
        res.status(500).send({ error: 'Outdated desktop version' });
    });
    Router.get('/desktop/tree', passportAuth, function (req, res) {
        res.status(500).send({ error: 'Outdated desktop version' });
    });
    Router.get('/desktop/list/:index', passportAuth, function (req, res) {
        var user = req.user;
        var index = parseInt(req.params.index, 10);
        if (Number.isNaN(index)) {
            return res.status(400).send({ error: 'Bad Index' });
        }
        return Service.Folder.GetFoldersPagination(user, index).then(function (result) {
            res.status(200).send(result);
        }).catch(function (err) {
            res.status(500).send({ error: err.message });
        });
    });
    Router.put('/user/sync', passportAuth, function (req, res) {
        var user = req.user, body = req.body;
        Service.User.UpdateUserSync(user, body.toNull).then(function (result) {
            res.status(200).json({ data: result });
        }).catch(function (err) {
            res.status(500).json({ error: err.message });
        });
    });
    var ENSURE = {
        OFF: 0,
        RANDOM: 1,
        ALL: 2
    };
    Router.get('/user/sync', passportAuth, function (req, res) {
        var user = req.user;
        res.setHeader('Content-Type', 'application/json');
        Service.User.GetOrSetUserSync(user).then(function (result) {
            res.status(200).json({
                data: result,
                ensure: ENSURE.OFF
            });
        }).catch(function (err) {
            res.status(500).json({ error: err.message });
        });
    });
    Router.delete('/user/sync', passportAuth, function (req, res) {
        var user = req.user;
        Service.User.UnlockSync(user).then(function () {
            res.status(200).send();
        }).catch(function () {
            res.status(500).send();
        });
    });
    Router.post('/desktop/folders', passportAuth, function (req, res) {
        var folders = req.body;
        var user = req.user;
        Service.Desktop.CreateChildren(user, folders).then(function (result) {
            res.status(201).json(result);
        }).catch(function (err) {
            Logger.warn(err);
            res.status(500).json({ error: err.message });
        });
    });
};
