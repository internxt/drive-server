const sequelize = require('sequelize');
const user = require('../models/user');



const { Op } = sequelize;

module.exports = (Model, App) => {

    const save = (teamInvitation) => {
        return new Promise((resolve, reject) => {
            Model.team_invitations
                .create({
                    id_team: teamInvitation.id_team,
                    user: teamInvitation.user,
                    token: teamInvitation.token,
                    bridge_password: teamInvitation.bridge_password,
                    mnemonic: teamInvitation.mnemonic
                }).then((newTeamInvitation) => {
                    resolve({ teamInvitation: newTeamInvitation });
                }).catch((err) => {
                    reject(err);
                });
        });
    };


    const getByToken = (token) => {
        return new Promise((resolve, reject) => {
            Model.team_invitations
                .findOne({
                    where: {
                        token: { [Op.eq]: token },
                    }
                })
                .then((teamInvitation) => {
                    resolve(teamInvitation);
                })
                .catch((err) => {
                    reject('Error querying database');
                });
        });
    };

    const getTeamInvitationById = (idInvitation) => {
        return new Promise((resolve, reject) => {
            Model.team_invitations
                .findOne({
                    where: { id: { [Op.eq]: idInvitation } },
                })
                .then((invitation) => {
                    resolve(invitation);
                })
                .catch((err) => {
                    console.error(err);
                    reject('Error querying database');
                });
        });
    };

    const getTeamInvitationByUser = (user) => {
        return new Promise((resolve, reject) => {
            Model.team_invitations
                .findOne({
                    where: { user: { [Op.eq]: user } },
                })
                .then((teaminvitations) => {
                    resolve(teaminvitations);
                })
                .catch((err) => {
                    reject('Error querying database');
                });
        });
    };


    const removeInvitations = (userInvitation) => {
        return new Promise((resolve, reject) => {
            Model.team_invitations.destroy({
                where: {
                    user: { [Op.eq]: userInvitation },
                }
            }).then((removedInvitation) => {
                resolve(removedInvitation);
            }).catch((err) => {
                reject(err);
            });

        });
    };


    return {
        Name: 'TeamInvitations',
        save,
        getByToken,
        getTeamInvitationByUser,
        getTeamInvitationById,
        removeInvitations,

    };
};
