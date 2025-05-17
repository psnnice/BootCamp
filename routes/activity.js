// ไฟล์ - routes/activity.js
const express = require('express');
// นำเข้า controller
const activityController = require('../controllers/activityController');
const { protect, authorize } = require('../middleware/auth');
const applicantController = require('../controllers/applicantController');
const router = express.Router();


/**
 * @swagger
 * /api/activities:
 *   post:
 *     summary: สร้างกิจกรรมใหม่ (เฉพาะ staff และ admin เท่านั้น)
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category_id
 *               - start_time
 *               - end_time
 *               - max_participants
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 example: กิจกรรมปลูกป่า
 *               description:
 *                 type: string
 *                 example: ปลูกต้นไม้ที่เขาใหญ่
 *               category_id:
 *                 type: integer
 *                 example: 1
 *               category:
 *                 type: string
 *                 enum: [อาสา, ช่วยงาน, อบรม]
 *                 example: อาสา
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-06-01T08:00:00Z
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-06-03T17:00:00Z
 *               max_participants:
 *                 type: integer
 *                 example: 50
 *     responses:
 *       201:
 *         description: สร้างกิจกรรมสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: สร้างกิจกรรมสำเร็จ
 *                 data:
 *                   type: object
 *       403:
 *         description: ไม่มีสิทธิ์ในการสร้างกิจกรรม
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: คุณไม่มีสิทธิ์สร้างกิจกรรม
 *       500:
 *         description: เซิร์ฟเวอร์ผิดพลาด
 */
router.post('/', protect, activityController.createActivity);



/**
 * @swagger
 * /api/activities:
 *   get:
 *     summary: ดึงกิจกรรมทั้งหมด (พร้อมตัวกรองและการแบ่งหน้า)
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: หน้าปัจจุบัน (ค่าเริ่มต้นคือ 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: false
 *         description: จำนวนกิจกรรมต่อหน้า (ค่าเริ่มต้นคือ 10)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         required: false
 *         description: หมวดหมู่กิจกรรม
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         required: false
 *         description: สถานะของกิจกรรม (เช่น อนุมัติ, ปฏิเสธ)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: ค้นหาจากชื่อหรือคำอธิบายกิจกรรม
 *     responses:
 *       200:
 *         description: สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 10
 *                 total:
 *                   type: integer
 *                   example: 100
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       start_time:
 *                         type: string
 *                         format: date-time
 *                       end_time:
 *                         type: string
 *                         format: date-time
 *                       max_participants:
 *                         type: integer
 *                       status:
 *                         type: string
 *                       category:
 *                         type: string
 *                       category_name:
 *                         type: string
 *                       creator_name:
 *                         type: string
 *                       isRegistered:
 *                         type: boolean
 *                       applicationStatus:
 *                         type: string
 *                       currentParticipants:
 *                         type: integer
 *                       startDate:
 *                         type: string
 *                         format: date-time
 *                       endDate:
 *                         type: string
 *                         format: date-time
 *                       maxParticipants:
 *                         type: integer
 *                       isActive:
 *                         type: boolean
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current_page:
 *                       type: integer
 *                     per_page:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *       500:
 *         description: เซิร์ฟเวอร์มีปัญหา
 */
router.get('/', protect, activityController.getAllActivities);
/**
 * @swagger
 * /api/activities/{id}:
 *   put:
 *     summary: แก้ไขข้อมูลกิจกรรม
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: รหัสกิจกรรม
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: ชื่อกิจกรรม
 *               description:
 *                 type: string
 *                 description: รายละเอียดกิจกรรม
 *               category:
 *                 type: string
 *                 enum: [อาสา, ช่วยงาน, อบรม]
 *                 description: ประเภทกิจกรรม
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 description: วันเวลาที่เริ่มต้นกิจกรรม
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 description: วันเวลาที่สิ้นสุดกิจกรรม
 *               max_participants:
 *                 type: integer
 *                 description: จำนวนผู้เข้าร่วมสูงสุด
 *               status:
 *                 type: string
 *                 enum: [อนุมัติ, ปฏิเสธ, เสร็จสิ้น, ยกเลิก]
 *                 description: สถานะกิจกรรม (เฉพาะ admin)
 *               category_id:
 *                 type: integer
 *                 description: รหัสหมวดหมู่กิจกรรม
 *     responses:
 *       200:
 *         description: แก้ไขข้อมูลสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ
 *       403:
 *         description: ไม่มีสิทธิ์แก้ไขกิจกรรม
 *       404:
 *         description: ไม่พบข้อมูลกิจกรรม
 */
router.put('/:id', protect, authorize('STAFF', 'ADMIN'), activityController.updateActivity);

/**
 * @swagger
 * /api/activities/{id}:
 *   delete:
 *     summary: ลบกิจกรรม
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: รหัสกิจกรรม
 *     responses:
 *       200:
 *         description: ลบกิจกรรมสำเร็จ
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ
 *       403:
 *         description: ไม่มีสิทธิ์ลบกิจกรรม
 *       404:
 *         description: ไม่พบข้อมูลกิจกรรม
 */
