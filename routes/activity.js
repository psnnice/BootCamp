// ไฟล์ - routes/activity.js
const express = require('express');
// นำเข้า controller
const activityController = require('../controllers/activityController');
const { protect } = require('../middleware/auth');

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

module.exports = router;