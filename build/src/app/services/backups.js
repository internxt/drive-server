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
var Op = sequelize.Op, fn = sequelize.fn, col = sequelize.col;
module.exports = function (Model, App) {
    var getDevice = function (userId, mac) { return __awaiter(void 0, void 0, void 0, function () {
        var device, err;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Model.device.findOne({ where: { mac: mac, userId: userId } })];
                case 1:
                    device = _a.sent();
                    if (!device) {
                        err = new Error('This user didnt register this device');
                        err.name = 'NOT_FOUND';
                        throw err;
                    }
                    return [2 /*return*/, device];
            }
        });
    }); };
    var getAllDevices = function (userId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, Model.device.findAll({
                    where: { userId: userId },
                    attributes: { include: [[fn('SUM', col('backups.size')), 'size']] },
                    group: ['id'],
                    include: [{ model: Model.backup, attributes: ['size'] }]
                })];
        });
    }); };
    var createDevice = function (userId, mac, deviceName, platform) { return __awaiter(void 0, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, getDevice(userId, mac)];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    err_1 = _a.sent();
                    if (err_1.name === 'NOT_FOUND') {
                        return [2 /*return*/, Model.device.create({
                                mac: mac,
                                userId: userId,
                                name: deviceName,
                                platform: platform
                            })];
                    }
                    throw err_1;
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var updateDevice = function (userId, deviceId, deviceName) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, Model.device.update({ name: deviceName }, { where: { id: deviceId, userId: userId } })];
        });
    }); };
    var activate = function (userData) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, Inxt, User, Plan, backupsBucket, plan, limit;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = App.services, Inxt = _a.Inxt, User = _a.User, Plan = _a.Plan;
                    return [4 /*yield*/, User.FindUserObjByEmail(userData.email)];
                case 1:
                    backupsBucket = (_c.sent()).backupsBucket;
                    return [4 /*yield*/, Plan.getByUserId(userData.id)];
                case 2:
                    plan = _c.sent();
                    limit = -1;
                    if (!!backupsBucket) return [3 /*break*/, 5];
                    return [4 /*yield*/, Inxt.CreateBucket(userData.email, userData.userId, userData.mnemonic)];
                case 3:
                    // TODO: Remove mnemonic from here
                    backupsBucket = (_c.sent()).id;
                    return [4 /*yield*/, Model.users.update({ backupsBucket: backupsBucket }, { where: { username: (_b = {}, _b[Op.eq] = userData.email, _b) } })];
                case 4:
                    _c.sent();
                    _c.label = 5;
                case 5:
                    if (plan && plan.type === 'one_time') {
                        limit = 10 * 1024 * 1024 * 1024;
                    }
                    return [2 /*return*/, Inxt.updateBucketLimit(backupsBucket, limit)];
            }
        });
    }); };
    var create = function (_a) {
        var userId = _a.userId, path = _a.path, deviceId = _a.deviceId, encryptVersion = _a.encryptVersion, interval = _a.interval, enabled = _a.enabled;
        return __awaiter(void 0, void 0, void 0, function () {
            var backupsBucket, device;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Model.users.findOne({ where: { id: userId } })];
                    case 1:
                        backupsBucket = (_b.sent()).backupsBucket;
                        if (!backupsBucket)
                            throw new Error('Backups must be activated before creating one');
                        device = Model.device.findOne({ where: { id: deviceId, userId: userId } });
                        if (!device)
                            throw new Error('This user didnt register this device');
                        return [2 /*return*/, Model.backup.create({
                                path: path,
                                encrypt_version: encryptVersion,
                                deviceId: deviceId,
                                bucket: backupsBucket,
                                interval: interval,
                                userId: userId,
                                enabled: enabled
                            })];
                }
            });
        });
    };
    var getAll = function (userId, mac) { return __awaiter(void 0, void 0, void 0, function () {
        var device;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Model.device.findOne({ where: { mac: mac, userId: userId } })];
                case 1:
                    device = _a.sent();
                    if (!device)
                        throw new Error('This user didnt register this device');
                    return [2 /*return*/, Model.backup.findAll({ where: { deviceId: device.id } })];
            }
        });
    }); };
    var deleteOne = function (user, id) { return __awaiter(void 0, void 0, void 0, function () {
        var backup, fileId, bucket;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Model.backup.findOne({ where: { id: id, userId: user.id } })];
                case 1:
                    backup = _a.sent();
                    if (!backup)
                        throw new Error("This user does not have a backup with id " + id);
                    fileId = backup.fileId, bucket = backup.bucket;
                    if (!fileId) return [3 /*break*/, 3];
                    return [4 /*yield*/, App.services.Inxt.DeleteFile(user, bucket, fileId)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/, backup.destroy()];
            }
        });
    }); };
    var updateOne = function (userId, id, data) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, Model.backup.update(data, { where: { userId: userId, id: id } })];
        });
    }); };
    var updateManyOfDevice = function (userId, deviceId, data) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, Model.backup.update(data, { where: { userId: userId, deviceId: deviceId } })];
        });
    }); };
    var getByUserId = function (userId) {
        return Model.backup.findOne({ where: { userId: userId } });
    };
    return {
        Name: 'Backup',
        activate: activate,
        create: create,
        getAll: getAll,
        getByUserId: getByUserId,
        deleteOne: deleteOne,
        updateOne: updateOne,
        getDevice: getDevice,
        getAllDevices: getAllDevices,
        createDevice: createDevice,
        updateDevice: updateDevice,
        updateManyOfDevice: updateManyOfDevice
    };
};
