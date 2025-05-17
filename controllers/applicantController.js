// controllers/applicantController.js
const { pool } = require('../config/db');

/**
 * ดึงข้อมูลผู้สมัครทั้งหมดในกิจกรรม
 */
exports.getApplicants = async (req, res, next) => {
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
    
    // ตรวจสอบสิทธิ์ - ต้องเป็น Admin หรือผู้สร้างกิจกรรม
    if (req.user.role !== 'ADMIN' && req.user.id !== activities[0].created_by) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ดูข้อมูลผู้สมัครกิจกรรมนี้'
      });
    }
    
    // ดึงข้อมูลผู้สมัครพร้อมข้อมูลผู้ใช้
    const [applicants] = await pool.query(`
      SELECT 
        aa.id, 
        aa.status, 
        aa.applied_at,
        u.id as user_id, 
        u.student_id, 
        u.firstname,
        u.lastname,
        u.email,
        f.name as faculty_name,
        m.name as major_name
      FROM activity_applications aa
      JOIN users u ON aa.user_id = u.id
      LEFT JOIN faculties f ON u.faculty_id = f.id
      LEFT JOIN majors m ON u.major_id = m.id
      WHERE aa.activity_id = ?
      ORDER BY aa.applied_at DESC
    `, [id]);
    
    res.status(200).json({
      success: true,
      count: applicants.length,
      data: applicants
    });
  } catch (err) {
    console.error('Error in getApplicants:', err);
    next(err);
  }
};

/**
 * อนุมัติผู้สมัคร
 */
exports.approveApplicant = async (req, res, next) => {
  try {
    const { activityId, applicantId } = req.params;
    
    // ตรวจสอบว่ากิจกรรมมีอยู่จริง
    const [activities] = await pool.query('SELECT * FROM activities WHERE id = ?', [activityId]);
    
    if (activities.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลกิจกรรม'
      });
    }
    
    // ตรวจสอบสิทธิ์ - ต้องเป็น Admin หรือผู้สร้างกิจกรรม
    if (req.user.role !== 'ADMIN' && req.user.id !== activities[0].created_by) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์อนุมัติผู้สมัครกิจกรรมนี้'
      });
    }
    
    // ตรวจสอบว่าใบสมัครมีอยู่จริง
    const [applications] = await pool.query(
      'SELECT * FROM activity_applications WHERE id = ? AND activity_id = ?',
      [applicantId, activityId]
    );
    
    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการสมัครนี้'
      });
    }
    
    const application = applications[0];
    
    // ตรวจสอบว่าใบสมัครอยู่ในสถานะรอดำเนินการ
    if (application.status !== 'รอดำเนินการ') {
      return res.status(400).json({
        success: false,
        message: `ไม่สามารถอนุมัติได้ เนื่องจากสถานะปัจจุบันคือ ${application.status}`
      });
    }
    
    // ตรวจสอบว่ากิจกรรมยังไม่เต็ม
    const [participantsCount] = await pool.query(
      'SELECT COUNT(*) as count FROM activity_applications WHERE activity_id = ? AND status = "อนุมัติ"',
      [activityId]
    );
    
    if (participantsCount[0].count >= activities[0].max_participants) {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถอนุมัติได้ เนื่องจากกิจกรรมมีผู้เข้าร่วมเต็มแล้ว'
      });
    }
    
    // อนุมัติผู้สมัคร
    await pool.query(
      'UPDATE activity_applications SET status = "อนุมัติ", approved_by = ? WHERE id = ?',
      [req.user.id, applicantId]
    );
    
    res.status(200).json({
      success: true,
      message: 'อนุมัติผู้สมัครสำเร็จ'
    });
  } catch (err) {
    console.error('Error in approveApplicant:', err);
    next(err);
  }
};

/**
 * ปฏิเสธผู้สมัคร
 */
exports.rejectApplicant = async (req, res, next) => {
  try {
    const { activityId, applicantId } = req.params;
    
    // ตรวจสอบว่ากิจกรรมมีอยู่จริง
    const [activities] = await pool.query('SELECT * FROM activities WHERE id = ?', [activityId]);
    
    if (activities.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลกิจกรรม'
      });
    }
    
    // ตรวจสอบสิทธิ์ - ต้องเป็น Admin หรือผู้สร้างกิจกรรม
    if (req.user.role !== 'ADMIN' && req.user.id !== activities[0].created_by) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ปฏิเสธผู้สมัครกิจกรรมนี้'
      });
    }
    
    // ตรวจสอบว่าใบสมัครมีอยู่จริง
    const [applications] = await pool.query(
      'SELECT * FROM activity_applications WHERE id = ? AND activity_id = ?',
      [applicantId, activityId]
    );
    
    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการสมัครนี้'
      });
    }
    
    // ปฏิเสธผู้สมัคร
    await pool.query(
      'UPDATE activity_applications SET status = "ปฏิเสธ", approved_by = ? WHERE id = ?',
      [req.user.id, applicantId]
    );
    
    res.status(200).json({
      success: true,
      message: 'ปฏิเสธผู้สมัครสำเร็จ'
    });
  } catch (err) {
    console.error('Error in rejectApplicant:', err);
    next(err);
  }
};