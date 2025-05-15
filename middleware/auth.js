// ไฟล์ - middleware/auth.js
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

exports.protect = async (req, res, next) => {
  let token;

  // ตรวจสอบว่ามี token ในส่วนหัวของ request หรือไม่
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // ตรวจสอบว่ามี token หรือไม่
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'กรุณาเข้าสู่ระบบก่อนเข้าถึงข้อมูล'
    });
  }

  try {
    // ตรวจสอบความถูกต้องของ token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ตรวจสอบว่าผู้ใช้งานยังมีอยู่ในระบบหรือไม่
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
    
    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'ไม่พบผู้ใช้งานในระบบ'
      });
    }

    // ตรวจสอบว่าผู้ใช้งานถูกระงับหรือไม่
    if (rows[0].is_banned) {
      return res.status(403).json({
        success: false,
        message: 'บัญชีผู้ใช้ถูกระงับการใช้งาน'
      });
    }

    // เก็บข้อมูลผู้ใช้งานใน request สำหรับใช้ในขั้นตอนต่อไป
    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'ไม่ได้รับอนุญาตให้เข้าถึง'
    });
  }
};

// Middleware สำหรับตรวจสอบสิทธิ์ของผู้ใช้งาน
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `สิทธิ์ ${req.user.role} ไม่สามารถเข้าถึงส่วนนี้ได้`
      });
    }
    next();
  };
};