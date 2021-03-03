const sequelize = require('sequelize');

const { Op } = sequelize;

module.exports = (Model) => {
  const save = (teamInvitation) => new Promise((resolve, reject) => {
    Model.teamsinvitations
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

  const getByToken = (token) => Model.teamsinvitations.findOne({ where: { token: { [Op.eq]: token } } });

  const getTeamInvitationById = (idInvitation) => Model.teamsinvitations.findOne({ where: { id: { [Op.eq]: idInvitation } } });

  const getTeamInvitationByUser = (user) => new Promise((resolve, reject) => {
    Model.teamsinvitations.findOne({
      where: { user: { [Op.eq]: user } }
    }).then((teaminvitations) => {
      resolve(teaminvitations);
    }).catch(() => {
      reject(Error('Error querying database'));
    });
  });

  const removeInvitations = (userInvitation) => Model.teamsinvitations.destroy({ where: { user: { [Op.eq]: userInvitation } } });

  return {
    Name: 'TeamInvitations',
    save,
    getByToken,
    getTeamInvitationByUser,
    getTeamInvitationById,
    removeInvitations
  };
};
