const civicSip = require('civic-sip-api');

module.exports = (Config) => {
  const civicClient = civicSip.newClient({
    appId: Config.get('CIVIC_APPID'),
    prvKey: Config.get('CIVIC_PRVKEY'),
    appSecret: Config.get('CIVIC_APPSECRET'),
  })

  return civicClient
}
