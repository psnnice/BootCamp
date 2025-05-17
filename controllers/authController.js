const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { generateToken, generateTokenWithoutStorage } = require('../middleware/auth');

// ลงทะเบียนผู้ใช้งานใหม่
exports.register = async (req, res, next) => {
  try {
    const { student_id, email, password, full_name, faculty_id, major_id } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกอีเมล รหัสผ่าน และชื่อ-นามสกุล'
      });
    }

    // ตรวจสอบประเภทข้อมูล
    if (typeof email !== 'string' || typeof password !== 'string' || typeof full_name !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'อีเมล รหัสผ่าน และชื่อ-นามสกุลต้องเป็นสตริง'
      });
    }

    // ตรวจสอบรูปแบบอีเมล
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'รูปแบบอีเมลไม่ถูกต้อง'
      });
    }

    // ตรวจสอบว่าอีเมลซ้ำหรือไม่
    const [existingEmail] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'อีเมลนี้ถูกใช้งานแล้ว'
      });
    }

    // ตรวจสอบว่ารหัสนิสิตซ้ำหรือไม่ (ถ้ามีการระบุมา)
    if (student_id) {
      if (typeof student_id !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'รหัสนิสิตต้องเป็นสตริง'
        });
      }
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
    }

    // ตรวจสอบ faculty_id (ถ้ามี)
    if (faculty_id) {
      if (!Number.isInteger(faculty_id)) {
        return res.status(400).json({
          success: false,
          message: 'รหัสคณะต้องเป็นจำนวนเต็ม'
        });
      }
      const [faculty] = await pool.query(
        'SELECT id FROM faculties WHERE id = ?',
        [faculty_id]
      );
      if (faculty.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'รหัสคณะไม่ถูกต้องหรือไม่มีอยู่ในระบบ'
        });
      }
    }

    // ตรวจสอบ major_id (ถ้ามี)
    if (major_id) {
      if (!Number.isInteger(major_id)) {
        return res.status(400).json({
          success: false,
          message: 'รหัสสาขาต้องเป็นจำนวนเต็ม'
        });
      }
      const [major] = await pool.query(
        'SELECT id, faculty_id FROM majors WHERE id = ?',
        [major_id]
      );
      if (major.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'รหัสสาขาไม่ถูกต้องหรือไม่มีอยู่ในระบบ'
        });
      }
      // ถ้ามี faculty_id ตรวจสอบว่า major สังกัดอยู่ใน faculty นั้น
      if (faculty_id && major[0].faculty_id !== faculty_id) {
        return res.status(400).json({
          success: false,
          message: 'สาขานี้ไม่ได้สังกัดอยู่ในคณะที่ระบุ'
        });
      }
    }

    // เข้ารหัสรหัสผ่าน
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // บันทึกข้อมูลผู้ใช้งานใหม่
    const [result] = await pool.query(
      'INSERT INTO users (student_id, email, password_hash, full_name, role, faculty_id, major_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [student_id || null, email, password_hash, full_name, 'STUDENT', faculty_id || null, major_id || null]
    );

    if (result.affectedRows === 1) {
      // ดึงข้อมูลผู้ใช้งานที่เพิ่งสร้าง (ไม่รวมรหัสผ่าน)
      const [newUser] = await pool.query(
        'SELECT id, student_id, email, full_name, role, created_at, faculty_id, major_id FROM users WHERE id = ?',
        [result.insertId]
      );

      // สร้าง Token โดยไม่เก็บลงฐานข้อมูล
      const token = generateTokenWithoutStorage(result.insertId);

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
    console.log('====== LOGIN ATTEMPT ======');
    console.log('Email:', req.body.email);
    console.log('Timestamp:', new Date().toISOString());
    console.log('IP:', req.ip);
    console.log('User-Agent:', req.headers['user-agent']);
    
    const { email, password } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!email || !password) {
      console.log('LOGIN FAILED: Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกอีเมลและรหัสผ่าน'
      });
    }

    // ตรวจสอบประเภทข้อมูล
    if (typeof email !== 'string' || typeof password !== 'string') {
      console.log('LOGIN FAILED: Invalid data type');
      return res.status(400).json({
        success: false,
        message: 'อีเมลและรหัสผ่านต้องเป็นสตริง'
      });
    }

    // ค้นหาผู้ใช้งานจากอีเมล
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      console.log('LOGIN FAILED: User not found -', email);
      return res.status(401).json({
        success: false,
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    const user = users[0];

    // ตรวจสอบว่าผู้ใช้งานถูกระงับหรือไม่
    if (user.is_banned) {
      console.log('LOGIN FAILED: User is banned -', email);
      return res.status(403).json({
        success: false,
        message: 'บัญชีผู้ใช้ถูกระงับการใช้งาน'
      });
    }

    // ตรวจสอบรหัสผ่าน
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      console.log('LOGIN FAILED: Incorrect password -', email);
      return res.status(401).json({
        success: false,
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    // สร้างและเก็บ Token
    const token = await generateToken(user.id);
    
    console.log('LOGIN SUCCESS:', email);
    console.log('User ID:', user.id);
    console.log('Role:', user.role);
    console.log('====== LOGIN COMPLETE ======');

    // ส่งข้อมูลผู้ใช้งานกลับไป (ไม่รวมรหัสผ่าน)
    const userData = {
      id: user.id,
      student_id: user.student_id,
      email: user.email,
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
    console.error('LOGIN ERROR:', err);
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