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
var crypto = require('crypto');
var sequelize = require('sequelize');
var SHARE_TOKEN_LENGTH = require('../constants').SHARE_TOKEN_LENGTH;
var FolderService = require('./folder');
var Op = sequelize.Op;
module.exports = function (Model, App) {
    var FolderServiceInstance = FolderService(Model, App);
    var get = function (token) { return __awaiter(void 0, void 0, void 0, function () {
        var maxAcceptableSize, result, file;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    maxAcceptableSize = 1024 * 1024 * 1000;
                    return [4 /*yield*/, Model.shares.findOne({
                            where: { token: (_a = {}, _a[Op.eq] = token, _a) }
                        })];
                case 1:
                    result = _d.sent();
                    if (!result) {
                        throw Error('Token does not exist');
                    }
                    if (!(result.views === 1)) return [3 /*break*/, 3];
                    return [4 /*yield*/, result.destroy()];
                case 2:
                    _d.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, Model.shares.update({ views: result.views - 1 }, { where: { id: (_b = {}, _b[Op.eq] = result.id, _b) } })];
                case 4:
                    _d.sent();
                    _d.label = 5;
                case 5: return [4 /*yield*/, Model.file.findOne({
                        where: { fileId: (_c = {}, _c[Op.eq] = result.file, _c) }
                    })];
                case 6:
                    file = _d.sent();
                    if (!file) {
                        throw Error('File not found on database, please refresh');
                    }
                    if (file.size > maxAcceptableSize) {
                        throw Error('File too large');
                    }
                    return [2 /*return*/, __assign(__assign({}, result.get({ plain: true })), { fileMeta: file.get({ plain: true }) })];
            }
        });
    }); };
    var GenerateToken = function (user, fileIdInBucket, mnemonic, bucket, encryptionKey, fileToken, isFolder, views) {
        if (isFolder === void 0) { isFolder = false; }
        if (views === void 0) { views = 1; }
        return __awaiter(void 0, void 0, void 0, function () {
            var itemExists, maxAcceptableSize, tree, treeSize, newToken, tokenData, newShare;
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        if (!encryptionKey) {
                            throw Error('Encryption key cannot be empty');
                        }
                        if (encryptionKey.length !== SHARE_TOKEN_LENGTH) {
                            throw Error('Invalid encryption key size');
                        }
                        itemExists = null;
                        if (!(isFolder === 'true')) return [3 /*break*/, 2];
                        return [4 /*yield*/, Model.folder.findOne({ where: { id: (_a = {}, _a[Op.eq] = fileIdInBucket, _a) } })];
                    case 1:
                        // Check if folder exists
                        itemExists = _f.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, Model.file.findOne({ where: { fileId: (_b = {}, _b[Op.eq] = fileIdInBucket, _b), userId: user.id } })];
                    case 3:
                        // Check if file exists
                        itemExists = _f.sent();
                        _f.label = 4;
                    case 4:
                        if (!itemExists) {
                            throw Error('File not found');
                        }
                        maxAcceptableSize = 1024 * 1024 * 1200;
                        if (itemExists.size > maxAcceptableSize) {
                            throw Error('File too large');
                        }
                        if (!(isFolder === 'true')) return [3 /*break*/, 7];
                        return [4 /*yield*/, FolderServiceInstance.GetTree({ email: user.email }, fileIdInBucket)];
                    case 5:
                        tree = _f.sent();
                        if (!tree) {
                            throw Error('Tree not found');
                        }
                        return [4 /*yield*/, FolderServiceInstance.GetTreeSize(tree)];
                    case 6:
                        treeSize = _f.sent();
                        if (treeSize > maxAcceptableSize) {
                            throw Error('File too large');
                        }
                        _f.label = 7;
                    case 7:
                        newToken = crypto.randomBytes(10).toString('hex');
                        return [4 /*yield*/, Model.shares.findOne({ where: { file: (_c = {}, _c[Op.eq] = fileIdInBucket, _c), user: (_d = {}, _d[Op.eq] = user.email, _d) } })];
                    case 8:
                        tokenData = _f.sent();
                        if (tokenData) {
                            // Update token
                            Model.shares.update({
                                token: newToken,
                                mnemonic: mnemonic,
                                isFolder: isFolder,
                                views: views,
                                fileToken: fileToken,
                                encryptionKey: encryptionKey
                            }, { where: { id: (_e = {}, _e[Op.eq] = tokenData.id, _e) } });
                            return [2 /*return*/, newToken];
                        }
                        return [4 /*yield*/, Model.shares.create({
                                token: newToken,
                                mnemonic: mnemonic,
                                encryptionKey: encryptionKey,
                                file: fileIdInBucket, user: user.email,
                                isFolder: isFolder,
                                views: views,
                                bucket: bucket,
                                fileToken: fileToken
                            })];
                    case 9:
                        newShare = _f.sent();
                        return [2 /*return*/, newShare.token];
                }
            });
        });
    };
    var list = function (user) {
        var _a;
        return Model.shares.findAll({
            where: {
                user: user.email,
                mnemonic: (_a = {},
                    _a[Op.eq] = '',
                    _a)
            },
            include: [
                {
                    model: Model.file,
                    as: 'fileInfo',
                    where: { userId: user.id }
                }
            ],
            attributes: ['token', 'file', 'encryptionKey', 'bucket', 'fileToken', 'isFolder', 'views']
        });
    };
    return {
        Name: 'Share',
        get: get,
        list: list,
        GenerateToken: GenerateToken
    };
};
