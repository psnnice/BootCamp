// ไฟล์ - routes/auth.js
const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: การจัดการระบบยืนยันตัวตน
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: ลงทะเบียนผู้ใช้ใหม่
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - student_id
 *               - password
 *               - full_name
 *             properties:
 *               student_id:
 *                 type: string
 *                 description: รหัสนิสิต 8 หลัก
 *               password:
 *                 type: string
 *                 format: password
 *                 description: รหัสผ่าน
 *               full_name:
 *                 type: string
 *                 description: ชื่อ-นามสกุล
 *               faculty_id:
 *                 type: integer
 *                 description: รหัสคณะ
 *               major_id:
 *                 type: integer
 *                 description: รหัสสาขา
 *             example:
 *               student_id: "12345678"
 *               password: "password123"
 *               full_name: "ชื่อ นามสกุล"
 *               faculty_id: 2
 *               major_id: 7
 *     responses:
 *       201:
 *         description: ลงทะเบียนสำเร็จ
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
 *                   example: ลงทะเบียนสำเร็จ
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         student_id:
 *                           type: string
 *                         full_name:
 *                           type: string
 *                         role:
 *                           type: string
 *                     token:
 *                       type: string
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
 *                   example: กรุณากรอกข้อมูลให้ครบถ้วน
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: เข้าสู่ระบบ
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - student_id
 *               - password
 *             properties:
 *               student_id:
 *                 type: string
 *                 description: รหัสนิสิต 8 หลัก
 *               password:
 *                 type: string
 *                 format: password
 *                 description: รหัสผ่าน
 *             example:
 *               student_id: "12345678"
 *               password: "password123"
 *     responses:
 *       200:
 *         description: เข้าสู่ระบบสำเร็จ
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
 *                   example: เข้าสู่ระบบสำเร็จ
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         student_id:
 *                           type: string
 *                         full_name:
 *                           type: string
 *                         role:
 *                           type: string
 *                     token:
 *                       type: string
 *       401:
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
 *                   example: รหัสนิสิตหรือรหัสผ่านไม่ถูกต้อง
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: ดึงข้อมูลผู้ใช้ปัจจุบัน
 *     tags: [Authentication]
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     student_id:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     role:
 *                       type: string
 *                     faculty_id:
 *                       type: integer
 *                     faculty_name:
 *                       type: string
 *                     major_id:
 *                       type: integer
 *                     major_name:
 *                       type: string
 *                     total_hours:
 *                       type: number
 *                     total_points:
 *                       type: number
 *       401:
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
 *                   example: กรุณาเข้าสู่ระบบก่อนเข้าถึงข้อมูล
 */
router.get('/me', protect, getMe);

module.exports = router;