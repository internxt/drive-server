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



  const save = (members, oldMembers, team) => {
    var membersDiff = members.filter(x => !oldMembers.includes(x));
    return new Promise((resolve, reject) => {
      async.eachSeries(
        membersDiff, (member, next) => {
          if (member) {
            console.log(team.id);
            Model.teams_members.create({
                id_team: team.id,
                user: member
              }).then((newTeamMember) => {
                let token = `${member};${team.id};${new Date().toISOString().split('.')[0].replace(/[-:T]/g, '')}`;
                let cryptedToken = CryptService.encryptText(token, process.env.CRYPTO_KEY);

                TeamInvitationsService.save({
                  idTeam: team.id,
                  user: member,
                  token: cryptedToken
                }).then((teaminvitations) => {
                  sendEmailTeamsMember(member, cryptedToken, team.Name).then((email) => {
                    console.log("[ TEAMS ] Team %d activation email sent to %s", team.id, email);
                  }).catch((err) => {
                    console.log(err);
                  });
                }).catch((err) => {
                  console.log(err);
                });

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


  const addTeamMember = (idTeam, userEmail) => {
    return new Promise((resolve, reject) => {
      console.log("TEAM ID: ", idTeam);
      console.log("TEAM ADMIN: ", userEmail)
      
      Model.teams_members.findOne({
        where: {
          id_team: { [Op.eq]: idTeam },
          user: { [Op.eq]: userEmail },
          bridge_password: { [Op.eq]: invitedMembers.bridge_password },
          bridge_mnemonic: { [Op.eq]: invitedMembers.bridge_mnemonic }
        }
      }).then((teamMember) => {
        if (teamMember) {
          reject();
        }

        Model.teams_members.create({
          id_team: idTeam,
          user: userEmail
        }).then((newMember) => {
          console.log("NUEVO TEAM MEMBER AÑADIDO", newMember);
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
    save,
    remove,
    getMembersByIdTeam,
    addTeamMember,
    saveMembersFromInvitations,
    update
  };
};
