// updated app.js with activities routes
const express = require('express');
require('dotenv').config();
const { swaggerUi, swaggerDocs } = require('./config/swagger');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const userBanRoutes = require('./routes/userBan');
const activityRoutes = require('./routes/activity');
const facultyRoutes = require('./routes/faculty');
const { errorHandler } = require('./middleware/errorHandler');
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // อนุญาตให้เข้าถึงไฟล์ในโฟลเดอร์ public

// CORS configuration
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', userBanRoutes); // เพิ่ม route สำหรับ userBan
app.use('/api/activities', activityRoutes); // เพิ่ม route สำหรับ activities
app.use('/api/faculties', facultyRoutes);
app.use('/api/majors', express.Router().get('/', require('./controllers/facultyController').getAllMajors));
app.use('/api', require('./routes/user')); // เพิ่มบรรทัดนี้

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