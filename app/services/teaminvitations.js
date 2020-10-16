const sequelize = require('sequelize');

const { Op } = sequelize;

module.exports = (Model, App) => {
  const save = (teamInvitation) => new Promise((resolve, reject) => {
    Model.team_invitations
      .create({
        id_team: teamInvitation.idTeam,
        user: teamInvitation.user,
        token: teamInvitation.token
      })
      .then((newTeamInvitation) => {
        resolve(newTeamInvitation);
      })
      .catch((err) => {
        reject(err);
      });
  });

  const remove = (user) => new Promise((resolve, reject) => {
    Model.team_invitations
      .destroy({
        where: {
          user: { [Op.eq]: user }
        }
      })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  });

  // NOT NECESSARY, COLUMN DELETED
  const markAsUsed = (teamInvitation) => new Promise((resolve, reject) => {
    teamInvitation
      .update({})
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  });

  const getByToken = (token) => new Promise((resolve, reject) => {
    Model.team_invitations
      .findOne({
        where: {
          token: { [Op.eq]: token }
        }
      })
      .then((teamInvitation) => {
        if (teamInvitation) {
          resolve(teamInvitation);
        } else {
          reject('team invitation does not exists');
        }
      })
      .catch((err) => {
        reject('Error querying database');
      });
  });

  return {
    Name: 'TeamInvitations',
    save,
    remove,
    getByToken,
    markAsUsed
  };
};
