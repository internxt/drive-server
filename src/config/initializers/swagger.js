const path = require('path');

const routes = path.join(process.cwd(), 'app/routes/index.js');

const options = {
  swaggerDefinition: {
    info: {
      title: 'Drive Server', // Title (required)
      version: '1.0.0', // Version (required)
    },
  },
  apis: [routes], // Path to the API docs
};

// Initialize swagger-jsdoc -> returns validated swagger spec in json format
module.exports = options;
