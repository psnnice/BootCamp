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




/**
 * ดึงข้อมูลผู้สมัครสำหรับนิสิต (แสดงข้อมูลที่จำกัดกว่า)
 */
exports.getApplicantsForStudent = async (req, res, next) => {
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
    
    // ตรวจสอบว่ากิจกรรมได้รับการอนุมัติแล้ว
    if (activities[0].status !== 'อนุมัติ') {
      return res.status(403).json({
        success: false,
        message: 'กิจกรรมนี้ยังไม่ได้รับการอนุมัติ ไม่สามารถดูรายชื่อผู้สมัครได้'
      });
    }
    
    // ตรวจสอบว่าผู้ใช้สมัครกิจกรรมนี้หรือไม่
    const [userApplication] = await pool.query(
      'SELECT * FROM activity_applications WHERE activity_id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    // ถ้าผู้ใช้ไม่ได้สมัครกิจกรรมนี้ ไม่อนุญาตให้เข้าถึงข้อมูล
    if (userApplication.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่ได้สมัครกิจกรรมนี้ ไม่สามารถดูรายชื่อผู้สมัครได้'
      });
    }
    
    // ดึงข้อมูลผู้สมัครที่ได้รับการอนุมัติเท่านั้น และแสดงข้อมูลที่จำกัด
    const [applicants] = await pool.query(`
      SELECT 
        u.firstname,
        u.lastname,
        f.name as faculty_name,
        m.name as major_name,
        aa.status
      FROM activity_applications aa
      JOIN users u ON aa.user_id = u.id
      LEFT JOIN faculties f ON u.faculty_id = f.id
      LEFT JOIN majors m ON u.major_id = m.id
      WHERE aa.activity_id = ? AND aa.status = 'อนุมัติ'
      ORDER BY aa.applied_at
    `, [id]);
    
    // นับจำนวนผู้สมัครทั้งหมดและจำนวนที่ได้รับการอนุมัติ
    const [totalCount] = await pool.query(
      'SELECT COUNT(*) as total FROM activity_applications WHERE activity_id = ?',
      [id]
    );
    
    const [approvedCount] = await pool.query(
      'SELECT COUNT(*) as approved FROM activity_applications WHERE activity_id = ? AND status = "อนุมัติ"',
      [id]
    );
    
    res.status(200).json({
      success: true,
      activity_id: parseInt(id),
      total_applicants: totalCount[0].total,
      approved_applicants: approvedCount[0].approved,
      max_participants: activities[0].max_participants,
      data: applicants
    });
  } catch (err) {
    console.error('Error in getApplicantsForStudent:', err);
    next(err);
  }
};


/**
 * ทำเครื่องหมายผู้สมัครว่า "เข้าร่วม" กิจกรรม (เช็คชื่อ)
 */
exports.markAsAttended = async (req, res, next) => {
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
        message: 'คุณไม่มีสิทธิ์เช็คชื่อผู้เข้าร่วมกิจกรรมนี้'
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
    
    // ตรวจสอบว่าใบสมัครได้รับการอนุมัติแล้ว
    if (application.status !== 'อนุมัติ' && application.status !== 'เข้าร่วม') {
      return res.status(400).json({
        success: false,
        message: `ไม่สามารถเช็คชื่อได้ เนื่องจากสถานะปัจจุบันคือ ${application.status}`
      });
    }
    
    // เปลี่ยนสถานะเป็น "เข้าร่วม"
    await pool.query(
      'UPDATE activity_applications SET status = "เข้าร่วม" WHERE id = ?',
      [applicantId]
    );
    
    res.status(200).json({
      success: true,
      message: 'ทำเครื่องหมายผู้เข้าร่วมสำเร็จ'
    });
  } catch (err) {
    console.error('Error in markAsAttended:', err);
    next(err);
  }
};

/**
 * กำหนดจำนวนชั่วโมงและคะแนนให้ผู้ที่เข้าร่วมกิจกรรมแล้ว
 */
