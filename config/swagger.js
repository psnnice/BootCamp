// ไฟล์ - config/swagger.js
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger Definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VolunteerHub API',
      version: '1.0.0',
      description: 'API สำหรับระบบจัดการงานอาสาและกิจกรรมมหาวิทยาลัย',
      contact: {
        name: 'VolunteerHub Team'
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development Server'
        }
      ]
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js'], // ตำแหน่งของไฟล์ที่มี JSDoc comments
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = {
  swaggerUi,
  swaggerDocs
};