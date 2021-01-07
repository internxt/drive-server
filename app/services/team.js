const sequelize = require('sequelize');
const axios = require('axios');
const CryptService = require('./crypt');

const { Op } = sequelize;

module.exports = (Model, App) => {
    const CryptServiceInstance = CryptService(Model, App);

    /**
     * @swagger
     * Function: Method to create a Team in DB
     */
    const create = (team) => Model.teams
        .create({
            admin: team.admin,
            name: team.name,
            bridge_user: team.bridge_user,
            bridge_password: team.bridge_password,
            bridge_mnemonic: team.bridge_mnemonic
        })
        .then((newTeam) => newTeam.dataValues);

    /**
    * @swagger
    * Function: Method to get info team with the email of admin
    */
    const getTeamByIdUser = (user) => Model.teams
        .findOne({ where: { admin: { [Op.eq]: user } } });

    /**
    * @swagger
    * Function: Method to get info team with the idTeam
    */
    const getTeamById = (idTeam) => Model.teams
        .findOne({ where: { id: { [Op.eq]: idTeam } } });

    /**
    * @swagger
    * Function: Method to generete a random email FOR STRIPE
    */
    const randomEmailBridgeUserTeam = () => {
        const dateNow = new Date().toISOString()
            .split('.')[0].replace(/[-:T]/g, '');
        const passwd = CryptServiceInstance.encryptText(dateNow, process.env.CRYPTO_KEY);

        return {
            bridge_user: `${dateNow}team@internxt.com`,
            password: passwd
        };
    };

    /**
    * @swagger
    * Function: Method to get info in TEAM MEMBERS with a user
    */
    const getIdTeamByUser = (user) => Model.teams_members
        .findOne({
            where: { user: { [Op.eq]: user } }
        });

    /**
    * @swagger
    * Function: Method to get info of the team with the bridge_user team
    */
    const getTeamBridgeUser = (user) => Model.teams.findOne({
        where: { bridge_user: { [Op.eq]: user } }
    });

    /**
    * @swagger
    * Function: Method to get Plans, this method is used for the limit and usage and to control teams invitations with 200GB plan
    */
    const getPlans = async (user) => {
        const dataBridge = await getTeamBridgeUser(user);
        const pwd = dataBridge.bridge_password;
        const pwdHash = CryptServiceInstance.hashSha256(pwd);
        const credential = Buffer.from(`${dataBridge.bridge_user}:${pwdHash}`).toString('base64');
        const limit = await axios.get(`${App.config.get('STORJ_BRIDGE')}/limit`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${credential}`
            }
        }).then((res) => res.data)
            .catch(() => null);
        return limit;
    };

    /**
    * @swagger
    * Function: Method to get the object team
    */
    const getTeamByMember = (userEmail) => getIdTeamByUser(userEmail).then((team) => (!team ? Promise.resolve() : getTeamById(team.id_team)));

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
