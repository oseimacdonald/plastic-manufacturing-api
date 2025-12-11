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
    components: {
      securitySchemes: {
        OAuth2: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://accounts.google.com/o/oauth2/auth',
              tokenUrl: 'https://oauth2.googleapis.com/token',
              scopes: {
                'profile': 'Access to your profile information',
                'email': 'Access to your email address'
              }
            }
          }
        }
      }
    },
    security: [
      {
        OAuth2: ['profile', 'email']
      }
    ]
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);
module.exports = specs;