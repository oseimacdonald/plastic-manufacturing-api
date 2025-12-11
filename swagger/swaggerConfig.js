const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Plastic Manufacturing API',
      version: '1.0.0',
      description: `API for injection machine production reporting system

## Authentication Instructions:
1. Visit \`/auth/google\` to authenticate with Google
2. After authentication, your session will be active
3. Use the endpoints below

Do NOT use the "Authorize" button in Swagger UI.`,
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
    ]
    // No securitySchemes - this prevents OAuth buttons
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);
module.exports = specs;