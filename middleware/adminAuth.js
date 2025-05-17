const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// Middleware สำหรับตรวจสอบว่าเป็น ADMIN และ token อยู่ใน auth_tokens
exports.restrictToAdminToken = async (req, res, next) => {
  let token;

  // ตรวจสอบว่ามี token ในส่วนหัวของ request หรือไม่
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ'
    });
  }

  try {
    // ตรวจสอบความถูกต้องของ token ด้วย JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ตรวจสอบว่า token อยู่ใน auth_tokens และ valid
    const [tokenRows] = await pool.query(
      'SELECT * FROM auth_tokens WHERE user_id = ? AND token = ? AND is_invalid = 0 AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)',
      [decoded.id, token]
    );

    if (tokenRows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Token ไม่ถูกต้องหรือไม่ได้ลงทะเบียนในระบบ'
      });
    }

    // ตรวจสอบว่าผู้ใช้งานมีอยู่ในระบบและเป็น ADMIN
    const [userRows] = await pool.query('SELECT id, role, is_banned FROM users WHERE id = ?', [decoded.id]);

    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้ใช้งานในระบบ'
      });
    }

    if (userRows[0].role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถดำเนินการนี้ได้'
      });
    }

    if (userRows[0].is_banned) {
      return res.status(403).json({
        success: false,
        message: 'บัญชีผู้ใช้ถูกระงับการใช้งาน'
      });
    }

    // เก็บข้อมูลผู้ใช้งานใน request
    req.user = userRows[0];
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token ไม่ถูกต้องหรือหมดอายุ: ' + err.message
    });
  }
};