exports.assignHoursAndPoints = async (req, res, next) => {
  try {
    const { activityId, applicantId } = req.params;
    const { hours, points } = req.body;
    
    // ตรวจสอบข้อมูลที่ส่งมา
    if (hours === undefined || points === undefined) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุจำนวนชั่วโมงและคะแนน'
      });
    }
    
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
        message: 'คุณไม่มีสิทธิ์กำหนดชั่วโมงและคะแนนสำหรับกิจกรรมนี้'
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
    
    // ตรวจสอบว่าผู้สมัครเข้าร่วมกิจกรรมแล้ว
    if (application.status !== 'เข้าร่วม') {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถกำหนดชั่วโมงและคะแนนได้ เนื่องจากผู้สมัครยังไม่ได้เข้าร่วมกิจกรรม'
      });
    }
    
    // สร้างหรืออัปเดตข้อมูลการเข้าร่วมในตาราง activity_participation
    await pool.query(`
      INSERT INTO activity_participation (activity_id, user_id, hours, points, verified_by, verified_at)
      VALUES (?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
      hours = VALUES(hours), 
      points = VALUES(points), 
      verified_by = VALUES(verified_by), 
      verified_at = NOW()
    `, [activityId, application.user_id, hours, points, req.user.id]);
    
    res.status(200).json({
      success: true,
      message: 'กำหนดชั่วโมงและคะแนนสำเร็จ',
      data: {
        applicantId: parseInt(applicantId),
        hours: parseFloat(hours),
        points: parseFloat(points)
      }
    });
  } catch (err) {
    console.error('Error in assignHoursAndPoints:', err);
    next(err);
  }
};

/**
 * กำหนดจำนวนชั่วโมงและคะแนนให้ผู้เข้าร่วมทั้งหมดพร้อมกัน
 */
exports.assignHoursAndPointsToAll = async (req, res, next) => {
  try {
    const { activityId } = req.params;
    const { hours, points } = req.body;
    
    // ตรวจสอบข้อมูลที่ส่งมา
    if (hours === undefined || points === undefined) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุจำนวนชั่วโมงและคะแนน'
      });
    }
    
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
        message: 'คุณไม่มีสิทธิ์กำหนดชั่วโมงและคะแนนสำหรับกิจกรรมนี้'
      });
    }
    
    // ดึงรายชื่อผู้เข้าร่วมทั้งหมด
    const [attendees] = await pool.query(
      'SELECT * FROM activity_applications WHERE activity_id = ? AND status = "เข้าร่วม"',
      [activityId]
    );
    
    if (attendees.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบผู้เข้าร่วมกิจกรรมนี้'
      });
    }
    
    // สร้างหรืออัปเดตข้อมูลการเข้าร่วมสำหรับผู้เข้าร่วมทุกคน
    for (const attendee of attendees) {
      await pool.query(`
        INSERT INTO activity_participation (activity_id, user_id, hours, points, verified_by, verified_at)
        VALUES (?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE 
        hours = VALUES(hours), 
        points = VALUES(points), 
        verified_by = VALUES(verified_by), 
        verified_at = NOW()
      `, [activityId, attendee.user_id, hours, points, req.user.id]);
    }
    
    res.status(200).json({
      success: true,
      message: `กำหนดชั่วโมงและคะแนนสำเร็จสำหรับผู้เข้าร่วมทั้งหมด ${attendees.length} คน`,
      data: {
        attendeeCount: attendees.length,
        hours: parseFloat(hours),
        points: parseFloat(points)
      }
    });
  } catch (err) {
    console.error('Error in assignHoursAndPointsToAll:', err);
    next(err);
  }
};


/**
 * ดึงข้อมูลผู้เข้าร่วมกิจกรรม (เฉพาะคนที่มีสถานะ "เข้าร่วม")
 */
exports.getActivityAttendees = async (req, res, next) => {
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
        message: 'คุณไม่มีสิทธิ์ดูข้อมูลผู้เข้าร่วมกิจกรรมนี้'
      });
    }
    
    // ดึงข้อมูลผู้เข้าร่วมพร้อมข้อมูลผู้ใช้
    const [attendees] = await pool.query(`
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
        m.name as major_name,
        ap.hours,
        ap.points,
        ap.verified_at
      FROM activity_applications aa
      JOIN users u ON aa.user_id = u.id
      LEFT JOIN faculties f ON u.faculty_id = f.id
      LEFT JOIN majors m ON u.major_id = m.id
      LEFT JOIN activity_participation ap ON aa.activity_id = ap.activity_id AND aa.user_id = ap.user_id
      WHERE aa.activity_id = ? AND aa.status = "เข้าร่วม"
      ORDER BY aa.applied_at DESC
    `, [id]);
    
    res.status(200).json({
      success: true,
      count: attendees.length,
      data: attendees
    });
  } catch (err) {
    console.error('Error in getActivityAttendees:', err);
    next(err);
  }
};
/**
 * ทำเครื่องหมายผู้สมัครว่า "เข้าร่วม" กิจกรรม (เช็คชื่อ)
 */
