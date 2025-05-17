// ไฟล์ - controllers/activityController.js
const { pool } = require('../config/db');

// ดึงข้อมูลกิจกรรมทั้งหมด
exports.getAllActivities = async (req, res, next) => {
  try {
    // รับ query parameters จาก URL สำหรับ pagination และ filtering
    const { page = 1, limit = 10, category, status } = req.query;
    const offset = (page - 1) * limit;
    
    // สร้าง query string พื้นฐาน - แก้ไขในส่วนนี้ เปลี่ยนจาก u.full_name เป็น CONCAT(u.firstname, ' ', u.lastname)
    let query = `
      SELECT a.*, 
             CONCAT(u.firstname, ' ', u.lastname) as creator_name, 
             c.name as category_name
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
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM activities a 
      WHERE 1=1
    `; // เปลี่ยนจาก const เป็น let
    
    // เพิ่มเงื่อนไขเดียวกับ query หลัก
    let countParams = []; // ใช้ let แทน const
    if (!req.user || req.user.role === 'STUDENT') {
      countQuery += ` AND a.status = 'อนุมัติ'`;
    } else if (status) {
      countQuery += ` AND a.status = ?`;
      countParams.push(status);
    }
    
    if (category) {
      countQuery += ` AND a.category = ?`;
      countParams.push(category);
    }
    
    // เพิ่ม ORDER BY และ LIMIT สำหรับ pagination
    query += ` ORDER BY a.start_time DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    // ทำ query ทั้งสอง
    const [countResult] = await pool.query(countQuery, countParams);
    const [activities] = await pool.query(query, params);
    
    // เพิ่ม application_count แยกต่างหาก
    for (const activity of activities) {
      const [applicationCount] = await pool.query(
        'SELECT COUNT(*) as count FROM activity_applications WHERE activity_id = ?',
        [activity.id]
      );
      // ถ้า activities เป็น constant และเราพยายาม mutate มัน
      // อาจเป็นได้ว่า activities เป็น readOnly (e.g., Object.freeze)
      // ลองใช้วิธีที่ไม่ต้อง mutate activities โดยตรง
      Object.defineProperty(activity, 'application_count', {
        value: applicationCount[0].count || 0,
        enumerable: true
      });
    }
    
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
    console.error('Error in getAllActivities:', err);
    console.error(err);
    next(err);
  }
};

// ดึงข้อมูลกิจกรรมตาม ID
exports.getActivityById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    
    const [activities] = await pool.query(`
      SELECT a.*, 
             CONCAT(u.firstname, ' ', u.lastname) as creator_name, 
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


// อัปเดตสถานะกิจกรรม (เสร็จสิ้น/ยกเลิก)
exports.updateActivityStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // ตรวจสอบว่าสถานะที่ส่งมาถูกต้อง
    const validStatuses = ['อนุมัติ', 'เสร็จสิ้น', 'ยกเลิก'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'สถานะไม่ถูกต้อง กรุณาระบุ: อนุมัติ, เสร็จสิ้น หรือ ยกเลิก'
      });
    }
    
    // ตรวจสอบว่ากิจกรรมมีอยู่จริง
    const [activities] = await pool.query('SELECT * FROM activities WHERE id = ?', [id]);
    
    if (activities.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลกิจกรรม'
      });
    }
    
    // ตรวจสอบว่าผู้ใช้มีสิทธิ์แก้ไขกิจกรรม
    if (req.user.role !== 'ADMIN' && req.user.id !== activities[0].created_by) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์แก้ไขกิจกรรมนี้'
      });
    }
    
    // อัปเดตสถานะกิจกรรม
    const [result] = await pool.query(
      'UPDATE activities SET status = ? WHERE id = ?',
      [status, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถอัปเดตสถานะกิจกรรมได้'
      });
    }
    
    // ถ้ากิจกรรมเสร็จสิ้น ให้คำนวณชั่วโมงและคะแนนให้ผู้เข้าร่วม
    if (status === 'เสร็จสิ้น') {
      // ดึงข้อมูลผู้สมัครที่ได้รับการอนุมัติ
      const [approvedApplicants] = await pool.query(
        'SELECT user_id FROM activity_applications WHERE activity_id = ? AND status = "อนุมัติ"',
        [id]
      );
      
      // คำนวณชั่วโมงกิจกรรม (วันสิ้นสุด - วันเริ่มต้น)
      const startTime = new Date(activities[0].start_time);
      const endTime = new Date(activities[0].end_time);
      const durationHours = (endTime - startTime) / (1000 * 60 * 60); // แปลงเป็นชั่วโมง
      
      // คำนวณคะแนน (สมมติว่า 1 ชั่วโมง = 1 คะแนน)
      const points = durationHours;
      
      // บันทึกชั่วโมงและคะแนนสำหรับผู้เข้าร่วมทุกคน
      for (const applicant of approvedApplicants) {
        await pool.query(
          `INSERT INTO activity_participation 
           (activity_id, user_id, hours, points, verified_by, verified_at) 
           VALUES (?, ?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE 
           hours = VALUES(hours), 
           points = VALUES(points), 
           verified_by = VALUES(verified_by), 
           verified_at = NOW()`,
          [id, applicant.user_id, durationHours, points, req.user.id]
        );
      }
    }
    
    res.status(200).json({
      success: true,
      message: `อัปเดตสถานะกิจกรรมเป็น ${status} สำเร็จ`
    });
  } catch (err) {
    console.error('Error in updateActivityStatus:', err);
    next(err);
  }
};


