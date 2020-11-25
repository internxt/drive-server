const crypto = require('crypto');
const sequelize = require('sequelize');
const { Op } = sequelize;
const async = require('async');
const axios = require('axios');

module.exports = (Model, App) => {
  const CryptService = require('./crypt')(Model, App);
  const SYNC_KEEPALIVE_INTERVAL_MS = 30 * 1000; // 30 seconds
  const LAST_MAIL_RESEND_INTERVAL = 1000 * 60 * 10; // 10 minutes
  const Logger = App.logger;

  const create = async (team) => {
    return await new Promise((resolve, reject) => {
      Model.teams
        .create({
          admin: team.admin,
          name: team.name,
          bridge_user: team.bridge_user,
          bridge_password: team.bridge_password,
          bridge_mnemonic: team.bridge_mnemonic
        })
        .then((newTeam) => {
          resolve(newTeam.dataValues);
        })
        .catch((err) => {
          reject({ error: 'Unable to create new team on db' });
        });
    });
  };

  const getTeamByIdUser = (user) => new Promise((resolve, reject) => {
    Model.teams
      .findOne({
        where: { admin: { [Op.eq]: user } }
      })
      .then((team) => {
        resolve(team);
      })
      .catch((err) => {
        console.error(err);
        reject('Error querying database');
      });
  });

  const getTeamById = (idTeam) => new Promise((resolve, reject) => {
    Model.teams
      .findOne({
        where: { id: { [Op.eq]: idTeam } }
      })
      .then((team) => {
        if (team) {
          resolve(team);
        } else {
          reject('Team does not exists');
        }
      })
      .catch((err) => {
        console.error(err);
        reject('Error querying database');
      });
  });

  const generateBridgeTeamUser = () => {
    const dateNow = new Date().toISOString().split('.')[0].replace(/[-:T]/g, '');
    const passwd = CryptService.encryptText(dateNow, process.env.CRYPTO_KEY);

    return {
      email: `${dateNow}team@internxt.com`,
      password: passwd
    };
  };

  const getIdTeamByUser = (user) => new Promise((resolve, reject) => {
    Model.teams_members
      .findOne({
        where: {
          user: { [Op.eq]: user }
        }
      })
      .then((teamMember) => {
        resolve(teamMember);
      })
      .catch((err) => {
        console.error(err);
        reject('Error querying database');
      });
  });

  const getPlans = async (user) => {
    const dataBridge = await getTeamBridgeUser(user);
    const pwd = dataBridge.bridge_password;
    const pwdHash = CryptService.hashSha256(pwd);
    const credential = Buffer.from(`${dataBridge.bridge_user}:${pwdHash}`).toString('base64');
    const limit = await axios.get(`${App.config.get('STORJ_BRIDGE')}/limit`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credential}`,
      },
    }).then(res => res.data)
      .catch(err => null)
    return limit
  }

  const getTeamBridgeUser = (user) => new Promise((resolve, reject) => {
    Model.teams
      .findOne({
        where: {
          bridge_user: { [Op.eq]: user }
        }
      })
      .then((team) => {

        resolve(team);
      })
      .catch((err) => {
        console.error(err);
        reject('Error querying database');
      });
  });

  const getTeamByMember = function (userEmail) {
    return new Promise(function (resolve, reject) {
      getIdTeamByUser(userEmail).then(function (team) {
        if (!team) {
          return resolve()
        }
        getTeamById(team.id_team).then(function (team2) {
          resolve(team2);
        }).catch((err) => {
          reject();
        })
      }).catch((err) => {
        reject("TEAM NOT FOUND");
      });
    });
  };

  const SetEmailSendedTeam = (email) => Model.users.update(
    {
      lastResend: new Date()
    },
    { where: { email: { [Op.eq]: email } } }
  );

  const DeactivateTeam = (email) => new Promise(async (resolve, reject) => {
    const shouldSend = await ShouldSendEmailTeam(email);
    console.log('shouldsend', shouldSend)

    if (!shouldSend) {
      Logger.info('Do not resend deactivation email to %s', email);

      return resolve(); // noop
    }

    SetEmailSendedTeam(email);

    Model.teams
      .findOne({ where: { bridge_user: { [Op.eq]: email } } })
      .then((user) => {
        const password = crypto.SHA256(user.bridge_password).toString();
        const auth = Buffer.from(`${user.bridge_user}:${password}`).toString(
          'base64'
        );

        axios.delete(`${App.config.get('STORJ_BRIDGE')}/users/${email}`, {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        })
          .then((data) => {
            resolve(data);
          })
          .catch((err) => {
            Logger.warn(err.response.data);
            reject(err);
          });
      })
      .catch(reject);
  });

  const ConfirmDeactivateTeam = (token) => new Promise((resolve, reject) => {
    console.log('token',token)
    async.waterfall(
      [
        (next) => {
          axios
            .get(
              `${App.config.get('STORJ_BRIDGE')}/deactivationStripe/${token}`,
              {
                headers: { 'Content-Type': 'application/json' }
              }
            )
            .then((res) => {
              console.log('User deleted from bridge');
              next(null, res);
            })
            .catch((err) => {
              console.log('Error user deleted from bridge');
              next(err);
            });
        },
        (data, next) => {
          console.log('email', data.data.email)
          const userEmail = data.data.email;
        
          Model.teams
            .findOne({ where: { bridge_user: { [Op.eq]: userEmail } } })
            .then((user) => {
              console.log('User found on sql');

              const referralUuid = user.referral;
              if (uuid.validate(referralUuid)) {
                DecrementCredit(referralUuid);
                console.log('referral decremented');
              }

              user
                .destroy()
                .then((result) => {
                  console.log('User deleted on sql', userEmail);
                  next(null, data);
                })
                .catch((err) => {
                  console.log('Error deleting user on sql');
                  next(err);
                });
            })
            .catch(next);
        }
      ],
      (err, result) => {
        if (err) {
          console.log('Error waterfall', err);
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });

  const ShouldSendEmailTeam = (email) => new Promise((resolve, reject) => {
    Model.teams
      .findOne({ where: { bridge_user: { [Op.eq]: email } } })
      .then((user) => {
        if (!user.lastResend) {
          return resolve(true); // Field is null, send email
        }

        const dateDiff = new Date() - user.lastResend;
        resolve(dateDiff > LAST_MAIL_RESEND_INTERVAL);
      })
      .catch(reject);
  });



  return {
    Name: 'Team',
    create,
    getTeamByIdUser,
    getTeamById,
    generateBridgeTeamUser,
    getIdTeamByUser,
    getTeamByMember,
    getTeamBridgeUser,
    getPlans,
    DeactivateTeam,
    ConfirmDeactivateTeam,
    ShouldSendEmailTeam,
    SetEmailSendedTeam

  };
};
