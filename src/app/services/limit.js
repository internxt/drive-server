const { default: axios } = require('axios');
const CryptService = require('./crypt');
const { default: Redis } = require('../../config/initializers/redis');

module.exports = (Model, App) => {
  const cryptService = CryptService(Model, App);

  const getLimit = async (userEmail, userId, userUuid, userUpdatedAt) => {
    if (userUpdatedAt) {
      const updatedAtTime = new Date(userUpdatedAt).getTime();
      Redis.getInstance();
      const limitRecord = await Redis.getLimit(userUuid);

      if (limitRecord && limitRecord.cachedAt > updatedAtTime) {
        console.log('Cache hit for limit on user', userUuid);

        return { maxSpaceBytes: limitRecord.limit };
      }
    }

    const pwd = userId;
    const pwdHash = cryptService.hashSha256(pwd);
    const credential = Buffer.from(`${userEmail}:${pwdHash}`).toString('base64');

    const response = await axios
      .get(`${App.config.get('STORJ_BRIDGE')}/limit`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${credential}`,
        },
      });

    if (userUuid) {
      await Redis.setLimit(userUuid, response.data.maxSpaceBytes);
    }

    return response.data;
  };

  const expireLimit = async (userUuid) => {
    Redis.getInstance();

    await Redis.expireLimit(userUuid);
  };

  return {
    Name: 'Limit',
    getLimit,
    expireLimit,
  };
};
