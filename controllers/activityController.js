// ไฟล์ - controllers/activityController.js
const { pool } = require('../config/db');

// ดึงข้อมูลกิจกรรมทั้งหมด
exports.getAllActivities = async (req, res, next) => {
  try {
    // รับ query parameters จาก URL สำหรับ pagination และ filtering
    const { page = 1, limit = 10, category, status } = req.query;
    const offset = (page - 1) * limit;
    
    // สร้าง query string พื้นฐาน
    let query = `
      SELECT a.*, 
             u.full_name as creator_name, 
             c.name as category_name,
             (SELECT COUNT(*) FROM activity_applications aa WHERE aa.activity_id = a.id) as application_count
      FROM activities a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN activity_categories c ON a.category_id = c.id
      WHERE 1=1
    `;
    
    // เพิ่ม conditions สำหรับ filtering
    const params = [];
    
    // ถ้าเป็น user ทั่วไป ให้ดูเฉพาะกิจกรรมที่อนุมัติแล้ว
    if (!req.user || req.user.role === 'STUDENT') {
      query += ` AND a.status = 'อนุมัติ'`;
    } 
    // ถ้าเป็น staff หรือ admin ให้ filter ตาม status ที่ระบุ
    else if (status) {
      query += ` AND a.status = ?`;
      params.push(status);
    }
    
    // Filter ตามประเภทกิจกรรม
    if (category) {
      query += ` AND a.category = ?`;
      params.push(category);
    }
    
    // นับจำนวนกิจกรรมทั้งหมดที่ตรงตามเงื่อนไข (สำหรับ pagination)
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM activities a WHERE ${query.split('WHERE')[1]}`,
      params
    );
    
    // เพิ่ม ORDER BY และ LIMIT สำหรับ pagination
    query += ` ORDER BY a.start_time DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    // ดึงข้อมูลกิจกรรม
    const [activities] = await pool.query(query, params);
    
    res.status(200).json({
      success: true,
      count: activities.length,
      total: countResult[0].total,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_pages: Math.ceil(countResult[0].total / limit)
      },
      data: activities
    });
  } catch (err) {
    next(err);
  }
};

// ดึงข้อมูลกิจกรรมตาม ID
exports.getActivityById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // ดึงข้อมูลกิจกรรม
    const [activities] = await pool.query(`
      SELECT a.*, 
             u.full_name as creator_name, 
             c.name as category_name
      FROM activities a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN activity_categories c ON a.category_id = c.id
      WHERE a.id = ?
    `, [id]);
    
    if (activities.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลกิจกรรม'
      });
    }
    
    // ตรวจสอบว่าผู้ใช้มีสิทธิ์ดูกิจกรรมนี้หรือไม่
    const activity = activities[0];
    if (activity.status !== 'อนุมัติ' && 
        (!req.user || (req.user.role === 'STUDENT' && activity.created_by !== req.user.id))) {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลกิจกรรมนี้'
      });
    }
    
    // ดึงจำนวนผู้สมัครเข้าร่วมกิจกรรม
    const [applicationCount] = await pool.query(
      'SELECT COUNT(*) as count FROM activity_applications WHERE activity_id = ?',
      [id]
    );
    
    // รวมข้อมูลกิจกรรมและจำนวนผู้สมัคร
    const activityData = {
      ...activity,
      application_count: applicationCount[0].count
    };
    
    res.status(200).json({
      success: true,
      data: activityData
    });
  } catch (err) {
    next(err);
  }
};

