const Analytics = require('analytics-node');

const analytics = new Analytics(process.env.APP_SEGMENT_KEY);

module.exports = () => {
  const track = (...params) => analytics.track(...params);

  const identify = (...params) => analytics.identify(...params);

  return {
    Name: 'Analytics',
    track,
    identify
  };
};
