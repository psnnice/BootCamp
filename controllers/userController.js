// ไฟล์ - controllers/userController.js
const { pool } = require('../config/db');

// ดึงข้อมูลผู้ใช้ทั้งหมด โดยไม่ต้องยืนยันตัวตน
exports.getAllUsers = async (req, res, next) => {
  // เพิ่ม timeout เพื่อป้องกันการค้างนานเกินไป
  const timeout = setTimeout(() => {
    return res.status(408).json({
      success: false,
      message: 'Request timeout'
    });
  }, 10000); // 10 วินาที

  try {
    console.log('Starting getAllUsers query...'); // log เพื่อดีบัก
    
    // เพิ่ม limit และ pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // ดึงข้อมูลผู้ใช้ทั้งหมดพร้อมชื่อคณะและสาขาแบบมี limit
    const [users] = await pool.query(`
      SELECT u.id, u.student_id, u.email, u.full_name, u.role, u.is_banned, u.created_at,
             u.faculty_id, f.name as faculty_name, u.major_id, m.name as major_name, u.profile_image
      FROM users u
      LEFT JOIN faculties f ON u.faculty_id = f.id
      LEFT JOIN majors m ON u.major_id = m.id
      ORDER BY u.id
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    
    console.log(`Found ${users.length} users`); // log เพื่อดีบัก
    
    // นับจำนวนผู้ใช้ทั้งหมด
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM users');
    const total = countResult[0].total;
    
    // ยกเลิก timeout เมื่อทำงานเสร็จ
    clearTimeout(timeout);
    
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
    
    res.status(200).json({
      success: true,
      count: safeUsers.length,
      total: total,
      pagination: {
        current_page: page,
        per_page: limit,
        total_pages: Math.ceil(total / limit)
      },
      data: safeUsers
    });
  } catch (err) {
    // ยกเลิก timeout เมื่อเกิดข้อผิดพลาด
    clearTimeout(timeout);
    console.error('Error in getAllUsers:', err); // log error
    next(err);
  }
};

// ดึงข้อมูลผู้ใช้ตาม ID
exports.getUserById = async (req, res, next) => {
  const timeout = setTimeout(() => {
    return res.status(408).json({
      success: false,
      message: 'Request timeout'
    });
  }, 5000); // 5 วินาที
  
  try {
    const { id } = req.params;
    console.log(`Getting user with ID: ${id}`); // log เพื่อดีบัก
    
    // ดึงข้อมูลผู้ใช้ตาม ID พร้อมชื่อคณะและสาขา
    const [users] = await pool.query(`
      SELECT u.id, u.student_id, u.email, u.full_name, u.role, u.is_banned, u.created_at,
             u.faculty_id, f.name as faculty_name, u.major_id, m.name as major_name, u.profile_image
      FROM users u
      LEFT JOIN faculties f ON u.faculty_id = f.id
      LEFT JOIN majors m ON u.major_id = m.id
      WHERE u.id = ?
    `, [id]);
    
    clearTimeout(timeout);
    
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
      email: users[0].email,
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
    clearTimeout(timeout);
    console.error('Error in getUserById:', err); // log error
    next(err);
  }
};