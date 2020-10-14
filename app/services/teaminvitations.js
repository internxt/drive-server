const sequelize = require('sequelize');
const user = require('~models/user');
const teamInvitations = require('~routes/teamInvitations');


const { Op } = sequelize;

module.exports = (Model, App) => {
  
  const save = (teamInvitation) => {
    return new Promise((resolve, reject) => {
      Model.team_invitations
        .create({
          id_team: teamInvitation.id_team,
          user: teamInvitation.user,
          token: teamInvitation.token,
        }).then((newTeamInvitation) => {
          resolve({teamInvitation: newTeamInvitation});
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
  const createInvitationsTeams = (teamInvitation) => {
    return new Promise((resolve, reject) => {
      Model.teaminvitations
        .create({
          id_team: teamInvitation.idTeam,
          user: teamInvitation.user,
          token: teamInvitation.token,
         
        }).then((newTeamInvitation) => {
          resolve({teamInvitation: newTeamInvitation});
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

  const getTeamInvitationById = (id_team) => {
    return new Promise((resolve, reject) => {
      Model.team_invitations
        .findOne({
          where: { id_team: { [Op.eq]: id_team } },
        })
        .then((team_invitations) => {
          if (team_invitations) {
            resolve(team_invitations);
          } else {
            reject('team does not exists');
          }
        })
        .catch((err) => {
          console.error(err);
          reject('Error querying database');
        });
    });
  }

  const getTeamInvitationByIdUser = (user) => {
    return new Promise((resolve, reject) => {
      Model.team_invitations
        .findOne({
          where: { user: { [Op.eq]: user } },
        })
        .then((team_invitations) => {
          if (team_invitations) {
            resolve(team_invitations);
          } else {
            reject('team does not exists');
          }
        })
        .catch((err) => {
          console.error(err);
          reject('Error querying database');
        });
    });
  }

  const FindTeamByEmail = (email) => {
    return new Promise((resolve, reject) => {
      Model.Team
        .findOne({ where: { bridge_user: { [Op.eq]: email } } })
        .then((userData) => {
          if (userData) {
            const user = userData.dataValues;
            if (user.token) user.token = user.token.toString();

            resolve(user);
          } else {
            reject('User not found on X Cloud database');
          }
        })
        .catch((err) => reject(err));
    });
  };

  const FindUserByToken= (token) => {
    return Model.teamInvitations.findOne({ where: {token: { [Op.eq]: token } } })
  }


  
  return {
    Name: 'TeamInvitations',
    save,
    remove,
    getByToken,
    getTeamInvitationByIdUser,
    getTeamInvitationById,
    FindTeamByEmail,
    FindUserByToken,
    createInvitationsTeams 
   
  };
};