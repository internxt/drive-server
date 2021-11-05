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
    var _ = { label: 0, sent: function () { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function () { return this; }), g;
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
var _a = require('sequelize'), fn = _a.fn, col = _a.col;
var createHttpError = require('http-errors');
var AesUtil = require('../../lib/AesUtil');
var Logger = require('../../lib/logger').default;
var invalidName = /[\\/]|[. ]$/;
var Op = sequelize.Op;
module.exports = function (Model, App) {
    var getById = function (id) {
        return Model.folder.findOne({ where: { id: id }, raw: true }).then(function (folder) {
            folder.name = App.services.Crypt.decryptName(folder.name, folder.parentId);
            return folder;
        });
    };
    // Create folder entry, for desktop
    var Create = function (user, folderName, parentFolderId, teamId) {
        if (teamId === void 0) { teamId = null; }
        return __awaiter(void 0, void 0, void 0, function () {
            var whereCondition, isGuest, bridgeUser, existsParentFolder, cryptoFolderName, exists, folder;
            var _a, _b, _c, _d, _e, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        if (parentFolderId >= 2147483648) {
                            throw Error('Invalid parent folder');
                        }
                        whereCondition = { where: null };
                        isGuest = user.email !== user.bridgeUser;
                        if (!isGuest) return [3 /*break*/, 2];
                        bridgeUser = user.bridgeUser;
                        return [4 /*yield*/, Model.users.findOne({
                            where: { username: bridgeUser }
                        })];
                    case 1:
                        user = _g.sent();
                        _g.label = 2;
                    case 2:
                        if (teamId) {
                            whereCondition.where = {
                                id: (_a = {}, _a[Op.eq] = parentFolderId, _a),
                                id_team: (_b = {}, _b[Op.eq] = teamId, _b)
                            };
                        }
                        else {
                            whereCondition.where = {
                                id: (_c = {}, _c[Op.eq] = parentFolderId, _c),
                                user_id: (_d = {}, _d[Op.eq] = user.id, _d)
                            };
                        }
                        return [4 /*yield*/, Model.folder.findOne({ whereCondition: whereCondition })];
                    case 3:
                        existsParentFolder = _g.sent();
                        if (!existsParentFolder) {
                            throw Error('Parent folder is not yours');
                        }
                        if (folderName === '' || invalidName.test(folderName)) {
                            throw Error('Invalid folder name');
                        }
                        if (user.mnemonic === 'null') {
                            // throw Error('Your mnemonic is invalid');
                        }
                        cryptoFolderName = App.services.Crypt.encryptName(folderName, parentFolderId);
                        return [4 /*yield*/, Model.folder.findOne({
                            where: {
                                parentId: (_e = {}, _e[Op.eq] = parentFolderId, _e),
                                name: (_f = {}, _f[Op.eq] = cryptoFolderName, _f)
                            }
                        })];
                    case 4:
                        exists = _g.sent();
                        if (exists) {
                            // TODO: If the folder already exists,
                            // return the folder data to make desktop
                            // incorporate new info to its database
                            throw Error('Folder with the same name already exists');
                        }
                        return [4 /*yield*/, user.createFolder({
                            name: cryptoFolderName,
                            bucket: null,
                            parentId: parentFolderId || null,
                            id_team: teamId
                        })];
                    case 5:
                        folder = _g.sent();
                        return [2 /*return*/, folder];
                }
            });
        });
    };
    // Requires stored procedure
    var DeleteOrphanFolders = function (userId) {
        return __awaiter(void 0, void 0, void 0, function () {
            var clear, totalLeft;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, App.database.instance
                        .query('CALL clear_orphan_folders_by_user (:userId)', { replacements: { userId: userId } })];
                    case 1:
                        clear = _a.sent();
                        totalLeft = clear[0].total_left;
                        if (totalLeft > 0) {
                            return [2 /*return*/, DeleteOrphanFolders(userId)];
                        }
                        return [2 /*return*/, true];
                }
            });
        });
    };
    var Delete = function (user, folderId) {
        return __awaiter(void 0, void 0, void 0, function () {
            var folder, removed;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (user.mnemonic === 'null') {
                            throw new Error('Your mnemonic is invalid');
                        }
                        return [4 /*yield*/, Model.folder.findOne({
                            where: { id: (_a = {}, _a[Op.eq] = folderId, _a), userId: (_b = {}, _b[Op.eq] = user.id, _b) }
                        })];
                    case 1:
                        folder = _c.sent();
                        if (!folder) {
                            throw new Error('Folder does not exists');
                        }
                        if (folder.id === user.root_folder_id) {
                            throw new Error('Cannot delete root folder');
                        }
                        return [4 /*yield*/, folder.destroy()];
                    case 2:
                        removed = _c.sent();
                        DeleteOrphanFolders(user.id).catch(function (err) {
                            Logger.error('ERROR deleting orphan folders from user %s, reason: %s', user.email, err.message);
                        });
                        return [2 /*return*/, removed];
                }
            });
        });
    };
    var GetTreeSize = function (tree) {
        var treeSize = 0;
        function getFileSize(files) {
            files.forEach(function (file) {
                treeSize += file.size;
            });
        }
        function getChildrenSize(children) {
            children.forEach(function (child) {
                if (child.files && child.files.length > 0) {
                    getFileSize(child.files);
                }
                if (child.children && child.children.length > 0) {
                    getChildrenSize(child.children);
                }
            });
        }
        if (tree.files && tree.files.length > 0) {
            getFileSize(tree.files);
        }
        if (tree.children && tree.children.length > 0) {
            getChildrenSize(tree.children);
        }
        return treeSize;
    };
    // A tree without using hierarchy library
    var GetTree = function (user, rootFolderId) {
        if (rootFolderId === void 0) { rootFolderId = null; }
        return __awaiter(void 0, void 0, void 0, function () {
            var folderContents, res;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Model.folder.findOne({
                        where: { id: (_a = {}, _a[Op.eq] = rootFolderId || user.root_folder_id, _a) },
                        include: [
                            {
                                model: Model.folder,
                                as: 'children',
                                include: [
                                    {
                                        model: Model.file,
                                        as: 'files'
                                    }
                                ]
                            },
                            {
                                model: Model.file,
                                as: 'files'
                            }
                        ]
                    })];
                    case 1:
                        folderContents = (_b.sent()).toJSON();
                        return [4 /*yield*/, async.mapSeries(folderContents.children, function (folder) {
                            return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, GetTree(user, folder.id)];
                                });
                            });
                        })];
                    case 2:
                        res = _b.sent();
                        folderContents.children = res;
                        return [2 /*return*/, folderContents];
                }
            });
        });
    };
    var GetFoldersPagination = function (user, index) {
        return __awaiter(void 0, void 0, void 0, function () {
            var userObject, root, folders, foldersId, files;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        userObject = user;
                        return [4 /*yield*/, Model.folder.findOne({
                            where: {
                                id: (_a = {}, _a[Op.eq] = userObject.root_folder_id, _a),
                                userId: user.id
                            }
                        })];
                    case 1:
                        root = _d.sent();
                        if (!root) {
                            throw new Error('root folder does not exists');
                        }
                        return [4 /*yield*/, Model.folder.findAll({
                            where: { user_id: (_b = {}, _b[Op.eq] = userObject.id, _b) },
                            attributes: ['id', 'parent_id', 'name', 'bucket', 'updated_at', 'created_at'],
                            order: [['id', 'DESC']],
                            limit: 5000,
                            offset: index
                        })];
                    case 2:
                        folders = _d.sent();
                        foldersId = folders.map(function (result) { return result.id; });
                        return [4 /*yield*/, Model.file.findAll({
                            where: { folder_id: (_c = {}, _c[Op.in] = foldersId, _c), userId: user.id }
                        })];
                    case 3:
                        files = _d.sent();
                        return [2 /*return*/, {
                            folders: folders,
                            files: files
                        }];
                }
            });
        });
    };
    var mapChildrenNames = function (folder) {
        if (folder === void 0) { folder = []; }
        return folder.map(function (child) {
            child.name = App.services.Crypt.decryptName(child.name, child.parentId);
            child.children = mapChildrenNames(child.children);
            return child;
        });
    };
    var getFolders = function (parentFolderId, userId) {
        return Model.folder.findAll({
            where: { parentId: parentFolderId, userId: userId }
        }).then(function (folders) {
            if (!folders) {
                throw new Error('Not found');
            }
            return folders.map(function (folder) {
                folder.name = App.services.Crypt.decryptName(folder.name, folder.parentId);
                return folder;
            });
        });
    };
    var GetContent = function (folderId, user, teamId) {
        if (teamId === void 0) { teamId = null; }
        return __awaiter(void 0, void 0, void 0, function () {
            var teamMember, result;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!(user.email !== user.bridgeUser)) return [3 /*break*/, 2];
                        return [4 /*yield*/, Model.users.findOne({ where: { username: user.bridgeUser } })];
                    case 1:
                        user = _d.sent();
                        _d.label = 2;
                    case 2:
                        teamMember = null;
                        if (!teamId) return [3 /*break*/, 4];
                        return [4 /*yield*/, Model.teamsmembers.findOne({
                            where: {
                                user: (_a = {}, _a[Op.eq] = user.email, _a),
                                id_team: (_b = {}, _b[Op.eq] = teamId, _b)
                            }
                        })];
                    case 3:
                        teamMember = _d.sent();
                        _d.label = 4;
                    case 4:
                        if (teamId && !teamMember) {
                            return [2 /*return*/, null]; // User isn't member of this team
                        }
                        return [4 /*yield*/, Model.folder.findOne({
                            where: {
                                id: (_c = {}, _c[Op.eq] = folderId, _c),
                                user_id: user.id
                            },
                            include: [
                                {
                                    model: Model.folder,
                                    as: 'children',
                                    where: { userId: user.id },
                                    separate: true
                                },
                                {
                                    model: Model.file,
                                    as: 'files',
                                    where: { userId: user.id },
                                    separate: true
                                }
                            ]
                        })];
                    case 5:
                        result = _d.sent();
                        // Null result implies empty folder.
                        // TODO: Should send an error to be handled and showed on website.
                        if (result !== null) {
                            result.name = App.services.Crypt.decryptName(result.name, result.parentId);
                            result.children = mapChildrenNames(result.children);
                            result.files = result.files.map(function (file) {
                                file.name = "" + App.services.Crypt.decryptName(file.name, file.folder_id);
                                return file;
                            });
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    var isFolderOfTeam = function (folderId) {
        var _a;
        return Model.folder.findOne({
            where: {
                id: (_a = {}, _a[Op.eq] = folderId, _a)
            }
        }).then(function (folder) {
            if (!folder) {
                throw Error('Folder not found on database, please refresh');
            }
            return folder;
        });
    };
    var UpdateMetadata = function (user, folderId, metadata) {
        var newMeta = {};
        return async.waterfall([
            function (next) {
                // Is there something to change?
                if (!metadata || !metadata.itemName) {
                    next(Error('Nothing to change'));
                }
                else {
                    next();
                }
            },
            function (next) {
                if (metadata.itemName && (metadata.itemName === '' || invalidName.test(metadata.itemName))) {
                    return next(Error('Invalid folder name'));
                }
                return next();
            },
            function (next) {
                var _a, _b;
                // Get the target folder from database
                Model.folder
                    .findOne({
                        where: {
                            id: (_a = {}, _a[Op.eq] = folderId, _a),
                            user_id: (_b = {}, _b[Op.eq] = user.id, _b)
                        }
                    }).then(function (result) {
                        if (!result) {
                            throw Error('Folder does not exists');
                        }
                        next(null, result);
                    }).catch(next);
            },
            function (folder, next) {
                var _a, _b;
                // Check if the new folder name already exists
                if (metadata.itemName) {
                    var cryptoFolderName_1 = App.services.Crypt.encryptName(metadata.itemName, folder.parentId);
                    Model.folder.findOne({
                        where: {
                            parentId: (_a = {}, _a[Op.eq] = folder.parentId, _a),
                            name: (_b = {}, _b[Op.eq] = cryptoFolderName_1, _b)
                        }
                    }).then(function (isDuplicated) {
                        if (isDuplicated) {
                            return next(Error('Folder with this name exists'));
                        }
                        newMeta.name = cryptoFolderName_1;
                        try {
                            AesUtil.decrypt(cryptoFolderName_1, folder.parentId);
                            newMeta.encrypt_version = '03-aes';
                        }
                        catch (e) {
                            // no op
                        }
                        return next(null, folder);
                    }).catch(next);
                }
                else {
                    next(null, folder);
                }
            },
            function (folder, next) {
                // Perform the update
                folder
                    .update(newMeta).then(function (result) { return next(null, result); }).catch(next);
            }
        ]);
    };
    var GetChildren = function (user, folderId, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(void 0, void 0, void 0, function () {
            var query;
            var _a, _b;
            return __generator(this, function (_c) {
                query = {
                    where: {
                        user_id: (_a = {}, _a[Op.eq] = user.id, _a),
                        parent_id: (_b = {}, _b[Op.eq] = folderId, _b)
                    },
                    raw: true
                };
                if (options.attributes) {
                    query.attributes = options.attributes;
                }
                return [2 /*return*/, Model.folder.findAll(query)];
            });
        });
    };
    var MoveFolder = function (user, folderId, destination) {
        return __awaiter(void 0, void 0, void 0, function () {
            var folder, destinationFolder, originalName, destinationName, exists, result, response;
            var _a, _b, _c, _d, _e, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0: return [4 /*yield*/, Model.folder.findOne({
                        where: {
                            id: (_a = {}, _a[Op.eq] = folderId, _a),
                            user_id: (_b = {}, _b[Op.eq] = user.id, _b)
                        }
                    })];
                    case 1:
                        folder = _g.sent();
                        return [4 /*yield*/, Model.folder.findOne({
                            where: {
                                id: (_c = {}, _c[Op.eq] = destination, _c),
                                user_id: (_d = {}, _d[Op.eq] = user.id, _d)
                            }
                        })];
                    case 2:
                        destinationFolder = _g.sent();
                        if (!folder || !destinationFolder) {
                            throw Error('Folder does not exists');
                        }
                        originalName = App.services.Crypt.decryptName(folder.name, folder.parentId);
                        destinationName = App.services.Crypt.encryptName(originalName, destination);
                        return [4 /*yield*/, Model.folder.findOne({
                            where: {
                                name: (_e = {}, _e[Op.eq] = destinationName, _e),
                                parent_id: (_f = {}, _f[Op.eq] = destination, _f)
                            }
                        })];
                    case 3:
                        exists = _g.sent();
                        if (exists) {
                            throw createHttpError(409, 'A folder with same name exists in destination');
                        }
                        if (user.mnemonic === 'null')
                            throw Error('Your mnemonic is invalid');
                        return [4 /*yield*/, folder.update({
                            parentId: parseInt(destination, 10),
                            name: destinationName
                        })];
                    case 4:
                        result = _g.sent();
                        // we don't want ecrypted name on front
                        folder.setDataValue('name', App.services.Crypt.decryptName(destinationName, destination));
                        folder.setDataValue('parentId', parseInt(destination, 10));
                        response = {
                            result: result,
                            item: folder,
                            destination: destination,
                            moved: true
                        };
                        return [2 /*return*/, response];
                }
            });
        });
    };
    var GetBucket = function (user, folderId) {
        var _a, _b;
        return Model.folder.findOne({
            where: {
                id: (_a = {}, _a[Op.eq] = folderId, _a),
                user_id: (_b = {}, _b[Op.eq] = user.id, _b)
            }
        });
    };
    var changeDuplicateName = function (user) {
        return __awaiter(void 0, void 0, void 0, function () {
            var userObject, index, duplicateName, dict, folders;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        userObject = user;
                        index = 0;
                        duplicateName = ['inicial'];
                        dict = new Map();
                        _e.label = 1;
                    case 1:
                        if (!(duplicateName.length !== 0)) return [3 /*break*/, 4];
                        return [4 /*yield*/, Model.folder.findAll({
                            where: { user_id: (_a = {}, _a[Op.eq] = userObject.id, _a) },
                            attributes: ['name', [fn('COUNT', col('*')), 'count_name']],
                            group: ['name'],
                            having: {
                                count_name: (_b = {},
                                    _b[Op.gt] = 1,
                                    _b)
                            },
                            limit: 5000,
                            offset: index
                        })];
                    case 2:
                        // eslint-disable-next-line no-await-in-loop
                        duplicateName = _e.sent();
                        if (duplicateName.length === 0) {
                            return [3 /*break*/, 4];
                        }
                        duplicateName = duplicateName.map(function (obj) { return obj.name; });
                        return [4 /*yield*/, Model.folder.findAll({
                            where: {
                                user_id: (_c = {},
                                    _c[Op.eq] = userObject.id,
                                    _c),
                                name: (_d = {}, _d[Op.in] = duplicateName, _d)
                            },
                            attributes: ['id', 'name', 'parent_id']
                        })];
                    case 3:
                        folders = _e.sent();
                        dict.clear();
                        folders.forEach(function (folder) {
                            return __awaiter(void 0, void 0, void 0, function () {
                                var resolved, i, originalName, e_1;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (!dict.get(folder.name)) return [3 /*break*/, 7];
                                            resolved = false;
                                            i = 1;
                                            _a.label = 1;
                                        case 1:
                                            if (!!resolved) return [3 /*break*/, 6];
                                            originalName = App.services.Crypt.decryptName(folder.name, folder.parent_id);
                                            _a.label = 2;
                                        case 2:
                                            _a.trys.push([2, 4, , 5]);
                                            // eslint-disable-next-line no-await-in-loop
                                            return [4 /*yield*/, UpdateMetadata(user, folder.id, { itemName: originalName + "(" + i + ")" })];
                                        case 3:
                                            // eslint-disable-next-line no-await-in-loop
                                            _a.sent();
                                            resolved = true;
                                            return [3 /*break*/, 5];
                                        case 4:
                                            e_1 = _a.sent();
                                            i += 1;
                                            return [3 /*break*/, 5];
                                        case 5: return [3 /*break*/, 1];
                                        case 6: return [3 /*break*/, 8];
                                        case 7:
                                            dict.set(folder.name, true);
                                            _a.label = 8;
                                        case 8: return [2 /*return*/];
                                    }
                                });
                            });
                        });
                        index += 5000;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return {
        Name: 'Folder',
        getById: getById,
        Create: Create,
        Delete: Delete,
        GetChildren: GetChildren,
        GetTree: GetTree,
        GetTreeSize: GetTreeSize,
        GetContent: GetContent,
        UpdateMetadata: UpdateMetadata,
        MoveFolder: MoveFolder,
        GetBucket: GetBucket,
        getFolders: getFolders,
        isFolderOfTeam: isFolderOfTeam,
        GetFoldersPagination: GetFoldersPagination,
        changeDuplicateName: changeDuplicateName
    };
};
