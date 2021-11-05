const { default: axios } = require('axios');

const MAILERLITE_API_KEY = '';

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
