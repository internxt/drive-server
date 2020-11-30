
const sequelize = require('sequelize');
const { Op } = sequelize;


module.exports = (Model, App) => {

    const keysExists = (user) => {
        return new Promise((resolve, reject) => {
            Model.keyserver.findOne({
                where: {
                    user_id: { [Op.eq]: user.id }
                }
            }).then((keys) => {
                if (keys) {
                    resolve(keys);
                } else {
                    reject('Keys not exists');
                }
            }).catch((err) => {
                console.error(err);
                reject('Error querying database');
            });
        });
    };


    const addKeysLogin = (userData,publicKey,privateKey,revocationKey) => {
        return new Promise((resolve, reject) => {
            Model.keyserver.create({
                user_id: userData.id,
                public_key: publicKey,
                private_key: privateKey,
                revocation_key: revocationKey

            }).then((userKeys) => {
                resolve(userKeys)
            }).catch((err) => {
                console.error(err);
                reject('Error querying database');
            });
        });
    };




    return {
        Name: 'Keyserver',
        addKeysLogin,
        keysExists

    };
};