exports.markAsAttended = async (req, res, next) => {
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
        message: 'คุณไม่มีสิทธิ์เช็คชื่อผู้เข้าร่วมกิจกรรมนี้'
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
    
    // ตรวจสอบว่าใบสมัครได้รับการอนุมัติแล้ว
    if (application.status !== 'อนุมัติ' && application.status !== 'เข้าร่วม') {
      return res.status(400).json({
        success: false,
        message: `ไม่สามารถเช็คชื่อได้ เนื่องจากสถานะปัจจุบันคือ ${application.status}`
      });
    }
    
    // เปลี่ยนสถานะเป็น "เข้าร่วม"
    await pool.query(
      'UPDATE activity_applications SET status = "เข้าร่วม" WHERE id = ?',
      [applicantId]
    );
    
    res.status(200).json({
      success: true,
      message: 'ทำเครื่องหมายผู้เข้าร่วมสำเร็จ'
    });
  } catch (err) {
    console.error('Error in markAsAttended:', err);
    next(err);
  }
};

/**
 * กำหนดจำนวนชั่วโมงและคะแนนให้ผู้ที่เข้าร่วมกิจกรรมแล้ว
 */
exports.assignHoursAndPoints = async (req, res, next) => {
  try {
    const { activityId, applicantId } = req.params;
    const { hours, points } = req.body;
    
    // ตรวจสอบข้อมูลที่ส่งมา
    if (hours === undefined || points === undefined) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุจำนวนชั่วโมงและคะแนน'
      });
    }
    
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
        message: 'คุณไม่มีสิทธิ์กำหนดชั่วโมงและคะแนนสำหรับกิจกรรมนี้'
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
    
    // ตรวจสอบว่าผู้สมัครเข้าร่วมกิจกรรมแล้ว
    if (application.status !== 'เข้าร่วม') {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถกำหนดชั่วโมงและคะแนนได้ เนื่องจากผู้สมัครยังไม่ได้เข้าร่วมกิจกรรม'
      });
    }
    
    // สร้างหรืออัปเดตข้อมูลการเข้าร่วมในตาราง activity_participation
    await pool.query(`
      INSERT INTO activity_participation (activity_id, user_id, hours, points, verified_by, verified_at)
      VALUES (?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
      hours = VALUES(hours), 
      points = VALUES(points), 
      verified_by = VALUES(verified_by), 
      verified_at = NOW()
    `, [activityId, application.user_id, hours, points, req.user.id]);
    
    res.status(200).json({
      success: true,
      message: 'กำหนดชั่วโมงและคะแนนสำเร็จ',
      data: {
        applicantId: parseInt(applicantId),
        hours: parseFloat(hours),
        points: parseFloat(points)
      }
    });
  } catch (err) {
    console.error('Error in assignHoursAndPoints:', err);
    next(err);
  }
};

/**
 * กำหนดจำนวนชั่วโมงและคะแนนให้ผู้เข้าร่วมทั้งหมดพร้อมกัน
 */
exports.assignHoursAndPointsToAll = async (req, res, next) => {
  try {
    const { activityId } = req.params;
    const { hours, points } = req.body;
    
    // ตรวจสอบข้อมูลที่ส่งมา
    if (hours === undefined || points === undefined) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุจำนวนชั่วโมงและคะแนน'
      });
    }
    
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
        message: 'คุณไม่มีสิทธิ์กำหนดชั่วโมงและคะแนนสำหรับกิจกรรมนี้'
      });
    }
    
    // ดึงรายชื่อผู้เข้าร่วมทั้งหมด
    const [attendees] = await pool.query(
      'SELECT * FROM activity_applications WHERE activity_id = ? AND status = "เข้าร่วม"',
      [activityId]
    );
    
    if (attendees.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบผู้เข้าร่วมกิจกรรมนี้'
      });
    }
    
    // สร้างหรืออัปเดตข้อมูลการเข้าร่วมสำหรับผู้เข้าร่วมทุกคน
    for (const attendee of attendees) {
      await pool.query(`
        INSERT INTO activity_participation (activity_id, user_id, hours, points, verified_by, verified_at)
        VALUES (?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE 
        hours = VALUES(hours), 
        points = VALUES(points), 
        verified_by = VALUES(verified_by), 
        verified_at = NOW()
      `, [activityId, attendee.user_id, hours, points, req.user.id]);
    }
    
    res.status(200).json({
      success: true,
      message: `กำหนดชั่วโมงและคะแนนสำเร็จสำหรับผู้เข้าร่วมทั้งหมด ${attendees.length} คน`,
      data: {
        attendeeCount: attendees.length,
        hours: parseFloat(hours),
        points: parseFloat(points)
      }
    });
  } catch (err) {
    console.error('Error in assignHoursAndPointsToAll:', err);
    next(err);
  }
};