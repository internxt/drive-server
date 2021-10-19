import nconf from 'nconf';

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
      store: require(`./environments/${nconf.get('NODE_ENV')}.js`).data,
    });
    nconf.required(['server:port']);
  }

  get(key: string) {
    return nconf.get(key);
  }
}