router.delete('/:id', protect, authorize('STAFF', 'ADMIN'), activityController.deleteActivity);

/**
 * @swagger
 * /api/activities/{id}/status:
 *   put:
 *     summary: อัปเดตสถานะกิจกรรม (เสร็จสิ้น/ยกเลิก)
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: รหัสกิจกรรม
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [อนุมัติ, เสร็จสิ้น, ยกเลิก]
 *                 description: สถานะใหม่ของกิจกรรม
 *             example:
 *               status: "เสร็จสิ้น"
 *     responses:
 *       200:
 *         description: อัปเดตสถานะสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ
 *       403:
 *         description: ไม่มีสิทธิ์แก้ไขสถานะกิจกรรม
 *       404:
 *         description: ไม่พบข้อมูลกิจกรรม
 */
router.put('/:id/status', protect, authorize('STAFF', 'ADMIN'), activityController.updateActivityStatus);

/**
 * @swagger
 * /api/activities/{id}/approve:
 *   post:
 *     summary: อนุมัติหรือปฏิเสธกิจกรรมโดย Admin
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: รหัสกิจกรรม
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approved:
 *                 type: boolean
 *                 description: true เพื่ออนุมัติ, false เพื่อปฏิเสธ
 *             example:
 *               approved: true
 *     responses:
 *       200:
 *         description: อนุมัติหรือปฏิเสธกิจกรรมสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ
 *       403:
 *         description: ไม่มีสิทธิ์อนุมัติกิจกรรม
 *       404:
 *         description: ไม่พบข้อมูลกิจกรรม
 */
router.post('/:id/approve', protect, authorize('ADMIN'), activityController.approveActivity);

/**
 * @swagger
 * /api/activities/{id}/applicants:
 *   get:
 *     summary: ดึงข้อมูลผู้สมัครทั้งหมดในกิจกรรม
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: รหัสกิจกรรม
 *     responses:
 *       200:
 *         description: ดึงข้อมูลสำเร็จ
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ
 *       403:
 *         description: ไม่มีสิทธิ์เข้าถึงข้อมูล
 *       404:
 *         description: ไม่พบข้อมูลกิจกรรม
 */
router.get('/:id/applicants', protect, authorize('STAFF', 'ADMIN'), applicantController.getApplicants);

/**
 * @swagger
 * /api/activities/{activityId}/applicants/{applicantId}/approve:
 *   post:
 *     summary: อนุมัติผู้สมัครเข้าร่วมกิจกรรม
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: activityId
 *         schema:
 *           type: integer
 *         required: true
 *         description: รหัสกิจกรรม
 *       - in: path
 *         name: applicantId
 *         schema:
 *           type: integer
 *         required: true
 *         description: รหัสการสมัคร
 *     responses:
 *       200:
 *         description: อนุมัติผู้สมัครสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ
 *       403:
 *         description: ไม่มีสิทธิ์อนุมัติผู้สมัคร
 *       404:
 *         description: ไม่พบข้อมูล
 */
router.post('/:activityId/applicants/:applicantId/approve', protect, authorize('STAFF', 'ADMIN'), applicantController.approveApplicant);

/**
 * @swagger
 * /api/activities/{activityId}/applicants/{applicantId}/reject:
 *   post:
 *     summary: ปฏิเสธผู้สมัครเข้าร่วมกิจกรรม
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: activityId
 *         schema:
 *           type: integer
 *         required: true
 *         description: รหัสกิจกรรม
 *       - in: path
 *         name: applicantId
 *         schema:
 *           type: integer
 *         required: true
 *         description: รหัสการสมัคร
 *     responses:
 *       200:
 *         description: ปฏิเสธผู้สมัครสำเร็จ
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ
 *       403:
 *         description: ไม่มีสิทธิ์ปฏิเสธผู้สมัคร
 *       404:
 *         description: ไม่พบข้อมูล
 */
router.post('/:activityId/applicants/:applicantId/reject', protect, authorize('STAFF', 'ADMIN'), applicantController.rejectApplicant);

// ไฟล์ - routes/activity.js
// เพิ่มเส้นทาง API สำหรับการสมัครกิจกรรม

/**
 * @swagger
 * /api/activities/{id}/apply:
 *   post:
 *     summary: สมัครเข้าร่วมกิจกรรม
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: รหัสกิจกรรม
 *     responses:
 *       201:
 *         description: สมัครกิจกรรมสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: สมัครกิจกรรมสำเร็จ กรุณารอการอนุมัติ
 *       400:
 *         description: ไม่สามารถสมัครได้ (มีการสมัครแล้ว, กิจกรรมเต็ม, ฯลฯ)
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ
 *       404:
 *         description: ไม่พบกิจกรรม
 */
router.post('/:id/apply', protect, activityController.applyForActivity);

