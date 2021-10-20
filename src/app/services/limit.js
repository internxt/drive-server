const { default: axios } = require('axios');
const CryptService = require('./crypt');

module.exports = (Model, App) => {
  const cryptService = CryptService(Model, App);

  const getLimit = async (userEmail, userId) => {
    const pwd = userId;
    const pwdHash = cryptService.hashSha256(pwd);
    const credential = Buffer.from(`${userEmail}:${pwdHash}`).toString('base64');

    return axios.get(`${App.config.get('STORJ_BRIDGE')}/limit`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credential}`
      }
    }).then((response) => response.data);
  };

  return {
    Name: 'Limit',
    getLimit
  };
};
