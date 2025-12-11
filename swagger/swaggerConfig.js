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
        // CHANGED: Use your actual Google OAuth endpoint, not Google's directly
        googleOAuth2: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              // CHANGED: Use YOUR app's auth endpoint
              authorizationUrl: 'https://plastic-manufacturing-api.onrender.com/auth/google',
              // CHANGED: Use Google's token endpoint for token exchange
              tokenUrl: 'https://accounts.google.com/o/oauth2/token',
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
        // CHANGED: Match the security scheme name
        googleOAuth2: ['profile', 'email']
      }
    ]
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);
module.exports = specs;