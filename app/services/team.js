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

    console.log("TEAM CREATION ----- ", team)  //debug

    return new Promise((resolve, reject) => {
      Model.teams
      .create({
        admin: team.admin,
        name: team.name,
        bridge_user: team.bridge_user,
        bridge_password: team.bridge_password,
        bridge_mnemonic: team.bridge_mnemonic
      })
      .then((newTeam) => {
        console.log("TEAM DESPUES DE CREARLO ---- ", newTeam)
        resolve({ team: newTeam });
      })
      .catch((err) => {
        reject({ error: 'Unable to create new team on db' });
      });
    });
  }

  const getTeamByIdUser = (user) => {
    return new Promise((resolve, reject) => {
      Model.teams
        .findOne({
          where: { admin: { [Op.eq]: user } },
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

  const getTeamById = (idTeam) => {
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
    getTeamByIdUser,
    getTeamById,
    generateBridgeTeamUser
  };
};