module.exports = {
  apps: [
    {
      name: 'inactivity notify',
      script: './app/scripts/deleteInactiveAccounts.js',
      env: {
        NODE_ENV: 'staging'
      }
    }
  ]
};
