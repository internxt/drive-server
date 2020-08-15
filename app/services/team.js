const crypto = require('crypto');

const sequelize = require('sequelize');
const fetch = require('node-fetch');

const { Op } = sequelize;
const async = require('async');

module.exports = (Model, App) => {
  const FolderService = require('./folder')(Model, App);
  const UserService = require('./user')(Model, App);
  const StorjService = require('./storj')(Model, App);
  const CryptService = require('./crypt')(Model, App);

  const create = (team) => {
    return new Promise((resolve, reject) => {
      Model.teams
      .create({
        user: team.user,
        name: team.name,
        bridge_user: team.bridge_user,
        bridge_password: team.bridge_password,
        bridge_email: team.bridge_email
      })
      .then((newTeam) => {
        resolve({ team: newTeam });
      })
      .catch((err) => {
        reject({ error: 'Unable to create new team on db' });
      });
    });
  }

  const getByIdUser = (user) => {
    return new Promise((resolve, reject) => {
      Model.teams
        .findOne({
          where: { user: { [Op.eq]: user } },
        })
        .then((team) => {
          if (team) {
            resolve(team);
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

  const getById = (idTeam) => {
    return new Promise((resolve, reject) => {
      Model.teams
        .findOne({
          where: { id: { [Op.eq]: idTeam } },
        })
        .then((team) => {
          if (team) {
            resolve(team);
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

  const generateBridgeTeamUser = () => {
    let dateNow = new Date().toISOString().split('.')[0].replace(/[-:T]/g, '');
    let passwd = CryptService.encryptText(dateNow, process.env.CRYPTO_KEY)

    return {
      email: `${dateNow}team@internxt.com`,
      password: passwd,
    };
  }

  return {
    Name: 'Team',
    create,
    getByIdUser,
    getById,
    generateBridgeTeamUser
  };
};