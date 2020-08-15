const crypto = require('crypto');
const async = require('async');
const sequelize = require('sequelize');
const fetch = require('node-fetch');
const InternxtMailer = require('storj-service-mailer');
const teaminvitations = require('./teaminvitations');

const { Op } = sequelize;

module.exports = (Model, App) => {
  const CryptService = require('./crypt')(Model, App);
  const TeamInvitationsService = require('./teaminvitations')(Model, App);

  const getByUser = (user) => {
    return new Promise((resolve, reject) => {
      Model.teams_members
        .findOne({
          where: {
            user: { [Op.eq]: user },
            is_active: { [Op.eq]: true }
          }
        })
        .then((teamMember) => {
          if (teamMember) {
            resolve(teamMember);
          } else {
            reject('teams members does not exists');
          }
        })
        .catch((err) => {
          console.error(err);
          reject('Error querying database');
        });
    });
  }

  const remove = (members, idTeam) => {
    return new Promise((resolve, reject) => {
      async.eachSeries(members, (member, next) => {
        if (member) {
          Model.teams_members.destroy({
            where: { 
              user: { [Op.eq]: member },
              id_team: { [Op.eq]: idTeam }
            }
          })
          .then((removedTeamMember) => {
            next();
          })
          .catch((err) => {
            next('Unable to create new teams members on db');
          });
        } else {
          next();
        }
      }, (err) => {
          err ? reject(err) : resolve();
      });
    });
  }

  const update = (props) => {
    return new Promise((resolve, reject) => {
      
      Model.teams_members
      .findOne({
        where: {
          user: { [Op.eq]: props.user },
          id_team: { [Op.eq]: props.id_team }
        }
      }).then((teamMember) => {
        teamMember.update({
          is_active: true
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
      async.eachSeries(membersDiff, (member, next) => {
          if (member) {
            Model.teams_members
                .create({
                  id_team: team.id,
                  user: member,
                  is_active: false
                })
                .then((newTeamMember) => {
                  let token = `${member};${team.id};${new Date().toISOString().split('.')[0].replace(/[-:T]/g, '')}`;
                  let cryptedToken = CryptService.encryptText(token, process.env.CRYPTO_KEY);

                  TeamInvitationsService.save({
                    idTeam: team.id,
                    user: member,
                    token: cryptedToken
                  }).then((teamInvitation) => {
                    sendActivationEmail(member, {
                      memberName: 'Xalito',
                      teamName: team.name,
                      urlAcceptInvitation: `${process.env.HOST_DRIVE_WEB}/teams/join/${cryptedToken}`
                    }).then((email) => {
                      console.log(email);
                    }).catch((err) => {
                      console.log(err);
                    });

                  }).catch((err) => {
                    console.log(err);
                  });

                  next();
                })
                .catch((err) => {
                  next('Unable to create new teams members on db');
                });
          } else {
            next();
          }
        }, (err) => {
            err ? reject(err) : resolve();
        });
    });
  }

  const getByIdTeam = (idTeam) => {
    return new Promise((resolve, reject) => {
      Model.teams_members
        .findAll({
          where: {
            id_team: { [Op.eq]: idTeam },
            is_active: { [Op.eq]: true }
          }
        })
        .then((teamMembers) => {
          if (teamMembers) {
            resolve(teamMembers);
          } else {
            reject('team members does not exists');
          }
        })
        .catch((err) => {
          console.error(err);
          reject('Error querying database');
        });
    });
  }

  const sendActivationEmail = (emailTo, mailProps) => {
    return new Promise((resolve, reject) => {
      const mailer = new InternxtMailer({
        host: process.env.STORJ_MAILER_HOST,
        port: process.env.STORJ_MAILER_PORT,
        secure: true,
        auth: {
          user: process.env.STORJ_MAILER_USERNAME,
          pass: process.env.STORJ_MAILER_PASSWORD,
        },
        from: 'hello@internxt.com',
      });

      mailer.dispatch(emailTo, 'join-team', mailProps, (err) => {   
        if (!err) {
          resolve(`Mail team's invitation send to ${emailTo}!`);
        } else {
          reject(`Error sending mail team's invitation to ${emailTo}`);
        }
      });
    });
  }

  return {
    Name: 'TeamsMembers',
    save,
    remove,
    update,
    getByUser,
    getByIdTeam
  };
};