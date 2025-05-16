const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// ฟังก์ชันสำหรับสร้างและเก็บ token ใหม่
exports.generateToken = async (userId) => {
  try {
    // สร้าง JWT token
    const payload = { id: userId };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    // เก็บ token ลงตาราง auth_tokens
    await pool.query(
      'INSERT INTO auth_tokens (user_id, token) VALUES (?, ?)',
      [userId, token]
    );

    // ทริกเกอร์ enforce_single_active_token จะทำให้ token เดิมเป็น is_invalid = 1 อัตโนมัติ
    return token;
  } catch (err) {
    throw new Error('ไม่สามารถสร้าง token ได้: ' + err.message);
  }
};

// Middleware สำหรับตรวจสอบ token
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
    // ตรวจสอบว่า token มีอยู่ในตาราง auth_tokens และยังไม่หมดอายุหรือถูกยกเลิก
    const [tokenRows] = await pool.query(
      'SELECT * FROM auth_tokens WHERE token = ? AND is_invalid = 0 AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)',
      [token]
    );

    if (tokenRows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Token ไม่ถูกต้องหรือหมดอายุ'
      });
    }

    // ตรวจสอบความถูกต้องของ token ด้วย JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ตรวจสอบว่าผู้ใช้งานยังมีอยู่ในระบบหรือไม่
    const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
    
    if (userRows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'ไม่พบผู้ใช้งานในระบบ'
      });
    }

    // ตรวจสอบว่าผู้ใช้งานถูกระงับหรือไม่
    if (userRows[0].is_banned) {
      return res.status(403).json({
        success: false,
        message: 'บัญชีผู้ใช้ถูกระงับการใช้งาน'
      });
    }

    // ตรวจสอบว่า user_id จาก token ตรงกับผู้ใช้ในตาราง auth_tokens
    if (tokenRows[0].user_id !== decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Token ไม่สอดคล้องกับผู้ใช้งาน'
      });
    }

    // เก็บข้อมูลผู้ใช้งานใน request สำหรับใช้ในขั้นตอนต่อไป
    req.user = userRows[0];
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