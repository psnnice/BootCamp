const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// ฟังก์ชันสำหรับสร้าง token โดยไม่เก็บลงฐานข้อมูล
exports.generateTokenWithoutStorage = (userId) => {
  const payload = { id: userId };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ฟังก์ชันสำหรับสร้างและอัปเดต token
exports.generateToken = async (userId) => {
  try {
    // สร้าง JWT token
    const payload = { id: userId };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    // คำนวณ expires_at (7 วันจากปัจจุบัน)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // ตรวจสอบว่า user ถูกแบนหรือไม่
    const [user] = await pool.query('SELECT is_banned FROM users WHERE id = ?', [userId]);
    if (user.length === 0) {
      throw new Error('ไม่พบผู้ใช้');
    }
    if (user[0].is_banned) {
      throw new Error('ผู้ใช้ถูกระงับการใช้งาน');
    }

    // ทำให้ token เดิม expire (ถ้ามี)
    await pool.query(
      'UPDATE auth_tokens SET is_invalid = 1, expires_at = CURRENT_TIMESTAMP WHERE user_id = ? AND is_invalid = 0',
      [userId]
    );

    // อัปเดตหรือเพิ่ม token ใหม่
    const [result] = await pool.query(
      `INSERT INTO auth_tokens (user_id, token, created_at, expires_at, is_invalid)
       VALUES (?, ?, CURRENT_TIMESTAMP, ?, 0)
       ON DUPLICATE KEY UPDATE
       token = VALUES(token),
       created_at = CURRENT_TIMESTAMP,
       expires_at = VALUES(expires_at),
       is_invalid = 0`,
      [userId, token, expiresAt]
    );

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

    // ตรวจสอบว่า token อยู่ใน auth_tokens และยัง valid (สำหรับ token จาก login)
    const [tokenRows] = await pool.query(
      'SELECT * FROM auth_tokens WHERE user_id = ? AND token = ? AND is_invalid = 0 AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)',
      [decoded.id, token]
    );

    if (tokenRows.length === 0) {
      // ถ้า token ไม่อยู่ใน auth_tokens อนุญาตให้ผ่านถ้า JWT valid และผู้ใช้มีอยู่ในระบบ
      // นี่คือกรณี token จาก register
      req.user = userRows[0];
      return next();
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
      message: 'Token ไม่ถูกต้องหรือหมดอายุ'
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