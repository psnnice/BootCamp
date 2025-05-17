// ไฟล์ - config/swagger.js (ปรับปรุง)
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// นำเข้าไฟล์ schemas
require('./swagger-schemas');

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
  apis: [
    './config/swagger-schemas.js',
    './routes/*.js'
  ], // เพิ่มไฟล์ schemas และ routes
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = {
  swaggerUi,
  swaggerDocs
};