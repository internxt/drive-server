module.exports = {
  apps: [
    {
      name: 'inactivity notify',
      script: './app/scripts/sendAccountDeletionMail.js',
      env: {
        NODE_ENV: 'staging'
      }
    }
  ]
};
