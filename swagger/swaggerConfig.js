const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Plastic Manufacturing API',
      version: '1.0.0',
      description: 'API for injection machine production reporting system',
      contact: {
        name: 'API Support',
        email: 'support@plasticmanufacturing.com'
      }
    },
    servers: [
      {
        url: 'https://plastic-manufacturing-api.onrender.com',
        description: 'Production server'
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);
module.exports = specs;