"use strict";
var path = require('path');
var routes = path.join(process.cwd(), 'app/routes/index.js');
var options = {
    swaggerDefinition: {
        info: {
            title: 'Drive Server',
            version: '1.0.0' // Version (required)
        }
    },
    apis: [routes] // Path to the API docs
};
// Initialize swagger-jsdoc -> returns validated swagger spec in json format
module.exports = options;
