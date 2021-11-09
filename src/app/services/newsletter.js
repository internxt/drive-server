const { default: axios } = require('axios');

const MAILERLITE_API_KEY = 'bbcd6c365d78a339a63df27b93ebd323';

module.exports = () => {
  const subscribe = async (email, groupId) => {
    await axios.post(
      `https://api.mailerlite.com/api/v2/groups/${groupId}/subscribers`,
      { email, resubscribe: true, autoresponders: true },
      {
        headers: {
          Accept: 'application/json',
          'X-MailerLite-ApiDocs': 'true',
          'Content-Type': 'application/json',
          'X-MailerLite-ApiKey': MAILERLITE_API_KEY
        }
      }
    );
  };

  return {
    Name: 'Newsletter',
    subscribe
  };
};
