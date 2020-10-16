const crypto = require('crypto');

const async = require('async');
const sequelize = require('sequelize');
const fetch = require('node-fetch');
const InternxtMailer = require('storj-service-mailer');


const { Op } = sequelize;

module.exports = (Model, App) => {
  const CryptService = require('./crypt')(Model, App);
  const TeamInvitationsService = require('./teaminvitations')(Model, App);

  

  const remove = (members, idTeam) => new Promise((resolve, reject) => {
    async.eachSeries(
      members,
      (member, next) => {
        if (member) {
          Model.teams_members
            .destroy({
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
      },
      (err) => {
        err ? reject(err) : resolve();
      }
    );
  });

  const update = (props) => new Promise((resolve, reject) => {
    Model.teams_members
      .findOne({
        where: {
          user: { [Op.eq]: props.user },
          id_team: { [Op.eq]: props.id_team }
        }
      })
      .then((teamMember) => {
        teamMember
          .update({})
          .then((teamMember) => {
            resolve(teamMember);
          })
          .catch((err) => {
            reject(err);
          });
      })
      .catch((err) => {
        reject(err);
      });
  });

  const save = (members, oldMembers, team) => {
    const membersDiff = members.filter((x) => !oldMembers.includes(x));

    return new Promise((resolve, reject) => {
      async.eachSeries(
        membersDiff,
        (member, next) => {
          if (member) {
            Model.teams_members
              .create({
                id_team: team.id,
                user: member
              })
              .then((newTeamMember) => {
                const token = `${member};${
                  team.id
                };${new Date()
                  .toISOString()
                  .split('.')[0]
                  .replace(/[-:T]/g, '')}`;
                const cryptedToken = CryptService.encryptText(
                  token,
                  process.env.CRYPTO_KEY
                );

                TeamInvitationsService.save({
                  idTeam: team.id,
                  user: member,
                  token: cryptedToken
                })
                  .then((teamInvitation) => {
                    sendActivationEmail(member, cryptedToken, team.Name)
                      .then((email) => {
                        console.log(
                          '[ TEAMS ] Team %d activation email sent to %s',
                          team.id,
                          email
                        );
                      })
                      .catch((err) => {
                        console.log(err);
                      });
                  })
                  .catch((err) => {
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
        },
        (err) => {
          err ? reject(err) : resolve();
        }
      );
    });
  };

  const getMembersByIdTeam = (idTeam) => new Promise((resolve, reject) => {
    Model.teams_members
      .findAll({
        where: {
          id_team: { [Op.eq]: idTeam }
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

  const sendActivationEmail = (member, cryptedToken, teamName) => {
    const mailer = new InternxtMailer({
      host: process.env.STORJ_MAILER_HOST,
      port: process.env.STORJ_MAILER_PORT,
      secure:
        process.env.NODE_ENV === 'staging'
        || process.env.NODE_ENV === 'production',
      auth: {
        user: process.env.STORJ_MAILER_USERNAME,
        pass: process.env.STORJ_MAILER_PASSWORD
      },
      from: 'hello@internxt.com'
    });

    return new Promise((resolve, reject) => {
      mailer.dispatch(
        member,
        'join-team',
        {
          template: 'join-team',
          go: { in: 'here' },
          memberName: member,
          teamName,
          urlAcceptInvitation: `${process.env.HOST_DRIVE_WEB}/teams/join/${cryptedToken}`
        },
        (err) => {
          if (!err) {
            resolve(`Mail team's invitation send to ${member}!`);
            Logger.info('Teams: Team invitation mail sent to', member);
          } else {
            reject(`Error sending mail team's invitation to ${member}`);
          }
        }
      );
    });
  };

  const addTeamMember = (idTeam, userEmail) => new Promise((resolve, reject) => {
    console.log("TEAM ID: ", idTeam);
    console.log("TEAM ADMIN: ", userEmail)
    Model.teams_members
      .findOne({
        where: {          
          id_team: { [Op.eq]: idTeam },
          user: { [Op.eq]: userEmail }
        }
      })
      .then((teamMember) => {
        if (teamMember) {
          reject();
        }

        Model.teams_members
          .create({
            id_team: idTeam,
            user: userEmail
          })
          .then((newMember) => {
            console.log("NUEVO TEAM MEMBER AÑADIDO", newMember);
            resolve(newMember);
          })
          .catch((err) => {
            reject(err);
          });
      })
      .catch((err) => {
        reject(err);
      });
  });

  return {
    Name: 'TeamsMembers',
    save,
    remove,
    update,
    getMembersByIdTeam,
    addTeamMember
  };
};
