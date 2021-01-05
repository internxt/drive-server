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


    /**
   * @swagger
   * Function: Method to create a Team in DB
   */
    const create = async (team) => await new Promise((resolve, reject) => {
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


    /**
    * @swagger
    * Function: Method to get info team with the email of admin
    */
    const getTeamByIdUser = (user) => new Promise((resolve, reject) => {
        Model.teams
            .findOne({
                where: { admin: { [Op.eq]: user } }
            })
            .then((team) => {
                resolve(team);
            })
            .catch((err) => {
                reject('Error querying database');
            });
    });

    /**
    * @swagger
    * Function: Method to get info team with the idTeam
    */
    const getTeamById = (idTeam) => new Promise((resolve, reject) => {
        Model.teams
            .findOne({
                where: { id: { [Op.eq]: idTeam } }
            })
            .then((team) => {
                resolve(team);
            })
            .catch((err) => {
                console.error(err);
                reject('Error querying database');
            });
    });

    /**
    * @swagger
    * Function: Method to generete a random email FOR STRIPE
    */
    const randomEmailBridgeUserTeam = () => {
        const dateNow = new Date().toISOString().split('.')[0].replace(/[-:T]/g, '');
        const passwd = CryptService.encryptText(dateNow, process.env.CRYPTO_KEY);

        return {
            bridge_user: `${dateNow}team@internxt.com`,
            password: passwd
        };
    };


    /**
    * @swagger
    * Function: Method to get info in TEAM MEMBERS with a user
    */
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


    /**
    * @swagger
    * Function: Method to get Plans, this method is used for the limit and usage and to control teams invitations with 200GB plan
    */
    const getPlans = async (user) => {
        const dataBridge = await getTeamBridgeUser(user);
        const pwd = dataBridge.bridge_password;
        const pwdHash = CryptService.hashSha256(pwd);
        const credential = Buffer.from(`${dataBridge.bridge_user}:${pwdHash}`).toString('base64');
        const limit = await axios.get(`${App.config.get('STORJ_BRIDGE')}/limit`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${credential}`
            }
        }).then((res) => res.data)
            .catch((err) => null);
        return limit;
    };

    /**
    * @swagger
    * Function: Method to get info of the team with the bridge_user team
    */
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

    /**
    * @swagger
    * Function: Method to get the object team
    */
    const getTeamByMember = function (userEmail) {
        return new Promise(((resolve, reject) => {
            getIdTeamByUser(userEmail).then((team) => {
                if (!team) {
                    return resolve();
                }
                getTeamById(team.id_team).then((team2) => {
                    resolve(team2);
                }).catch((err) => {
                    reject();
                });
            }).catch((err) => {
                reject('TEAM NOT FOUND');
            });
        }));
    };

    return {
        Name: 'Team',
        create,
        getTeamByIdUser,
        getTeamById,
        randomEmailBridgeUserTeam,
        getIdTeamByUser,
        getTeamByMember,
        getTeamBridgeUser,
        getPlans

    };
};
