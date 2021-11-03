"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var path = require('path');
var async = require('async');
var passportAuth = require('../middleware/passport').passportAuth;
var logger = require('../../lib/logger');
var Logger = logger.getInstance();
module.exports = function (Router, Service) {
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
    Router.post('/storage/exists', passportAuth, function (req, res) {
        var rootFolderId = req.user.root_folder_id;
        var targetPath = req.body.path;
        // Create subdirectories if not exists
        var mkdirp = !!req.body.mkdirp;
        // Basename is file or folder
        var findFile = !!req.body.isFile;
        // win32 normalization converts all "/" to "\". Posix doesn't
        targetPath = path.win32.normalize(targetPath);
        // If is a relative path, and is not ref to root folder, is an invalid path
        if (targetPath.substring(0, 1) === '.' && targetPath !== '.' && targetPath !== '.\\') {
            return res.status(501).send({ error: 'Invalid path' });
        }
        // If path es "." or "./" or "./././"..., is the root folder. Just ok
        if (targetPath === '.' || targetPath === '.\\') {
            return Service.Folder.GetBucket(req.user, rootFolderId).then(function (folder) {
                folder.name = Service.Crypt.decryptName(folder.name);
                res.status(200).send({ result: 'ok', isRoot: true, path: folder });
            });
        }
        var splitted = targetPath.split('\\');
        splitted = splitted.filter(function (e) { return e !== ''; });
        var GetChildren = function (folderId, match) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        Service.Folder.GetChildren(req.user, folderId).then(function (result) {
                            async.eachSeries(result, function (folder, nextItem) {
                                var name = Service.Crypt.decryptName(folder.name, folderId);
                                if (name === match) {
                                    folder.name = name;
                                    nextItem(folder);
                                }
                                else {
                                    nextItem();
                                }
                            }, function (err) {
                                if (err) {
                                    if (typeof err === 'object') {
                                        resolve(err);
                                    }
                                    else {
                                        reject(err);
                                    }
                                }
                                else {
                                    reject();
                                }
                            });
                        });
                    })];
            });
        }); };
        var GetFiles = function (folderId, match) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        Service.Folder.GetContent(folderId, req.user).then(function (result) {
                            async.eachSeries(result.files, function (file, nextFile) {
                                var fileName = file.name + (file.type ? "." + file.type : '');
                                if (fileName === match) {
                                    nextFile(file);
                                }
                                else {
                                    // console.log('No match %s', fileName)
                                    nextFile();
                                }
                            }, function (err) {
                                if (err) {
                                    if (typeof err === 'object') {
                                        resolve(err);
                                    }
                                    else {
                                        reject(err);
                                    }
                                }
                                else {
                                    reject();
                                }
                            });
                        });
                    })];
            });
        }); };
        var lastFolderId = rootFolderId;
        var i = 0;
        var pathResults = [];
        return async.eachSeries(splitted, function (targetFolder, nextFolder) {
            // console.log('Searching for %s on folder %s', targetFolder, lastFolderId)
            var isLastElement = i === splitted.length - 1;
            i += 1;
            if (!isLastElement || !findFile) {
                GetChildren(lastFolderId, targetFolder).then(function (result) {
                    lastFolderId = result.id;
                    result.isFile = false;
                    pathResults.push(result);
                    nextFolder();
                }).catch(function () {
                    if (mkdirp) {
                        Service.Folder.Create(req.user, targetFolder, lastFolderId).then(function (result) {
                            lastFolderId = result.id;
                            nextFolder();
                        }).catch(function (err1) {
                            nextFolder(err1);
                        });
                    }
                    else {
                        nextFolder(Error('Folder does not exists'));
                    }
                });
            }
            if (isLastElement && findFile) {
                GetFiles(lastFolderId, targetFolder).then(function (result) {
                    result.dataValues.isFile = true;
                    pathResults.push(result);
                    nextFolder();
                }).catch(function () {
                    nextFolder(Error('File does not exists'));
                });
            }
        }, function (err) {
            // console.log('FIN')
            if (err) {
                res.status(501).send({ error: err.message });
            }
            else {
                // console.log(pathResults)
                res.status(200).send({ result: 'ok', isRoot: false, path: pathResults });
            }
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
