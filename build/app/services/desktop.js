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
var Op = sequelize.Op;
module.exports = function (Model) {
    var CreateChildren = function (user, folders) { return __awaiter(void 0, void 0, void 0, function () {
        var newFolders, existsParentFolder, exists, result, foldersCreated;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    newFolders = [];
                    return [4 /*yield*/, Model.folder.findAll({
                            where: {
                                id: (_a = {}, _a[Op.in] = Object.keys(folders), _a),
                                user_id: (_b = {}, _b[Op.eq] = user.id, _b)
                            }
                        })];
                case 1:
                    existsParentFolder = _e.sent();
                    existsParentFolder.forEach(function (folder) {
                        newFolders = newFolders.concat(folders[folder.dataValues.id].map(function (encryptedName) { return [encryptedName, folder.dataValues.id]; }));
                    });
                    return [4 /*yield*/, Model.folder.findAll({
                            attributes: ['id', 'name', 'parentId', 'createdAt', 'updatedAt'],
                            where: {
                                user_id: (_c = {}, _c[Op.eq] = user.id, _c),
                                name: (_d = {}, _d[Op.in] = newFolders.map(function (_a) {
                                    var encryptedName = _a[0];
                                    return encryptedName;
                                }), _d)
                            }
                        })];
                case 2:
                    exists = _e.sent();
                    exists.forEach(function (folder) {
                        exists[folder.dataValues.name] = folder.dataValues;
                    });
                    result = [];
                    if (exists) {
                        // TODO: If the folder already exists,
                        // return the folder data to make desktop
                        // incorporate new info to its database
                        newFolders = newFolders.filter(function (_a) {
                            var cryptoName = _a[0];
                            if (exists[cryptoName]) {
                                result.push(exists[cryptoName]);
                                return false;
                            }
                            return true;
                        });
                    }
                    return [4 /*yield*/, Model.folder.bulkCreate(newFolders.map(function (_a) {
                            var cryptoName = _a[0], parentFolderId = _a[1];
                            return {
                                name: cryptoName,
                                bucket: null,
                                parentId: parentFolderId || null,
                                user_id: user.id,
                                encrypt_version: '03-aes'
                            };
                        }), { returning: true, individualHooks: true })];
                case 3:
                    foldersCreated = _e.sent();
                    foldersCreated.forEach(function (folder) {
                        result.push(folder);
                    });
                    return [2 /*return*/, result];
            }
        });
    }); };
    return {
        Name: 'Desktop',
        CreateChildren: CreateChildren
    };
};
