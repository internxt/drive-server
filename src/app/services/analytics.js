const Analytics = require('analytics-node');
const logger = require('../../lib/logger').default;

const analytics = new Analytics(process.env.APP_SEGMENT_KEY);
const Logger = logger.getInstance();

module.exports = () => {
  const track = (...params) => {
    try {
      analytics.track(...params);
    }
    catch(err) {
      Logger.error(`[Analytics] Track ${params.event}. Error: ${err.message}`);
    }
  };

  const identify = (...params) => {
    try {
      analytics.identify(...params);
    }
    catch(err) {
      Logger.error(`[Analytics] Identify. Error: ${err.message}`);
    }
  };

  return {
    Name: 'Analytics',
    track,
    identify
  };
};
