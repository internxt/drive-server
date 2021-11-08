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
    var removeMembers = function (member) {
        var _a;
        return Model.teamsmembers.destroy({ where: { user: (_a = {}, _a[Op.eq] = member, _a) } });
    };
    var getTeamsAdminById = function (idTeam) {
        var _a;
        return Model.teams.findOne({ where: { id: (_a = {}, _a[Op.eq] = idTeam, _a) } });
    };
    var getMembersByIdTeam = function (idTeam) {
        var _a;
        return Model.teamsmembers.findAll({ where: { id_team: (_a = {}, _a[Op.eq] = idTeam, _a) } });
    };
    var getInvitationsByIdTeam = function (idTeam) {
        var _a;
        return Model.teamsinvitations.findAll({ where: { id_team: (_a = {}, _a[Op.eq] = idTeam, _a) } });
    };
    var getPeople = function (idTeam) { return __awaiter(void 0, void 0, void 0, function () {
        var result, members, invitations;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    result = [];
                    return [4 /*yield*/, getMembersByIdTeam(idTeam)];
                case 1:
                    members = _a.sent();
                    return [4 /*yield*/, getInvitationsByIdTeam(idTeam)];
                case 2:
                    invitations = _a.sent();
                    members.forEach(function (m) { return result.push({ isMember: true, isInvitation: false, user: m.user }); });
                    invitations.forEach(function (m) { return result.push({ isMember: false, isInvitation: true, user: m.user }); });
                    return [2 /*return*/, result];
            }
        });
    }); };
    var getMemberByIdTeam = function (idTeam, email) {
        var _a, _b;
        return Model.teamsmembers.findOne({
            where: {
                id_team: (_a = {}, _a[Op.eq] = idTeam, _a),
                user: (_b = {}, _b[Op.eq] = email, _b)
            }
        });
    };
    var addTeamMember = function (idTeam, userEmail, bridgePassword, bridgeMnemonic) {
        var _a, _b;
        return Model.teamsmembers.findOne({
            where: {
                id_team: (_a = {}, _a[Op.eq] = idTeam, _a),
                user: (_b = {}, _b[Op.eq] = userEmail, _b)
            }
        }).then(function (teamMember) { return (teamMember ? null : Model.teamsmembers.create({
            id_team: idTeam,
            user: userEmail,
            bridge_password: bridgePassword,
            bridge_mnemonic: bridgeMnemonic
        })); });
    };
    var saveMembersFromInvitations = function (invitedMembers) { return new Promise(function (resolve, reject) {
        var _a, _b, _c, _d;
        Model.teamsmembers.findOne({
            where: {
                user: (_a = {}, _a[Op.eq] = invitedMembers.user, _a),
                id_team: (_b = {}, _b[Op.eq] = invitedMembers.id_team, _b),
                bridge_password: (_c = {}, _c[Op.eq] = invitedMembers.bridge_password, _c),
                bridge_mnemonic: (_d = {}, _d[Op.eq] = invitedMembers.bridge_mnemonic, _d)
            }
        }).then(function (teamMember) {
            if (teamMember) {
                reject();
            }
            Model.teamsmembers.create({
                id_team: invitedMembers.id_team,
                user: invitedMembers.user,
                bridge_password: invitedMembers.bridge_password,
                bridge_mnemonic: invitedMembers.bridge_mnemonic
            }).then(function (newMember) {
                resolve(newMember);
            }).catch(function (err) {
                reject(err);
            });
        }).catch(function (err) {
            reject(err);
        });
    }); };
    return {
        Name: 'TeamsMembers',
        getMembersByIdTeam: getMembersByIdTeam,
        addTeamMember: addTeamMember,
        saveMembersFromInvitations: saveMembersFromInvitations,
        getMemberByIdTeam: getMemberByIdTeam,
        getInvitationsByIdTeam: getInvitationsByIdTeam,
        getPeople: getPeople,
        removeMembers: removeMembers,
        getTeamsAdminById: getTeamsAdminById
    };
};
