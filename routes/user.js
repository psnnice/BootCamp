// ไฟล์ - routes/user.js
const express = require('express');
const { 
  getAllUsers,
  getUserById
} = require('../controllers/userController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: การจัดการข้อมูลผู้ใช้งาน
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: รหัสผู้ใช้
 *         student_id:
 *           type: string
 *           description: รหัสนิสิต
 *         firstname:
 *           type: string
 *           description: ชื่อ
 *         lastname:
 *           type: string
 *           description: นามสกุล
 *         role:
 *           type: string
 *           description: บทบาทของผู้ใช้งาน
 *           enum: [STUDENT, STAFF, ADMIN]
 *         is_banned:
 *           type: boolean
 *           description: สถานะการระงับบัญชี
 *         faculty_name:
 *           type: string
 *           description: ชื่อคณะ
 *         major_name:
 *           type: string
 *           description: ชื่อสาขา
 *         profile_image:
 *           type: string
 *           description: URL รูปโปรไฟล์
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: วันเวลาที่สร้าง
 *       example:
 *         id: 1
 *         student_id: "12345678"
 *         firstname: "John"
 *         lastname: "Doe"
 *         role: "STUDENT"
 *         is_banned: false
 *         faculty_name: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร"
 *         major_name: "สาขาวิชาวิศวกรรมซอฟต์แวร์"
 *         profile_image: null
 *         created_at: "2023-07-20T10:00:00.000Z"
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: ดึงข้อมูลผู้ใช้ทั้งหมด
 *     tags: [Users]
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
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get('/users', getAllUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: ดึงข้อมูลผู้ใช้ตาม ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: รหัสผู้ใช้
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
 *                   $ref: '#/components/schemas/User'
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
 *                   example: ไม่พบข้อมูลผู้ใช้
 */
router.get('/users/:id', getUserById);

// เพิ่มใน routes/user.js หลังจาก route ที่มีอยู่แล้ว

const { restrictToAdminToken } = require('../middleware/adminAuth');

/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     summary: เปลี่ยนบทบาทผู้ใช้
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: รหัสผู้ใช้
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [STUDENT, STAFF, ADMIN]
 *                 description: บทบาทใหม่
 *             example:
 *               role: "STAFF"
 *     responses:
 *       200:
 *         description: เปลี่ยนบทบาทสำเร็จ
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
 *                   example: เปลี่ยนบทบาทเป็น STAFF สำเร็จ
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: บทบาทไม่ถูกต้องหรือไม่สามารถเปลี่ยนได้
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ
 *       403:
 *         description: ไม่มีสิทธิ์
 *       404:
 *         description: ไม่พบผู้ใช้
 */
router.patch('/users/:id/role', restrictToAdminToken, require('../controllers/userController').changeUserRole);




module.exports = router;