module.exports = {
  apps: [
    {
      name: 'drive-server',
      script: './app.js',
      env: {
        NODE_ENV: 'staging'
      }
    }
  ]
};
