const express = require('express');
const { register, login, getMe, logout, logoutAll } = require('../controllers/authController');
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
 *     description: สร้างบัญชีผู้ใช้ใหม่และออก JWT token สำหรับยืนยันตัวตน โดย token นี้จะไม่ถูกเก็บในฐานข้อมูล ผู้ใช้ต้องล็อกอินเพื่อรับ token ที่บันทึกในระบบ
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstname
 *               - lastname
 *             properties:
 *               student_id:
 *                 type: string
 *                 description: รหัสนิสิต 8 หลัก (ไม่บังคับ)
 *               email:
 *                 type: string
 *                 format: email
 *                 description: อีเมลสำหรับติดต่อและยืนยันตัวตน
 *               password:
 *                 type: string
 *                 format: password
 *                 description: รหัสผ่าน
 *               firstname:
 *                 type: string
 *                 description: ชื่อ
 *               lastname:
 *                 type: string
 *                 description: นามสกุล
 *               faculty_id:
 *                 type: integer
 *                 description: รหัสคณะ ต้องมีอยู่ในตาราง faculties (ไม่บังคับ)
 *               major_id:
 *                 type: integer
 *                 description: รหัสสาขา ต้องมีอยู่ในตาราง majors และสังกัดอยู่ใน faculty_id ที่ระบุ (ถ้ามี) (ไม่บังคับ)
 *             example:
 *               student_id: "12345678"
 *               email: "student@example.com"
 *               password: "password123"
 *               firstname: "ชื่อ"
 *               lastname: "นามสกุล"
 *               faculty_id: 2
 *               major_id: 7
 *     responses:
 *       201:
 *         description: ลงทะเบียนสำเร็จ ออก JWT token ใหม่สำหรับผู้ใช้ (ไม่เก็บในฐานข้อมูล)
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
 *                           nullable: true
 *                         email:
 *                           type: string
 *                         firstname:
 *                           type: string
 *                         lastname:
 *                           type: string
 *                         full_name:
 *                           type: string
 *                         role:
 *                           type: string
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                         faculty_id:
 *                           type: integer
 *                           nullable: true
 *                         major_id:
 *                           type: integer
 *                           nullable: true
 *                     token:
 *                       type: string
 *                       description: JWT token สำหรับยืนยันตัวตน (ไม่บันทึกในฐานข้อมูล)
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง อีเมล/รหัสนิสิตซ้ำ หรือรหัสคณะ/สาขาไม่ถูกต้อง
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
 *                   example: อีเมลนี้ถูกใช้งานแล้ว
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: เข้าสู่ระบบ
 *     tags: [Authentication]
 *     description: เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน ออก token ใหม่ซึ่งจะถูกเก็บในฐานข้อมูลและทำให้ session อื่นของผู้ใช้ถูกล็อกเอาท์ (Single Active Token Policy)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: อีเมลที่ใช้สำหรับเข้าสู่ระบบ
 *               password:
 *                 type: string
 *                 format: password
 *                 description: รหัสผ่าน
 *             example:
 *               email: "user@example.com"
 *               password: "password123"
 *     responses:
 *       200:
 *         description: เข้าสู่ระบบสำเร็จ ออก token ใหม่และล็อกเอาท์ session อื่น
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
 *                           nullable: true
 *                         email:
 *                           type: string
 *                         firstname:
 *                           type: string
 *                         lastname:
 *                           type: string
 *                         full_name:
 *                           type: string
 *                         role:
 *                           type: string
 *                         faculty_id:
 *                           type: integer
 *                           nullable: true
 *                         major_id:
 *                           type: integer
 *                           nullable: true
 *                         profile_image:
 *                           type: string
 *                           nullable: true
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                     token:
 *                       type: string
 *                       description: JWT token ใหม่สำหรับยืนยันตัวตน (บันทึกในฐานข้อมูล)
 *       401:
 *         description: อีเมลหรือรหัสผ่านไม่ถูกต้อง
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
 *                   example: อีเมลหรือรหัสผ่านไม่ถูกต้อง
 *       403:
 *         description: บัญชีถูกระงับ
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
 *                   example: บัญชีผู้ใช้ถูกระงับการใช้งาน
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: ออกจากระบบ
 *     tags: [Authentication]
 *     description: ออกจากระบบโดยการทำให้ token ที่ใช้อยู่ไม่สามารถใช้งานได้
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ออกจากระบบสำเร็จ
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
 *                   example: ออกจากระบบสำเร็จ
 *       400:
 *         description: ไม่พบ token
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
 *                   example: ไม่พบ token สำหรับออกจากระบบ
 */
router.post('/logout', logout);

/**
 * @swagger
 * /api/auth/logout-all:
 *   post:
 *     summary: ออกจากระบบทุกอุปกรณ์
 *     tags: [Authentication]
 *     description: ออกจากระบบทุกอุปกรณ์โดยการทำให้ token ทั้งหมดของผู้ใช้ไม่สามารถใช้งานได้
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ออกจากระบบทุกอุปกรณ์สำเร็จ
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
 *                   example: ออกจากระบบทุกอุปกรณ์สำเร็จ
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionsEnded:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: ไม่มีสิทธิ์เข้าถึงหรือ token ไม่ถูกต้อง
 */
router.post('/logout-all', protect, logoutAll);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: ดึงข้อมูลผู้ใช้ปัจจุบัน
 *     tags: [Authentication]
 *     description: ดึงข้อมูลผู้ใช้ที่ยืนยันตัวตนแล้ว รวมถึงชั่วโมงและคะแนนอาสา ต้องใช้ token ที่ valid (จาก register หรือ login)
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
 *                       nullable: true
 *                     email:
 *                       type: string
 *                       nullable: true
 *                     firstname:
 *                       type: string
 *                     lastname:
 *                       type: string
 *                     role:
 *                       type: string
 *                     faculty_id:
 *                       type: integer
 *                       nullable: true
 *                     faculty_name:
 *                       type: string
 *                       nullable: true
 *                     major_id:
 *                       type: integer
 *                       nullable: true
 *                     major_name:
 *                       type: string
 *                       nullable: true
 *                     profile_image:
 *                       type: string
 *                       nullable: true
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     total_hours:
 *                       type: number
 *                     total_points:
 *                       type: number
 *       401:
 *         description: ไม่มีสิทธิ์เข้าถึงหรือ token ไม่ถูกต้อง
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
 *                   example: Token ไม่ถูกต้องหรือหมดอายุ
 *       403:
 *         description: บัญชีถูกระงับ
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
 *                   example: บัญชีผู้ใช้ถูกระงับการใช้งาน
 */
router.get('/me', protect, getMe);

module.exports = router;