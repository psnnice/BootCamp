// ไฟล์ - controllers/userController.js
const { pool } = require('../config/db');

// ดึงข้อมูลผู้ใช้ทั้งหมด โดยไม่ต้องยืนยันตัวตน
exports.getAllUsers = async (req, res, next) => {
  try {
    // ดึงข้อมูลผู้ใช้ทั้งหมดพร้อมชื่อคณะและสาขา
    const [users] = await pool.query(`
      SELECT u.id, u.student_id, u.email, u.full_name, u.role, u.is_banned, u.created_at,
             u.faculty_id, f.name as faculty_name, u.major_id, m.name as major_name, u.profile_image
      FROM users u
      LEFT JOIN faculties f ON u.faculty_id = f.id
      LEFT JOIN majors m ON u.major_id = m.id
      ORDER BY u.id
    `);
    
    // ปิดบังข้อมูลที่ละเอียดอ่อน
    const safeUsers = users.map(user => ({
      id: user.id,
      student_id: user.student_id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_banned: user.is_banned,
      faculty_name: user.faculty_name,
      major_name: user.major_name,
      profile_image: user.profile_image,
      created_at: user.created_at
    }));
    
    // โค้ดส่วนอื่นๆ ยังคงเหมือนเดิม...
  } catch (err) {
    next(err);
  }
};

// ดึงข้อมูลผู้ใช้ตาม ID โดยไม่ต้องยืนยันตัวตน
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // ดึงข้อมูลผู้ใช้ตาม ID พร้อมชื่อคณะและสาขา
    const [users] = await pool.query(`
      SELECT u.id, u.student_id, u.full_name, u.role, u.is_banned, u.created_at,
             u.faculty_id, f.name as faculty_name, u.major_id, m.name as major_name, u.profile_image
      FROM users u
      LEFT JOIN faculties f ON u.faculty_id = f.id
      LEFT JOIN majors m ON u.major_id = m.id
      WHERE u.id = ?
    `, [id]);
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }
    
    // ปิดบังข้อมูลที่ละเอียดอ่อน
    const safeUser = {
      id: users[0].id,
      student_id: users[0].student_id,
      full_name: users[0].full_name,
      role: users[0].role,
      is_banned: users[0].is_banned,
      faculty_name: users[0].faculty_name,
      major_name: users[0].major_name,
      profile_image: users[0].profile_image,
      created_at: users[0].created_at
    };
    
    res.status(200).json({
      success: true,
      data: safeUser
    });
  } catch (err) {
    next(err);
  }
};