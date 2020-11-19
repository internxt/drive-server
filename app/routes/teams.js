
const { passportAuth } = require('../middleware/passport');
const team = require('./../services/team');
const crypto = require('crypto');
const AesUtil = require('../../lib/AesUtil');
const openpgp = require('openpgp');
const sgMail = require('@sendgrid/mail');
const speakeasy = require('speakeasy');
const useragent = require('useragent');
const uuid = require('uuid');
const ActivationRoutes = require('./activation');
const StorageRoutes = require('./storage');
const BridgeRoutes = require('./bridge');
const StripeRoutes = require('./stripe');
const DesktopRoutes = require('./desktop');
const MobileRoutes = require('./mobile');
const TwoFactorRoutes = require('./twofactor');

module.exports = (Router, Service, Logger, App) => {
  Router.get('/teams/:user', passportAuth, async (req, res) => {
    const { user } = req.params;

    let team = await Service.Team.getTeamByMember(user.email);
    if (!team || team.admin !== user.email) {
      res.status(500).send();
    }

    Service.Team.getTeamByIdUser(user)
      .then((team) => {
        if (team) {
          res.status(200).json(team.dataValues);
        } else {
          res.status(200).json({});
        }
      })
      .catch((err) => {
        res.status(500).json(err);
      });
  });

  Router.post('/teams/initialize', passportAuth, async (req, res) => {
    const bridgeUser = req.body.email;
    const mnemonic = req.body.mnemonic
    const user = req.user;

    let team = await Service.Team.getTeamByMember(user.email);
    if (!team || team.admin !== user.email) {
      res.status(500).send();
    }

    Service.User.InitializeUser({
      email: bridgeUser,
      mnemonic: mnemonic
    }).then((userData) => {
      Service.User.FindUserByEmail(bridgeUser).then((teamUser) => {
        userData.id = teamUser.id;
        userData.email = teamUser.email;
        userData.password = teamUser.password;
        userData.mnemonic = teamUser.mnemonic;
        userData.root_folder_id = teamUser.root_folder_id;

        res.status(200).send({ userData })
      }).catch((err) => {
      });
    }).catch((err) => {
      Logger.error(`${err.message}\n${err.stack}`);
      res.status(500).send(err.message);
    });

  });


  Router.get('/teams/getById/:id', passportAuth, async (req, res) => {
    const { id } = req.params;

    let team = await Service.Team.getTeamByMember(user.email);
    if (!team || team.admin !== user.email) {
      res.status(500).send();
    }
    Service.Team.getTeamById(id)
      .then((team) => {
        res.status(200).json(team.dataValues);
      })
      .catch((err) => {
        res.status(500).json(err);
      });
  });

  Router.post('/teams/team-invitations', passportAuth, function (req, res) {
    const email = req.body.email;
    const token = crypto.randomBytes(20).toString('hex');
    const Encryptbridge_password = req.body.bridgePass;
    const Encryptmnemonic = req.body.mnemonicTeam;
    console.log(req.body.email)
    console.log('req user', req.user)

    Service.User.FindUserByEmail(email).then((userData) => {
      Service.Keyserver.keysExists(userData).then(() => {
        Service.TeamInvitations.getTeamInvitationByIdUser(email).then((teamInvitation) => {
          if (teamInvitation) {
            Service.Mail.sendEmailTeamsMember(email, teamInvitation.token, req.team).then((team) => {
              Logger.info('The email is forwarded to the user %s', email)
              res.status(200).send({})
            }).catch((err) => {
              Logger.error('Error: Send invitation mail from %s to %s 1', req.user.email, email)
              res.status(500).send({ error: 'Error: Send invitation mail' })
            })
          }
        }).catch(err => {
          Logger.info('The user %s not have a team Invitation', email)
          Service.Team.getIdTeamByUser(email).then((responseMember) => {
            if (responseMember.status === 200) {
              res.status(200).send({});
            } else {
              res.status(400).send({ error: 'This user is alredy a member' });
            }
          }).catch((err) => {
            Logger.info('The user %s is not a member', email)
            Service.Team.getTeamBridgeUser(req.user.email).then(team => {
              Service.TeamInvitations.save({
                id_team: team.id,
                user: email,
                token: token,
                bridge_password: Encryptbridge_password,
                mnemonic: Encryptmnemonic
              }).then((user) => {
                Service.Mail.sendEmailTeamsMember(email, token, req.team).then((team) => {
                  Logger.info('User %s sends invitations to %s to join a team', req.user.email, req.body.email)
                  res.status(200).send({})
                }).catch((err) => {
                  Logger.error('Error: Send invitation mail from %s to %s 2', req.user.email, req.body.email)
                  res.status(500).send({})
                })
              }).catch((err) => {
                Logger.error('Error: Send invitation mail from %s to %s 3', req.user.email, req.body.email)
                console.log(err)
                res.status(500).send({})
              })
            }).catch(err => {
              Logger.error('The user %s not have a team Invitation', req.user.email)
              res.status(500).send({})
            })
          })
        })
      }).catch(err => {
        Logger.error('The user %s not have a public key', email)
        console.log(err)
        res.status(500).send({})
      })
    }).catch(err => {
      Logger.error('The user %s not have a team', req.user.email)
      res.status(500).send({})
    })
  });


  Router.post('/teams/join/:token', (req, res) => {
    const { token } = req.params;

    Service.TeamInvitations.getByToken(token).then((teamInvitation) => {
      Service.Team.getTeamById(teamInvitation.id_team).then((team) => {
        Service.User.FindUserByEmail(teamInvitation.user).then((userId) => {
          Service.Keyserver.keysExists(userId).then(async (userKey) => {
            Service.TeamsMembers.saveMembersFromInvitations({
              id_team: teamInvitation.id_team,
              user: teamInvitation.user,
              bridge_password: teamInvitation.bridge_password,
              bridge_mnemonic: teamInvitation.mnemonic
            }).then((newMember) => {
              Logger.info('Miembro %s save in teamsMembers', teamInvitation.user)
              teamInvitation.destroy().then(() => {
                res.status(200).send({})
              }).catch(err => {
                res.status(500).send({ error: 'The invitation could not be destroyed' })
              })
            }).catch((err) => {
              Logger.error('Error: User %s could not be saved in teamMember ', teamInvitation.user)
              res.status(500).send({ error: 'The invitation is not saved' })
            })
          }).catch((err) => {
            res.status(500).json({ error: 'Invalid Team invitation link' });
            Logger.error('Keys not exists')
          });
        }).catch((err) => {
          res.status(500).json({ error: 'Invalid Team invitation link' });
          Logger.error('User not exists')
        });

      }).catch((err) => {
        res.status(500).json({ error: 'Invalid Team invitation link' });
      });
    }).catch((err) => {
      res.status(500).json({ error: 'Invalid Team invitation link' });
      Logger.error('Token %s doesn\'t exists', token)
    });

  });

  Router.delete('/teams-members/', passportAuth, (req, res) => {
    const { members } = req.body;
    const { idTeam } = req.body;
    const { user } = req;

    Service.Team.getTeamByIdUser(user.email)
      .then((team) => {
        if (idTeam == team.id) {
          Service.TeamsMembers.remove(members, team.id)
            .then(() => {
              Service.TeamInvitations.remove(members[0])
                .then(() => {
                  res.status(200).json({ message: 'team member removed' });
                })
                .catch((err) => {
                  res.status(500).json({ error: err });
                });
            })
            .catch((err) => {
              res.status(500).json({ error: err });
            });
        } else {
          res.status(500).json({ error: "it's not your team" });
        }
      })
      .catch((err) => {
        res.status(500).json({ error: "it's not your team" });
      });
  });

  Router.get('/teams-members/:user', passportAuth, (req, res) => {
    const userEmail = req.params.user;

    Service.Team.getIdTeamByUser(userEmail)
      .then((team) => {
        Service.Team.getTeamById(team.id_team).then((team2) => {
          res.status(200).json(team2.dataValues);
        }).catch((err) => { })
      })
      .catch((err) => {
        res.status(500).json(err);
      });
  });

  Router.get('/teams-members/team/:idTeam', passportAuth, (req, res) => {
    const { idTeam } = req.params;
    Service.TeamsMembers.getMembersByIdTeam(idTeam)
      .then((teamMembers) => {
        res.status(200).json(teamMembers);
      })
      .catch((err) => {
        res.status(500).json(err);
      });
  });
  return Router;

};
