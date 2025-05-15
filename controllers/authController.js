// ไฟล์ - controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// ฟังก์ชันสร้าง Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// ลงทะเบียนผู้ใช้งานใหม่
exports.register = async (req, res, next) => {
  try {
    const { student_id, password, full_name, faculty_id, major_id } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!student_id || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      });
    }

    // ตรวจสอบรูปแบบรหัสนิสิตว่าเป็น 8 หลักหรือไม่
    if (student_id.length !== 8 || isNaN(student_id)) {
      return res.status(400).json({
        success: false,
        message: 'รหัสนิสิตต้องเป็นตัวเลข 8 หลัก'
      });
    }

    // ตรวจสอบว่ารหัสนิสิตซ้ำหรือไม่
    const [existingUser] = await pool.query(
      'SELECT * FROM users WHERE student_id = ?',
      [student_id]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'รหัสนิสิตนี้ถูกใช้งานแล้ว'
      });
    }

    // ตรวจสอบว่า faculty_id และ major_id มีอยู่จริงหรือไม่ (ถ้ามีการระบุมา)
    if (faculty_id) {
      const [faculty] = await pool.query('SELECT * FROM faculties WHERE id = ?', [faculty_id]);
      if (faculty.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'ไม่พบคณะที่ระบุ'
        });
      }
    }

    if (major_id) {
      const [major] = await pool.query('SELECT * FROM majors WHERE id = ?', [major_id]);
      if (major.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'ไม่พบสาขาที่ระบุ'
        });
      }
    }

    // เข้ารหัสรหัสผ่าน
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // บันทึกข้อมูลผู้ใช้งานใหม่
    const [result] = await pool.query(
      'INSERT INTO users (student_id, password_hash, full_name, role, faculty_id, major_id) VALUES (?, ?, ?, ?, ?, ?)',
      [student_id, password_hash, full_name, 'STUDENT', faculty_id || null, major_id || null]
    );

    if (result.affectedRows === 1) {
      // ดึงข้อมูลผู้ใช้งานที่เพิ่งสร้าง (ไม่รวมรหัสผ่าน)
      const [newUser] = await pool.query(
        'SELECT id, student_id, full_name, role, created_at, faculty_id, major_id FROM users WHERE id = ?',
        [result.insertId]
      );

      // สร้าง Token
      const token = generateToken(result.insertId);

      res.status(201).json({
        success: true,
        message: 'ลงทะเบียนสำเร็จ',
        data: {
          user: newUser[0],
          token
        }
      });
    } else {
      throw new Error('ไม่สามารถลงทะเบียนได้');
    }
  } catch (err) {
    next(err);
  }
};

// เข้าสู่ระบบ
exports.login = async (req, res, next) => {
  try {
    const { student_id, password } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!student_id || !password) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกรหัสนิสิตและรหัสผ่าน'
      });
    }

    // ค้นหาผู้ใช้งานจากรหัสนิสิต
    const [users] = await pool.query('SELECT * FROM users WHERE student_id = ?', [student_id]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'รหัสนิสิตหรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    const user = users[0];

    // ตรวจสอบว่าผู้ใช้งานถูกระงับหรือไม่
    if (user.is_banned) {
      return res.status(403).json({
        success: false,
        message: 'บัญชีผู้ใช้ถูกระงับการใช้งาน'
      });
    }

    // ตรวจสอบรหัสผ่าน
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'รหัสนิสิตหรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    // สร้าง Token
    const token = generateToken(user.id);

    // ส่งข้อมูลผู้ใช้งานกลับไป (ไม่รวมรหัสผ่าน)
    const userData = {
      id: user.id,
      student_id: user.student_id,
      full_name: user.full_name,
      role: user.role,
      faculty_id: user.faculty_id,
      major_id: user.major_id,
      profile_image: user.profile_image,
      created_at: user.created_at
    };

    res.status(200).json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      data: {
        user: userData,
        token
      }
    });
  } catch (err) {
    next(err);
  }
};

// รับข้อมูลผู้ใช้งานปัจจุบัน
exports.getMe = async (req, res, next) => {
  try {
    // ดึงข้อมูลผู้ใช้งานจากฐานข้อมูลอีกครั้ง (เพื่อให้ได้ข้อมูลล่าสุด)
    const [user] = await pool.query(
      `SELECT u.id, u.student_id, u.full_name, u.role, u.created_at, 
      u.faculty_id, f.name as faculty_name, u.major_id, m.name as major_name, u.profile_image
      FROM users u
      LEFT JOIN faculties f ON u.faculty_id = f.id
      LEFT JOIN majors m ON u.major_id = m.id
      WHERE u.id = ?`,
      [req.user.id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้ใช้งาน'
      });
    }

    // ดึงข้อมูลชั่วโมงอาสาและคะแนนสะสม
    const [participation] = await pool.query(
      `SELECT SUM(hours) as total_hours, SUM(points) as total_points
      FROM activity_participation
      WHERE user_id = ?`,
      [req.user.id]
    );

    const userWithStats = {
      ...user[0],
      total_hours: participation[0].total_hours || 0,
      total_points: participation[0].total_points || 0
    };

    res.status(200).json({
      success: true,
      data: userWithStats
    });
  } catch (err) {
    next(err);
  }
};