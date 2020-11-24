const crypto = require('crypto');

const sequelize = require('sequelize');
const fetch = require('node-fetch');

const { Op } = sequelize;
const async = require('async');
const axios = require('axios');

module.exports = (Model, App) => {

  const FolderService = require('./folder')(Model, App);
  const UserService = require('./user')(Model, App);
  const StorjService = require('./storj')(Model, App);
  const CryptService = require('./crypt')(Model, App);

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
    console.log(userEmail)
    return new Promise(function (resolve, reject) {
      getIdTeamByUser(userEmail).then(function (team) {
        console.log('email', userEmail)
        console.log('team',team)
        if (!team) {
          return resolve()
        }
        getTeamById(team.id_team).then(function (team2) {
          console.log('team.id_team', team.id_team)
          console.log('team2',team2)
          resolve(team2);
        }).catch((err) => { 
          console.log(err) 
          reject(); 
        })
      }).catch((err) => {
         reject("TEAM NOT FOUND");
         });
    });
  };


  return {
    Name: 'Team',
    create,
    getTeamByIdUser,
    getTeamById,
    generateBridgeTeamUser,
    getIdTeamByUser,
    getTeamByMember,
    getTeamBridgeUser,
    getPlans
    };
};
