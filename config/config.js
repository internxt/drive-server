const nconf = require('nconf');

class Config {
  static getInstance() {
    if (!global.ConfigInstance) {
      global.ConfigInstance = new Config();
    }

    return global.ConfigInstance;
  }

  constructor() {
    // eslint-disable-next-line global-require
    nconf.argv();
    nconf.env();
    nconf.required(['NODE_ENV']);
    nconf.use('conf', {
      type: 'literal',
      // eslint-disable-next-line global-require
      store: require(`./environments/${nconf.get('NODE_ENV')}.js`).data,
    });
    nconf.required(['server:port']);

    this.nconf = nconf;
  }

  get(key) {
    return this.nconf.get(key);
  }
}

module.exports = Config;
