// ไฟล์ - app.js (เพิ่มเติม)
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const activityRoutes = require('./routes/activity');
const facultyRoutes = require('./routes/faculty'); // เพิ่มเข้ามาใหม่
const { errorHandler } = require('./middleware/errorHandler');
const { swaggerUi, swaggerDocs } = require('./config/swagger');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/faculties', facultyRoutes); // เพิ่มเส้นทางสำหรับคณะและสาขา

// เส้นทางเพิ่มเติมสำหรับสาขาทั้งหมด
app.use('/api/majors', express.Router().get('/', require('./controllers/facultyController').getAllMajors));

// Root endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    status: 'Server is running',
    version: '1.0.0',
    name: 'VolunteerHub API'
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger Documentation is available at http://localhost:${PORT}/api-docs`);
});

// Export app for testing
module.exports = app;