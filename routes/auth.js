// ไฟล์ - routes/auth.js
const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// เส้นทางสำหรับการลงทะเบียนและเข้าสู่ระบบ
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;