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
var axios = require('axios');
var bcrypt = require('bcryptjs');
var crypto = require('crypto');
var Op = sequelize.Op;
module.exports = function (Model) {
    var create = function (team) { return Model.teams.create({
        admin: team.admin,
        name: team.name,
        bridge_user: team.bridge_user,
        bridge_password: team.bridge_password,
        bridge_mnemonic: team.bridge_mnemonic
    }).then(function (newTeam) { return newTeam.dataValues; }); };
    var getTeamByEmail = function (user) {
        var _a;
        return Model.teams.findOne({ where: { admin: (_a = {}, _a[Op.eq] = user, _a) } });
    };
    var getTeamById = function (idTeam) {
        var _a;
        return Model.teams.findOne({ where: { id: (_a = {}, _a[Op.eq] = idTeam, _a) } });
    };
    var randomEmailBridgeUserTeam = function () {
        var rnd = crypto.randomBytes(8).toString('hex');
        var newEmail = rnd + "-team@internxt.com";
        var passwd = bcrypt.hashSync(newEmail, 8);
        return {
            bridge_user: newEmail,
            password: passwd
        };
    };
    var getIdTeamByUser = function (user) {
        var _a;
        return Model.teamsmembers.findOne({ where: { user: (_a = {}, _a[Op.eq] = user, _a) } });
    };
    var getTeamBridgeUser = function (user) {
        var _a;
        return Model.teams.findOne({
            where: { bridge_user: (_a = {}, _a[Op.eq] = user, _a) }
        });
    };
    var getTeamByMember = function (email) { return getIdTeamByUser(email).then(function (team) { return (!team ? Promise.resolve() : getTeamById(team.id_team)); }); };
    var ApplyLicenseTeams = function (user, size) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, GATEWAY_USER, GATEWAY_PASS;
        return __generator(this, function (_b) {
            _a = process.env, GATEWAY_USER = _a.GATEWAY_USER, GATEWAY_PASS = _a.GATEWAY_PASS;
            return [2 /*return*/, axios.post(process.env.STORJ_BRIDGE + "/gateway/upgrade", {
                    email: user, bytes: size
                }, {
                    headers: { 'Content-Type': 'application/json' },
                    auth: { username: GATEWAY_USER, password: GATEWAY_PASS }
                })];
        });
    }); };
    return {
        Name: 'Team',
        create: create,
        getTeamByEmail: getTeamByEmail,
        getTeamById: getTeamById,
        randomEmailBridgeUserTeam: randomEmailBridgeUserTeam,
        getIdTeamByUser: getIdTeamByUser,
        getTeamByMember: getTeamByMember,
        getTeamBridgeUser: getTeamBridgeUser,
        ApplyLicenseTeams: ApplyLicenseTeams
    };
};
