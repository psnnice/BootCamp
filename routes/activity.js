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
 *               - start_date
 *               - end_date
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
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: 2025-06-01
 *               end_date:
 *                 type: string
 *                 format: date
 *                 example: 2025-06-03
 *     responses:
 *       201:
 *         description: สร้างกิจกรรมสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: สร้างกิจกรรมสำเร็จ
 *                 activity_id:
 *                   type: integer
 *                   example: 10
 *       403:
 *         description: ไม่มีสิทธิ์ในการสร้างกิจกรรม
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
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
 *               location:
 *                 type: string
 *                 description: สถานที่จัดกิจกรรม
 *               hours:
 *                 type: number
 *                 description: จำนวนชั่วโมงกิจกรรม
 *               points:
 *                 type: number
 *                 description: คะแนนที่จะได้รับ
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

module.exports = router;


/**
 * @swagger
 * /api/activities/my:
 *   get:
 *     summary: ดึงข้อมูลกิจกรรมที่นิสิตได้สมัครไว้
 *     tags: [Activities]
 *     description: ดึงข้อมูลกิจกรรมที่นิสิตเคยสมัครทั้งหมด พร้อมสถานะการสมัคร
 *     security:
 *       - bearerAuth: []
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
 *                 count:
 *                   type: integer
 *                   example: 5
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
 *                       type:
 *                         type: string
 *                       status:
 *                         type: string
 *                       startDate:
 *                         type: string
 *                         format: date-time
 *                       endDate:
 *                         type: string
 *                         format: date-time
 *                       maxParticipants:
 *                         type: integer
 *                       isRegistered:
 *                         type: boolean
 *                       applicationStatus:
 *                         type: string
 *                       appliedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ
 */
router.get('/my', protect, activityController.getMyActivities);



/**
 * @swagger
 * /api/activities/pending:
 *   get:
 *     summary: ดึงกิจกรรมที่รออนุมัติ (Admin เท่านั้น)
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
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
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Activity'
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ
 *       403:
 *         description: ไม่มีสิทธิ์เข้าถึงข้อมูล
 */
router.get('/pending', protect, authorize('ADMIN'), activityController.getPendingActivities);

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