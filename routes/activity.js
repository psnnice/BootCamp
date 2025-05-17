// ไฟล์ - routes/activity.js
const express = require('express');
// นำเข้า controller
const activityController = require('../controllers/activityController');
const { protect, authorize } = require('../middleware/auth');
const applicantController = require('../controllers/applicantController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Activities
 *   description: การจัดการข้อมูลกิจกรรม
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Activity:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: รหัสกิจกรรม
 *         title:
 *           type: string
 *           description: ชื่อกิจกรรม
 *         description:
 *           type: string
 *           description: รายละเอียดกิจกรรม
 *         category:
 *           type: string
 *           description: ประเภทกิจกรรม
 *           enum: [อาสา, ช่วยงาน, อบรม]
 *         start_time:
 *           type: string
 *           format: date-time
 *           description: วันเวลาที่เริ่มต้น
 *         end_time:
 *           type: string
 *           format: date-time
 *           description: วันเวลาที่สิ้นสุด
 *         max_participants:
 *           type: integer
 *           description: จำนวนผู้เข้าร่วมสูงสุด
 *         status:
 *           type: string
 *           description: สถานะกิจกรรม
 *           enum: [รออนุมัติ, อนุมัติ, ปฏิเสธ, เสร็จสิ้น, ยกเลิก]
 *         created_by:
 *           type: integer
 *           description: รหัสผู้สร้างกิจกรรม
 *         creator_name:
 *           type: string
 *           description: ชื่อผู้สร้างกิจกรรม
 *         category_id:
 *           type: integer
 *           description: รหัสหมวดหมู่
 *         category_name:
 *           type: string
 *           description: ชื่อหมวดหมู่
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: วันเวลาที่สร้าง
 *         application_count:
 *           type: integer
 *           description: จำนวนผู้สมัครเข้าร่วม
 */

/**
 * @swagger
 * /api/activities:
 *   get:
 *     summary: ดึงข้อมูลกิจกรรมทั้งหมด
 *     tags: [Activities]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: หน้าที่ต้องการดึงข้อมูล
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: จำนวนรายการต่อหน้า
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [อาสา, ช่วยงาน, อบรม]
 *         description: กรองตามประเภทกิจกรรม
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [รออนุมัติ, อนุมัติ, ปฏิเสธ, เสร็จสิ้น, ยกเลิก]
 *         description: กรองตามสถานะกิจกรรม (ใช้ได้เฉพาะ staff และ admin)
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
 *                 total:
 *                   type: integer
 *                   example: 20
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current_page:
 *                       type: integer
 *                       example: 1
 *                     per_page:
 *                       type: integer
 *                       example: 10
 *                     total_pages:
 *                       type: integer
 *                       example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Activity'
 */
router.get('/', activityController.getAllActivities);

/**
 * @swagger
 * /api/activities/{id}:
 *   get:
 *     summary: ดึงข้อมูลกิจกรรมตาม ID
 *     tags: [Activities]
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
 *                 data:
 *                   $ref: '#/components/schemas/Activity'
 *       404:
 *         description: ไม่พบข้อมูล
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
 *                   example: ไม่พบข้อมูลกิจกรรม
 */
router.get('/:id', activityController.getActivityById);




/**
 * @swagger
 * /api/activities/{id}/status:
 *   put:
 *     summary: อัปเดตสถานะกิจกรรม (เสร็จสิ้น/ยกเลิก)
 *     tags:
 *       - Activities
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
 *       "200":
 *         description: อัปเดตสถานะสำเร็จ
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
 *                   example: "อัปเดตสถานะกิจกรรมเป็น เสร็จสิ้น สำเร็จ"
 *       "400":
 *         description: ข้อมูลไม่ถูกต้อง
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
 *                   example: "สถานะไม่ถูกต้อง"
 */
router.put('/:id/status', protect, authorize('STAFF', 'ADMIN'), activityController.updateActivityStatus);

/**
 * @swagger
 * /api/activities/{id}/approve:
 *   post:
 *     summary: อนุมัติหรือปฏิเสธกิจกรรมโดย Admin
 *     tags:
 *       - Activities
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
 *       "200":
 *         description: อนุมัติหรือปฏิเสธกิจกรรมสำเร็จ
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
 *                   example: "อนุมัติกิจกรรมสำเร็จ"
 */
router.post('/:id/approve', protect, authorize('ADMIN'), activityController.approveActivity);

/**
 * @swagger
 * /api/activities/{id}/applicants:
 *   get:
 *     summary: ดึงข้อมูลผู้สมัครทั้งหมดในกิจกรรม
 *     tags:
 *       - Activities
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
 *       "200":
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
 *                       status:
 *                         type: string
 *                       applied_at:
 *                         type: string
 *                         format: date-time
 *                       user_id:
 *                         type: integer
 *                       student_id:
 *                         type: string
 *                       firstname:
 *                         type: string
 *                       lastname:
 *                         type: string
 */
router.get('/:id/applicants', protect, authorize('STAFF', 'ADMIN'), applicantController.getApplicants);
/**
 * @swagger
 * /api/activities/{activityId}/applicants/{applicantId}/approve:
 *   post:
 *     summary: อนุมัติผู้สมัครเข้าร่วมกิจกรรม
 *     tags: [Applicants]
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
 *                   example: อนุมัติผู้สมัครสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง
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
 *                   example: ไม่สามารถอนุมัติได้ เนื่องจากกิจกรรมมีผู้เข้าร่วมเต็มแล้ว
 *       403:
 *         description: ไม่มีสิทธิ์เข้าถึง
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
 *                   example: คุณไม่มีสิทธิ์อนุมัติผู้สมัครกิจกรรมนี้
 *       404:
 *         description: ไม่พบข้อมูล
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
 *                   example: ไม่พบข้อมูลการสมัครนี้
 */
router.post('/:activityId/applicants/:applicantId/approve', protect, authorize('STAFF', 'ADMIN'), applicantController.approveApplicant);

/**
 * @swagger
 * /api/activities/{activityId}/applicants/{applicantId}/reject:
 *   post:
 *     summary: ปฏิเสธผู้สมัครเข้าร่วมกิจกรรม
 *     tags: [Applicants]
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
 *                   example: ปฏิเสธผู้สมัครสำเร็จ
 *       403:
 *         description: ไม่มีสิทธิ์เข้าถึง
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
 *                   example: คุณไม่มีสิทธิ์ปฏิเสธผู้สมัครกิจกรรมนี้
 *       404:
 *         description: ไม่พบข้อมูล
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
 *                   example: ไม่พบข้อมูลการสมัครนี้
 */
router.post('/:activityId/applicants/:applicantId/reject', protect, authorize('STAFF', 'ADMIN'), applicantController.rejectApplicant);

/**
 * @swagger
 * /api/activities/{id}:
 *   put:
 *     summary: แก้ไขข้อมูลกิจกรรม
 *     tags:
 *       - Activities
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
 *               location:
 *                 type: string
 *                 description: สถานที่จัดกิจกรรม
 *               cover_image:
 *                 type: string
 *                 description: URL รูปภาพปก
 *     responses:
 *       "200":
 *         description: แก้ไขข้อมูลสำเร็จ
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
 *                   example: "แก้ไขข้อมูลกิจกรรมสำเร็จ"
 *                 data:
 *                   $ref: "#/components/schemas/Activity"
 *       "400":
 *         description: ข้อมูลไม่ถูกต้อง
 *       "403":
 *         description: ไม่มีสิทธิ์เข้าถึง
 *       "404":
 *         description: ไม่พบข้อมูล
 */
router.put('/:id', protect, authorize('STAFF', 'ADMIN'), activityController.updateActivity);



module.exports = router;