/**
 * @swagger
 * /api/activities/{id}/cancel:
 *   delete:
 *     summary: ยกเลิกการสมัครกิจกรรม
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: รหัสกิจกรรม
 *     responses:
 *       200:
 *         description: ยกเลิกการสมัครสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: ยกเลิกการสมัครสำเร็จ
 *       400:
 *         description: ไม่สามารถยกเลิกได้ (เช่น กิจกรรมเริ่มไปแล้ว)
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ
 *       404:
 *         description: ไม่พบการสมัคร
 */
router.delete('/:id/apply', protect, activityController.cancelApplication);

/**
 * @swagger
 * /api/activities/{id}/toggle:
 *   post:
 *     summary: สลับสถานะการสมัคร (สมัครหรือยกเลิก)
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: รหัสกิจกรรม
 *     responses:
 *       200:
 *         description: ดำเนินการสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: สมัครกิจกรรมสำเร็จ หรือ ยกเลิกการสมัครสำเร็จ
 *                 isRegistered:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: ไม่สามารถดำเนินการได้
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ
 *       404:
 *         description: ไม่พบกิจกรรม
 */
router.post('/:id/toggle', protect, activityController.toggleRegistration);


/**
 * @swagger
 * /api/activities/{id}/participants:
 *   get:
 *     summary: ดึงข้อมูลผู้สมัครที่ได้รับการอนุมัติ (สำหรับนิสิต)
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: รหัสกิจกรรม
 *     responses:
 *       200:
 *         description: ดึงข้อมูลสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 activity_id:
 *                   type: integer
 *                   example: 5
 *                 total_applicants:
 *                   type: integer
 *                   example: 25
 *                 approved_applicants:
 *                   type: integer
 *                   example: 15
 *                 max_participants:
 *                   type: integer
 *                   example: 50
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       firstname:
 *                         type: string
 *                       lastname:
 *                         type: string
 *                       faculty_name:
 *                         type: string
 *                       major_name:
 *                         type: string
 *                       status:
 *                         type: string
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ
 *       403:
 *         description: ไม่มีสิทธิ์เข้าถึงข้อมูล
 *       404:
 *         description: ไม่พบข้อมูลกิจกรรม
 */
router.get('/:id/participants', protect, applicantController.getApplicantsForStudent);

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
 * @swagger
 * /api/activities/{id}/attendees:
 *   get:
 *     summary: ดึงข้อมูลผู้เข้าร่วมกิจกรรม (เฉพาะคนที่เช็คชื่อแล้ว)
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: รหัสกิจกรรม
 *     responses:
 *       200:
 *         description: ดึงข้อมูลสำเร็จ
 */
router.get('/:id/attendees', protect, authorize('STAFF', 'ADMIN'), applicantController.getActivityAttendees);
// ในไฟล์ routes/activity.js
/**
 * @swagger
 * /api/activities/{activityId}/applicants/{applicantId}/attend:
 *   post:
 *     summary: ทำเครื่องหมายผู้สมัครว่าเข้าร่วมกิจกรรม (เช็คชื่อ)
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: activityId
 *         schema:
 *           type: integer
 *         required: true
 *         description: รหัสกิจกรรม
 *       - in: path
 *         name: applicantId
 *         schema:
 *           type: integer
 *         required: true
 *         description: รหัสการสมัคร
 *     responses:
 *       200:
 *         description: เช็คชื่อผู้เข้าร่วมสำเร็จ
 */
router.post('/:activityId/applicants/:applicantId/attend', protect, authorize('STAFF', 'ADMIN'), applicantController.markAsAttended);

/**
 * @swagger
 * /api/activities/{activityId}/applicants/{applicantId}/score:
 *   post:
 *     summary: กำหนดชั่วโมงและคะแนนให้ผู้เข้าร่วมกิจกรรม
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: activityId
 *         schema:
 *           type: integer
 *         required: true
 *         description: รหัสกิจกรรม
 *       - in: path
 *         name: applicantId
 *         schema:
 *           type: integer
 *         required: true
 *         description: รหัสการสมัคร
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hours:
 *                 type: number
 *                 description: จำนวนชั่วโมง
 *               points:
 *                 type: number
 *                 description: จำนวนคะแนน
 *     responses:
 *       200:
 *         description: กำหนดชั่วโมงและคะแนนสำเร็จ
 */
router.post('/:activityId/applicants/:applicantId/score', protect, authorize('STAFF', 'ADMIN'), applicantController.assignHoursAndPoints);

/**
 * @swagger
 * /api/activities/{activityId}/attendees/score:
 *   post:
 *     summary: กำหนดชั่วโมงและคะแนนให้ผู้เข้าร่วมทั้งหมดพร้อมกัน
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: activityId
 *         schema:
 *           type: integer
 *         required: true
 *         description: รหัสกิจกรรม
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hours:
 *                 type: number
 *                 description: จำนวนชั่วโมง
 *               points:
 *                 type: number
 *                 description: จำนวนคะแนน
 *     responses:
 *       200:
 *         description: กำหนดชั่วโมงและคะแนนสำเร็จสำหรับผู้เข้าร่วมทั้งหมด
 */
router.post('/:activityId/attendees/score', protect, authorize('STAFF', 'ADMIN'), applicantController.assignHoursAndPointsToAll);
module.exports = router;