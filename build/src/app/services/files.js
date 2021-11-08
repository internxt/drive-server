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
var sequelize = require('sequelize');
var async = require('async');
var createHttpError = require('http-errors');
var AesUtil = require('../../lib/AesUtil');
// Filenames that contain "/", "\" or only spaces are invalid
var invalidName = /[/\\]|^\s*$/;
var Op = sequelize.Op;
module.exports = function (Model, App) {
    var CreateFile = function (user, file) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            if (!file || !file.fileId || !file.bucket || !file.size || !file.folder_id || !file.name) {
                throw Error('Invalid metadata for new file');
            }
            return [2 /*return*/, Model.folder.findOne({
                    where: {
                        id: (_a = {}, _a[Op.eq] = file.folder_id, _a),
                        user_id: (_b = {}, _b[Op.eq] = user.id, _b)
                    }
                }).then(function (folder) { return __awaiter(void 0, void 0, void 0, function () {
                    var fileExists, fileInfo;
                    var _a, _b, _c, _d;
                    return __generator(this, function (_e) {
                        switch (_e.label) {
                            case 0:
                                if (!folder) {
                                    throw Error('Folder not found / Is not your folder');
                                }
                                return [4 /*yield*/, Model.file.findOne({
                                        where: {
                                            name: (_a = {}, _a[Op.eq] = file.name, _a),
                                            folder_id: (_b = {}, _b[Op.eq] = folder.id, _b),
                                            type: (_c = {}, _c[Op.eq] = file.type, _c),
                                            userId: (_d = {}, _d[Op.eq] = user.id, _d)
                                        }
                                    })];
                            case 1:
                                fileExists = _e.sent();
                                if (fileExists) {
                                    throw Error('File entry already exists');
                                }
                                fileInfo = {
                                    name: file.name,
                                    type: file.type,
                                    size: file.size,
                                    folder_id: folder.id,
                                    fileId: file.file_id,
                                    bucket: file.bucket,
                                    encrypt_version: file.encrypt_version,
                                    userId: user.id,
                                    modificationTime: file.modificationTime || new Date()
                                };
                                try {
                                    AesUtil.decrypt(file.name, file.file_id);
                                    fileInfo.encrypt_version = '03-aes';
                                }
                                catch (_f) {
                                    // eslint-disable-next-line no-empty
                                }
                                if (file.date) {
                                    fileInfo.createdAt = file.date;
                                }
                                return [2 /*return*/, Model.file.create(fileInfo)];
                        }
                    });
                }); })];
        });
    }); };
    var Delete = function (user, bucket, fileId) { return new Promise(function (resolve, reject) {
        App.services.Inxt.DeleteFile(user, bucket, fileId).then(function () { return __awaiter(void 0, void 0, void 0, function () {
            var file, isDestroyed;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Model.file.findOne({ where: { fileId: (_a = {}, _a[Op.eq] = fileId, _a), userId: user.id } })];
                    case 1:
                        file = _b.sent();
                        if (!file) return [3 /*break*/, 3];
                        return [4 /*yield*/, file.destroy()];
                    case 2:
                        isDestroyed = _b.sent();
                        if (isDestroyed) {
                            return [2 /*return*/, resolve('File deleted')];
                        }
                        return [2 /*return*/, reject(Error('Cannot delete file'))];
                    case 3: return [2 /*return*/, reject(Error('File not found'))];
                }
            });
        }); }).catch(function (err) { return __awaiter(void 0, void 0, void 0, function () {
            var file;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!err.message.includes('Resource not found')) return [3 /*break*/, 4];
                        return [4 /*yield*/, Model.file.findOne({
                                where: { fileId: (_a = {}, _a[Op.eq] = fileId, _a), userId: user.id }
                            })];
                    case 1:
                        file = _b.sent();
                        if (!file) return [3 /*break*/, 3];
                        return [4 /*yield*/, file.destroy()];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        resolve();
                        return [3 /*break*/, 5];
                    case 4:
                        reject(err);
                        _b.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        }); });
    }); };
    var DeleteFile = function (user, folderId, fileId) { return __awaiter(void 0, void 0, void 0, function () {
        var file, err_1, resourceNotFoundPattern;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Model.file.findOne({ where: { id: fileId, folder_id: folderId, userId: user.id } })];
                case 1:
                    file = _a.sent();
                    return [4 /*yield*/, Model.shares.destroy({ where: { file: file.fileId } }).catch(function () {
                            // eslint-disable-next-line no-empty
                        })];
                case 2:
                    _a.sent();
                    if (!file) {
                        throw Error('File/Folder not found');
                    }
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, App.services.Inxt.DeleteFile(user, file.bucket, file.fileId)];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 5:
                    err_1 = _a.sent();
                    resourceNotFoundPattern = /Resource not found/;
                    if (!resourceNotFoundPattern.exec(err_1.message)) {
                        throw err_1;
                    }
                    return [3 /*break*/, 6];
                case 6: return [4 /*yield*/, file.destroy()];
                case 7:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var UpdateMetadata = function (user, fileId, metadata, mnemonic, bucketId, relativePath) {
        var newMeta = {};
        return async.waterfall([
            function (next) {
                var _a;
                // Find the file in database
                Model.file
                    .findOne({ where: { fileId: (_a = {}, _a[Op.eq] = fileId, _a), userId: user.id } }).then(function (file) {
                    if (!file) {
                        next(Error('Update Metadata Error: File not exists'));
                    }
                    else {
                        next(null, file);
                    }
                }).catch(next);
            },
            function (file, next) {
                if (metadata.itemName !== undefined) {
                    if (invalidName.test(metadata.itemName)) {
                        return next(Error('Cannot upload, invalid file name'));
                    }
                }
                return next(null, file);
            },
            function (file, next) {
                var _a, _b;
                Model.folder
                    .findOne({
                    where: {
                        id: (_a = {}, _a[Op.eq] = file.folder_id, _a),
                        user_id: (_b = {}, _b[Op.eq] = user.id, _b)
                    }
                }).then(function (folder) {
                    if (!folder) {
                        next(Error('Update Metadata Error: Not your file'));
                    }
                    else {
                        next(null, file);
                    }
                }).catch(next);
            },
            function (file, next) {
                var _a, _b, _c;
                // If no name, empty string (only extension filename)
                var cryptoFileName = metadata.itemName
                    ? App.services.Crypt.encryptName(metadata.itemName, file.folder_id)
                    : '';
                // Check if there is a file with the same name
                Model.file
                    .findOne({
                    where: {
                        folder_id: (_a = {}, _a[Op.eq] = file.folder_id, _a),
                        name: (_b = {}, _b[Op.eq] = cryptoFileName, _b),
                        type: (_c = {}, _c[Op.eq] = file.type, _c)
                    }
                }).then(function (duplicateFile) {
                    if (duplicateFile) {
                        return next(Error('File with this name exists'));
                    }
                    newMeta.name = cryptoFileName;
                    return next(null, file);
                }).catch(next);
            },
            function (file, next) {
                if (newMeta.name !== file.name) {
                    file.update(newMeta).then(function (update) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, App.services.Inxt.renameFile(user.email, user.userId, mnemonic, bucketId, fileId, relativePath)];
                                case 1:
                                    _a.sent();
                                    next(null, update);
                                    return [2 /*return*/];
                            }
                        });
                    }); }).catch(next);
                }
                else {
                    next();
                }
            }
        ]);
    };
    var MoveFile = function (user, fileId, destination, bucketId, mnemonic, relativePath) { return __awaiter(void 0, void 0, void 0, function () {
        var file, folderSource, folderTarget, originalName, destinationName, exists, result, response;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, Model.file.findOne({ where: { fileId: (_a = {}, _a[Op.eq] = fileId, _a) }, userId: user.id })];
                case 1:
                    file = _e.sent();
                    if (!file) {
                        throw Error('File not found');
                    }
                    return [4 /*yield*/, Model.folder.findOne({ where: { id: file.folder_id, user_id: user.id } })];
                case 2:
                    folderSource = _e.sent();
                    return [4 /*yield*/, Model.folder.findOne({ where: { id: destination, user_id: user.id } })];
                case 3:
                    folderTarget = _e.sent();
                    if (!folderSource || !folderTarget) {
                        throw Error('Folder not found');
                    }
                    originalName = App.services.Crypt.decryptName(file.name, file.folder_id);
                    destinationName = App.services.Crypt.encryptName(originalName, destination);
                    return [4 /*yield*/, Model.file.findOne({
                            where: {
                                name: (_b = {}, _b[Op.eq] = destinationName, _b),
                                folder_id: (_c = {}, _c[Op.eq] = destination, _c),
                                type: (_d = {}, _d[Op.eq] = file.type, _d)
                            }
                        })];
                case 4:
                    exists = _e.sent();
                    // Change name if exists
                    if (exists) {
                        throw createHttpError(409, 'A file with same name exists in destination');
                    }
                    // Move
                    return [4 /*yield*/, App.services.Inxt.renameFile(user.email, user.userId, mnemonic, bucketId, fileId, relativePath)];
                case 5:
                    // Move
                    _e.sent();
                    return [4 /*yield*/, file.update({
                            folder_id: parseInt(destination, 10),
                            name: destinationName
                        })];
                case 6:
                    result = _e.sent();
                    // we don't want ecrypted name on front
                    file.setDataValue('name', App.services.Crypt.decryptName(destinationName, destination));
                    file.setDataValue('folder_id', parseInt(destination, 10));
                    response = {
                        result: result,
                        item: file,
                        destination: destination,
                        moved: true
                    };
                    return [2 /*return*/, response];
            }
        });
    }); };
    var isFileOfTeamFolder = function (fileId) { return new Promise(function (resolve, reject) {
        var _a, _b;
        Model.file
            .findOne({
            where: {
                file_id: (_a = {}, _a[Op.eq] = fileId, _a)
            },
            include: [
                {
                    model: Model.folder,
                    where: {
                        id_team: (_b = {}, _b[Op.ne] = null, _b)
                    }
                }
            ]
        }).then(function (file) {
            if (!file) {
                throw Error('File not found on database, please refresh');
            }
            resolve(file);
        }).catch(reject);
    }); };
    var getFileByFolder = function (fileId, folderId, userId) {
        var _a, _b, _c;
        return Model.file.findOne({
            where: {
                file_id: (_a = {}, _a[Op.eq] = fileId, _a)
            },
            raw: true,
            include: [
                {
                    model: Model.folder,
                    where: {
                        user_id: (_b = {}, _b[Op.eq] = userId, _b),
                        id: (_c = {}, _c[Op.eq] = folderId, _c)
                    }
                }
            ]
        });
    };
    var getByFolderAndUserId = function (folderId, userId) {
        return Model.file.findAll({ where: { folderId: folderId, userId: userId } }).then(function (files) {
            if (!files) {
                throw new Error('Not found');
            }
            return files.map(function (file) {
                file.name = App.services.Crypt.decryptName(file.name, folderId);
                return file;
            });
        });
    };
    var getRecentFiles = function (userId, limit) { return __awaiter(void 0, void 0, void 0, function () {
        var results;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Model.file.findAll({
                        order: [['updatedAt', 'DESC']],
                        limit: limit,
                        raw: true,
                        where: { userId: userId }
                    })];
                case 1:
                    results = _a.sent();
                    return [2 /*return*/, results];
            }
        });
    }); };
    return {
        Name: 'Files',
        CreateFile: CreateFile,
        Delete: Delete,
        DeleteFile: DeleteFile,
        UpdateMetadata: UpdateMetadata,
        MoveFile: MoveFile,
        isFileOfTeamFolder: isFileOfTeamFolder,
        getRecentFiles: getRecentFiles,
        getFileByFolder: getFileByFolder,
        getByFolderAndUserId: getByFolderAndUserId
    };
};
