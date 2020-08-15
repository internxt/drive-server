const sequelize = require('sequelize');

const { Op } = sequelize;

module.exports = (Model, App) => {
  const save = (teamInvitation) => {
    return new Promise((resolve, reject) => {
      Model.team_invitations
        .create({
          id_team: teamInvitation.idTeam,
          user: teamInvitation.user,
          token: teamInvitation.token,
          is_used: false
        }).then((newTeamInvitation) => {
          resolve(newTeamInvitation);
        }).catch((err) => {
          reject(err);
        });
    });
  };

  const remove = (user) => {
    return new Promise((resolve, reject) => {
      Model.team_invitations.destroy({
        where: { 
          user: { [Op.eq]: user }
        }
      }).then(() => {
        resolve();
      }).catch((err) => {
        reject(err);
      });
    });
  }

  const markAsUsed = (teamInvitation) => {
    return new Promise((resolve, reject) => {
      teamInvitation.update({
        is_used: true
      }).then(() => {
        resolve();
      }).catch((err) => {
        reject(err);
      });
    });
  }

  const getByToken = (token) => {
    return new Promise((resolve, reject) => {
      Model.team_invitations
        .findOne({
          where: {
            token: { [Op.eq]: token },
            is_used: { [Op.eq]: false }
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
  }

  return {
    Name: 'TeamInvitations',
    save,
    remove,
    getByToken,
    markAsUsed
  };
};