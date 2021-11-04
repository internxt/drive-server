"use strict";
var sequelize = require('sequelize');
var Op = sequelize.Op;
module.exports = function (Model) {
    var save = function (teamInvitation) { return new Promise(function (resolve, reject) {
        Model.teamsinvitations
            .create({
            id_team: teamInvitation.id_team,
            user: teamInvitation.user,
            token: teamInvitation.token,
            bridge_password: teamInvitation.bridge_password,
            mnemonic: teamInvitation.mnemonic
        }).then(function (newTeamInvitation) {
            resolve({ teamInvitation: newTeamInvitation });
        }).catch(function (err) {
            reject(err);
        });
    }); };
    var getByToken = function (token) {
        var _a;
        return Model.teamsinvitations.findOne({ where: { token: (_a = {}, _a[Op.eq] = token, _a) } });
    };
    var getTeamInvitationById = function (idInvitation) {
        var _a;
        return Model.teamsinvitations.findOne({ where: { id: (_a = {}, _a[Op.eq] = idInvitation, _a) } });
    };
    var getTeamInvitationByUser = function (user) { return new Promise(function (resolve, reject) {
        var _a;
        Model.teamsinvitations.findOne({
            where: { user: (_a = {}, _a[Op.eq] = user, _a) }
        }).then(function (teaminvitations) {
            resolve(teaminvitations);
        }).catch(function () {
            reject(Error('Error querying database'));
        });
    }); };
    var removeInvitations = function (userInvitation) {
        var _a;
        return Model.teamsinvitations.destroy({ where: { user: (_a = {}, _a[Op.eq] = userInvitation, _a) } });
    };
    return {
        Name: 'TeamInvitations',
        save: save,
        getByToken: getByToken,
        getTeamInvitationByUser: getTeamInvitationByUser,
        getTeamInvitationById: getTeamInvitationById,
        removeInvitations: removeInvitations
    };
};
