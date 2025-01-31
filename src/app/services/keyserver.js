const sequelize = require('sequelize');

const { Op } = sequelize;

module.exports = (Model) => {
  const getKeys = (user) =>
    Model.keyserver.findOne({
      where: {
        user_id: { [Op.eq]: user.id },
        encrypt_version: { [Op.eq]: 'ecc' }
      },
    });

  const keysExists = async (user) => {
    if (!user) {
      return false;
    }
    const keys = await getKeys(user);
    return !!keys;
  };

  const addKeysLogin = (userData, publicKey, privateKey, revocationKey) =>
    new Promise((resolve, reject) => {
      Model.keyserver
        .create({
          user_id: userData.id,
          public_key: publicKey,
          private_key: privateKey,
          revocation_key: revocationKey,
          encrypt_version: 'ecc',
        })
        .then((userKeys) => {
          resolve(userKeys);
        })
        .catch(() => {
          reject(Error('Error querying database'));
        });
    });

  const removeKeys = (userId) => {
    Model.keyserver.destroy({ where: { user_id: { [Op.eq]: userId } } });
  };

  return {
    Name: 'KeyServer',
    addKeysLogin,
    keysExists,
    getKeys,
    removeKeys,
  };
};
