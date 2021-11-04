"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var passport = require('../middleware/passport');
var sharedMiddlewareBuilder = require('../middleware/shared-workspace');
var teamsMiddlewareBuilder = require('../middleware/teams');
var logger = require('../../lib/logger').default;
var CONSTANTS = require('../constants');
var Logger = logger.getInstance();
var passportAuth = passport.passportAuth;
module.exports = function (Router, Service, App) {
    var sharedAdapter = sharedMiddlewareBuilder.build(Service);
    var teamsAdapter = teamsMiddlewareBuilder.build(Service);
    Router.get('/storage/folder/:id/:idTeam?', passportAuth, function (req, res) {
        var folderId = req.params.id;
        var teamId = req.params.idTeam || null;
        Service.Folder.GetContent(folderId, req.user, teamId).then(function (result) {
            if (result == null) {
                res.status(500).send([]);
            }
            else {
                res.status(200).json(result);
            }
        }).catch(function (err) {
            // Logger.error(`${err.message}\n${err.stack}`);
            res.status(500).json(err);
        });
    });
    Router.get('/storage/v2/folder/:id/:idTeam?', passportAuth, sharedAdapter, teamsAdapter, function (req, res) {
        var params = req.params, behalfUser = req.behalfUser;
        var id = params.id;
        return Promise.all([
            Service.Folder.getById(id),
            Service.Folder.getFolders(id, behalfUser.id),
            Service.Files.getByFolderAndUserId(id, behalfUser.id)
        ]).then(function (_a) {
            var currentFolder = _a[0], childrenFolders = _a[1], childrenFiles = _a[2];
            if (!currentFolder || !childrenFolders || !childrenFiles) {
                return res.status(400).send();
            }
            return res.status(200).json(__assign(__assign({}, currentFolder), { children: childrenFolders, files: childrenFiles }));
        }).catch(function (err) {
            return res.status(500).json({ error: err.message });
        });
    });
    Router.post('/storage/folder/:folderid/meta', passportAuth, sharedAdapter, function (req, res) {
        var user = req.behalfUser;
        var folderId = req.params.folderid;
        var metadata = req.body.metadata;
        Service.Folder.UpdateMetadata(user, folderId, metadata).then(function (result) {
            res.status(200).json(result);
        }).catch(function (err) {
            Logger.error("Error updating metadata from folder " + folderId + ": " + err);
            res.status(500).json(err.message);
        });
    });
    Router.post('/storage/folder', passportAuth, function (req, res) {
        var _a = req.body, folderName = _a.folderName, parentFolderId = _a.parentFolderId;
        var user = req.user;
        user.mnemonic = req.headers['internxt-mnemonic'];
        Service.Folder.Create(user, folderName, parentFolderId).then(function (result) {
            res.status(201).json(result);
        }).catch(function (err) {
            Logger.warn(err);
            res.status(500).json({ error: err.message });
        });
    });
    Router.delete('/storage/folder/:id', passportAuth, sharedAdapter, function (req, res) {
        var user = req.behalfUser;
        // Set mnemonic to decrypted mnemonic
        user.mnemonic = req.headers['internxt-mnemonic'];
        var folderId = req.params.id;
        Service.Folder.Delete(user, folderId).then(function (result) {
            res.status(204).send(result);
        }).catch(function (err) {
            Logger.error(err.message + "\n" + err.stack);
            res.status(500).send({ error: err.message });
        });
    });
    Router.post('/storage/move/folder', passportAuth, sharedAdapter, function (req, res) {
        var folderId = req.body.folderId;
        var destination = req.body.destination;
        var user = req.behalfUser;
        Service.Folder.MoveFolder(user, folderId, destination).then(function (result) {
            res.status(200).json(result);
        }).catch(function (err) {
            res.status(err.status || 500).json({ error: err.message });
        });
    });
    Router.post('/storage/rename-file-in-network', passportAuth, sharedAdapter, function (req, res) {
        var _a = req.body, bucketId = _a.bucketId, fileId = _a.fileId, relativePath = _a.relativePath;
        var mnemonic = req.headers['internxt-mnemonic'];
        var user = req.behalfUser;
        App.services.Inxt.renameFile(user.email, user.userId, mnemonic, bucketId, fileId, relativePath).then(function () {
            res.status(200).json({ message: "File renamed in network: " + fileId });
        }).catch(function (error) {
            res.status(500).json({ error: error.message });
        });
    });
    Router.post('/storage/file', passportAuth, sharedAdapter, function (req, res) {
        var behalfUser = req.behalfUser;
        var file = req.body.file;
        Service.Files.CreateFile(behalfUser, file).then(function (result) {
            res.status(200).json(result);
        }).catch(function (error) {
            Logger.error(error);
            res.status(400).json({ message: error.message });
        });
    });
    Router.post('/storage/file/:fileid/meta', passportAuth, sharedAdapter, function (req, res) {
        var user = req.behalfUser;
        var fileId = req.params.fileid;
        var _a = req.body, metadata = _a.metadata, bucketId = _a.bucketId, relativePath = _a.relativePath;
        var mnemonic = req.headers['internxt-mnemonic'];
        Service.Files.UpdateMetadata(user, fileId, metadata, mnemonic, bucketId, relativePath).then(function (result) {
            res.status(200).json(result);
        }).catch(function (err) {
            Logger.error("Error updating metadata from file " + fileId + " : " + err);
            res.status(500).json(err.message);
        });
    });
    Router.post('/storage/move/file', passportAuth, sharedAdapter, function (req, res) {
        var _a = req.body, fileId = _a.fileId, destination = _a.destination, bucketId = _a.bucketId, relativePath = _a.relativePath;
        var user = req.behalfUser;
        var mnemonic = req.headers['internxt-mnemonic'];
        Service.Files.MoveFile(user, fileId, destination, bucketId, mnemonic, relativePath).then(function (result) {
            res.status(200).json(result);
        }).catch(function (err) {
            Logger.error(err);
            res.status(err.status || 500).json({ error: err.message });
        });
    });
    /*
     * Delete file by bridge (mongodb) ids
     */
    Router.delete('/storage/bucket/:bucketid/file/:fileid', passportAuth, function (req, res) {
        if (req.params.bucketid === 'null') {
            return res.status(500).json({ error: 'No bucket ID provided' });
        }
        if (req.params.fileid === 'null') {
            return res.status(500).json({ error: 'No file ID provided' });
        }
        var user = req.user;
        var bucketId = req.params.bucketid;
        var fileIdInBucket = req.params.fileid;
        return Service.Files.Delete(user, bucketId, fileIdInBucket).then(function () {
            res.status(200).json({ deleted: true });
        }).catch(function (err) {
            Logger.error(err.stack);
            res.status(500).json({ error: err.message });
        });
    });
    /*
     * Delete file by database ids (sql)
     */
    Router.delete('/storage/folder/:folderid/file/:fileid', passportAuth, sharedAdapter, function (req, res) {
        var user = req.behalfUser, params = req.params;
        var folderid = params.folderid, fileid = params.fileid;
        Service.Files.DeleteFile(user, folderid, fileid).then(function () {
            res.status(200).json({ deleted: true });
        }).catch(function (err) {
            res.status(500).json({ error: err.message });
        });
    });
    Router.post('/storage/share/file/:id', passportAuth, sharedAdapter, function (req, res) {
        var user = req.behalfUser;
        var itemId = req.params.id;
        var _a = req.body, isFolder = _a.isFolder, views = _a.views, encryptionKey = _a.encryptionKey, fileToken = _a.fileToken, bucket = _a.bucket;
        Service.Share.GenerateToken(user, itemId, '', bucket, encryptionKey, fileToken, isFolder, views).then(function (result) {
            res.status(200).send({ token: result });
        }).catch(function (err) {
            res.status(500).send({ error: err.message });
        });
    });
    Router.post('/storage/folder/fixduplicate', passportAuth, function (req, res) {
        var user = req.user;
        Service.Folder.changeDuplicateName(user).then(function (result) {
            res.status(204).json(result);
        }).catch(function (err) {
            res.status(500).json(err.message);
        });
    });
    Router.get('/storage/share/:token', function (req, res) {
        Service.Share.get(req.params.token).then(function (share) {
            res.status(200).json(share);
        }).catch(function (err) {
            res.status(500).send({ error: err.message });
        });
    });
    Router.get('/storage/files/:folderId', passportAuth, function (req, res) {
        var userId = req.user.id;
        var folderId = req.params.folderId;
        if (!folderId) {
            res.status(400).send({ error: 'Missing folder id' });
        }
        else {
            Service.Files.getByFolderAndUserId(folderId, userId).then(function (files) {
                res.status(200).json(files);
            }).catch(function (err) {
                res.status(500).send({ error: err.message });
            });
        }
    });
    // Needs db index
    Router.get('/storage/recents', passportAuth, sharedAdapter, function (req, res) {
        var limit = req.query.limit;
        limit = Math.min(parseInt(limit, 10), CONSTANTS.RECENTS_LIMIT) || CONSTANTS.RECENTS_LIMIT;
        Service.Files.getRecentFiles(req.behalfUser.id, limit).then(function (files) {
            if (!files) {
                return res.status(404).send({ error: 'Files not found' });
            }
            files = files.map(function (file) { return (__assign(__assign({}, file), { name: App.services.Crypt.decryptName(file.name, file.folder_id) })); });
            return res.status(200).json(files);
        }).catch(function (err) {
            Logger.error("Can not get recent files: " + req.user.email + " : " + err.message);
            res.status(500).send({ error: 'Can not get recent files' });
        });
    });
    Router.get('/storage/tree', passportAuth, function (req, res) {
        var user = req.user;
        Service.Folder.GetTree(user).then(function (result) {
            res.status(200).send(result);
        }).catch(function (err) {
            res.status(500).send({ error: err.message });
        });
    });
    Router.get('/storage/tree/:folderId', passportAuth, function (req, res) {
        var user = req.user;
        var folderId = req.params.folderId;
        Service.Folder.GetTree(user, folderId).then(function (result) {
            var treeSize = Service.Folder.GetTreeSize(result);
            res.status(200).send({ tree: result, size: treeSize });
        }).catch(function (err) {
            res.status(500).send({ error: err.message });
        });
    });
};
