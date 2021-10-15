import { argv, env, required, use, get } from 'nconf';

class Config { 
  constructor() {
    // eslint-disable-next-line global-require
    argv();
    env();
    required(['NODE_ENV']);
    use('conf', {
      type: 'literal',
      // eslint-disable-next-line global-require
      store: require(`./environments/${get('NODE_ENV')}.js`).data,
    });
    required(['server:port']);
  }

  get(key: string) {
    return get(key);
  }
}

export const config = new Config();