// อนุมัติกิจกรรมโดย Admin
exports.approveActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approved } = req.body; // approved: true/false
    
    // ตรวจสอบว่ากิจกรรมมีอยู่จริง
    const [activities] = await pool.query('SELECT * FROM activities WHERE id = ?', [id]);
    
    if (activities.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลกิจกรรม'
      });
    }
    
    // ตรวจสอบว่ากิจกรรมอยู่ในสถานะรออนุมัติ
    if (activities[0].status !== 'รออนุมัติ') {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถอนุมัติกิจกรรมนี้ได้ เนื่องจากไม่อยู่ในสถานะรออนุมัติ'
      });
    }
    
    // อัปเดตสถานะกิจกรรมตามการตัดสินใจของ Admin
    const newStatus = approved ? 'อนุมัติ' : 'ปฏิเสธ';
    
    const [result] = await pool.query(
      'UPDATE activities SET status = ? WHERE id = ?',
      [newStatus, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถอัปเดตสถานะกิจกรรมได้'
      });
    }
    
    res.status(200).json({
      success: true,
      message: approved 
        ? 'อนุมัติกิจกรรมสำเร็จ' 
        : 'ปฏิเสธกิจกรรมสำเร็จ'
    });
  } catch (err) {
    console.error('Error in approveActivity:', err);
    next(err);
  }
};

// แก้ไขข้อมูลกิจกรรม
exports.updateActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // ตรวจสอบว่ากิจกรรมมีอยู่จริง
    const [activities] = await pool.query('SELECT * FROM activities WHERE id = ?', [id]);
    
    if (activities.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลกิจกรรม'
      });
    }
    
    const activity = activities[0];
    
    // ตรวจสอบสิทธิ์ - ต้องเป็น Admin หรือ Staff ที่เป็นเจ้าของกิจกรรม
    if (req.user.role !== 'ADMIN' && (req.user.role !== 'STAFF' || req.user.id !== activity.created_by)) {
      console.log('ปฏิเสธการแก้ไข:', req.user.role, req.user.id, activity.created_by);
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์แก้ไขกิจกรรมนี้'
      });
    }
    
    // รับข้อมูลที่ต้องการแก้ไขจาก request
    const { 
      title, 
      description, 
      category, 
      start_time, 
      end_time, 
      max_participants,
      location,
      cover_image,
      category_id
    } = req.body;
    
    // สร้าง query และ parameters สำหรับอัปเดต
    let updateFields = [];
    let updateParams = [];
    
    if (title) {
      updateFields.push('title = ?');
      updateParams.push(title);
    }
    
    if (description) {
      updateFields.push('description = ?');
      updateParams.push(description);
    }
    
    if (category) {
      updateFields.push('category = ?');
      updateParams.push(category);
    }
    
    if (start_time) {
      updateFields.push('start_time = ?');
      updateParams.push(start_time);
    }
    
    if (end_time) {
      updateFields.push('end_time = ?');
      updateParams.push(end_time);
    }
    
    if (max_participants) {
      updateFields.push('max_participants = ?');
      updateParams.push(max_participants);
    }
    
    if (location) {
      updateFields.push('location = ?');
      updateParams.push(location);
    }
    
    if (cover_image) {
      updateFields.push('cover_image = ?');
      updateParams.push(cover_image);
    }
    
    if (category_id) {
      updateFields.push('category_id = ?');
      updateParams.push(category_id);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ไม่มีข้อมูลที่ต้องการแก้ไข'
      });
    }
    
    // สร้าง query string
    const query = `UPDATE activities SET ${updateFields.join(', ')} WHERE id = ?`;
    
    // เพิ่ม id เข้าไปใน parameters
    updateParams.push(id);
    
    // อัปเดตข้อมูล
    const [result] = await pool.query(query, updateParams);
    
    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถแก้ไขข้อมูลกิจกรรมได้'
      });
    }
    
    // ดึงข้อมูลกิจกรรมที่อัปเดตแล้ว
    const [updatedActivity] = await pool.query(`
      SELECT a.*, 
             CONCAT(u.firstname, ' ', u.lastname) as creator_name, 
             c.name as category_name
      FROM activities a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN activity_categories c ON a.category_id = c.id
      WHERE a.id = ?
    `, [id]);
    
    res.status(200).json({
      success: true,
      message: 'แก้ไขข้อมูลกิจกรรมสำเร็จ',
      data: updatedActivity[0]
    });
  } catch (err) {
    console.error('Error in updateActivity:', err);
    next(err);
  }
};