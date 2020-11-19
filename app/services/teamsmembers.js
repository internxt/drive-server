const crypto = require('crypto');

const async = require('async');
const sequelize = require('sequelize');
const fetch = require('node-fetch');
const InternxtMailer = require('storj-service-mailer');
const teams_members = require('./../models/teams_members');
const teams = require('./../routes/teams');


const { Op } = sequelize;

module.exports = (Model, App) => {
  const CryptService = require('./crypt')(Model, App);

  const remove = (members, idTeam) => {
    return new Promise((resolve, reject) => {
      async.eachSeries(members, (member, next) => {
        if (member) {
          Model.teams_members.destroy({
              where: {
                user: { [Op.eq]: member },
                id_team: { [Op.eq]: idTeam }
              }
            }).then((removedTeamMember) => {
              next();
            }).catch((err) => {
              next('Unable to create new teams members on db');
            });
        } else {
          next();
        }
      },
        (err) => {
          err ? reject(err) : resolve();
        }
      );
    });
  };

  const update = (props) => {
    return new Promise((resolve, reject) => {
      Model.teams_members.findOne({
          where: {
            user: { [Op.eq]: props.user },
            id_team: { [Op.eq]: props.id_team }
          }
        }).then((teamMember) => {
          teamMember.update({}).then((teamMember) => {
              resolve(teamMember);
            }).catch((err) => {
              reject(err);
            });
        }).catch((err) => {
        }).then((teamMember) => {
          teamMember.update({
          }).then((teamMember) => {
            resolve(teamMember);
          }).catch((err) => {
            reject(err);
          });
        }).catch((err) => {
          reject(err);
        });
    });
  }

  const getMembersByIdTeam = (idTeam) => {
    return new Promise((resolve, reject) => {
      Model.teams_members.findAll({
          where: {
            id_team: { [Op.eq]: idTeam }
          }
        }).then((teamMembers) => {
          if (teamMembers) {
            resolve(teamMembers);
          } else {
            reject('Team members does not exists');
          }
        }).catch((err) => {
          console.error(err);
          reject('Error querying database');
        });
    });
  };

  const getMemberByIdTeam = (idTeam,email) => {
    return new Promise((resolve, reject) => {
    return Model.teams_members.findOne({
      where: {
      id_team: { [Op.eq]: idTeam },
      user: { [Op.eq]: email},
    }
  }).then((member) => {
    if (member) {
      resolve(member);
    } else {
      reject('Team member does not exist');
    }
  }).catch((err) => {
    console.error(err);
    reject('Error querying database');
  });
});
};


  const addTeamMember = (idTeam, userEmail,bridge_password,bridge_mnemonic) => {
    return new Promise((resolve, reject) => {
      Model.teams_members.findOne({
        where: {
          id_team: { [Op.eq]: idTeam },
          user: { [Op.eq]: userEmail },
        }
      }).then((teamMember) => {
        console.log(teamMember)
        if (teamMember) {
          reject();
        }
        Model.teams_members.create({
          id_team: idTeam,
          user: userEmail,
          bridge_password: bridge_password,
          bridge_mnemonic: bridge_mnemonic
        }).then((newMember) => { 
          resolve(newMember);
        }).catch(reject);
      }).catch(reject);
    })
  }

  const saveMembersFromInvitations = (invitedMembers) => {
    return new Promise((resolve, reject) => {
      Model.teams_members.findOne({
          where: {
            user: { [Op.eq]: invitedMembers.user },
            id_team: { [Op.eq]: invitedMembers.id_team },
            bridge_password: { [Op.eq]: invitedMembers.bridge_password },
            bridge_mnemonic: { [Op.eq]: invitedMembers.bridge_mnemonic }
          }
        }).then((teamMember) => {
          if (teamMember) {
            reject();
          }
          Model.teams_members.create({
            id_team: invitedMembers.id_team,
            user: invitedMembers.user,
            bridge_password: invitedMembers.bridge_password ,
            bridge_mnemonic: invitedMembers.bridge_mnemonic 
          }).then((newMember) => {
            resolve(newMember)
          }).catch((err) => {
            reject(err);
          })
        }).catch((err) => {
          reject(err);
        });
    });
  };

  return {
    Name: 'TeamsMembers',
    remove,
    getMembersByIdTeam,
    addTeamMember,
    saveMembersFromInvitations,
    update,
    getMemberByIdTeam
  };
};
