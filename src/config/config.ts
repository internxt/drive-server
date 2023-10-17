import nconf from 'nconf';

const development = require('./environments/development.js').data;
const test = require('./environments/test.js').data;
const staging = require('./environments/staging.js').data;
const production = require('./environments/production.js').data;
const e2e = require('./environments/e2e.js').data;

const environments: any = { development, test, staging, e2e, production };

export default class Config {
  private static instance: Config;

  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }

    return Config.instance;
  }

  constructor() {
    // eslint-disable-next-line global-require
    nconf.argv();
    nconf.env();
    nconf.required(['NODE_ENV']);
    nconf.use('conf', {
      type: 'literal',
      // eslint-disable-next-line global-require
      store: environments[nconf.get('NODE_ENV')],
    });
    nconf.required(['server:port']);
  }

  get(key: string) {
    return nconf.get(key);
  }
}
