const express = require('express');
const { restrictToAdminToken } = require('../middleware/adminAuth');
const { 
  createUserBan,
  deactivateUserBan,
  getAllUserBans
} = require('../controllers/userBanController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: User Bans
 *   description: การจัดการการระงับบัญชีผู้ใช้
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserBan:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: รหัสการแบน
 *         user_id:
 *           type: integer
 *           description: รหัสผู้ใช้ที่ถูกแบน
 *         reason:
 *           type: string
 *           description: เหตุผลของการแบน
 *         banned_by:
 *           type: integer
 *           description: รหัสผู้ใช้ (แอดมิน) ที่ทำการแบน
 *         banned_at:
 *           type: string
 *           format: date-time
 *           description: วันเวลาที่แบน
 *         expires_at:
 *           type: string
 *           format: date-time
 *           description: วันเวลาที่การแบนจะหมดอายุ (ถ้ามี)
 *         is_active:
 *           type: boolean
 *           description: สถานะการแบน (true = ยังแบนอยู่)
 *         ban_count:
 *           type: integer
 *           description: จำนวนครั้งที่ผู้ใช้ถูกแบน
 *       example:
 *         id: 1
 *         user_id: 2
 *         reason: "พฤติกรรมไม่เหมาะสม"
 *         banned_by: 1
 *         banned_at: "2025-05-16T22:30:00.000Z"
 *         expires_at: "2025-06-16T22:30:00.000Z"
 *         is_active: true
 *         ban_count: 1
 *     DeactivatedBan:
 *       type: object
 *       properties:
 *         user_id:
 *           type: integer
 *           description: รหัสผู้ใช้
 *         email:
 *           type: string
 *           description: อีเมลของผู้ใช้
 *         ban_count:
 *           type: integer
 *           description: จำนวนครั้งที่ถูกแบน
 *         is_banned:
 *           type: boolean
 *           description: สถานะการแบนปัจจุบัน
 *       example:
 *         user_id: 2
 *         email: "user@example.com"
 *         ban_count: 1
 *         is_banned: false
 */

/**
 * @swagger
 * /api/user-ban:
 *   post:
 *     summary: สร้างการแบนผู้ใช้ใหม่
 *     tags: [User Bans]
 *     description: เพิ่มการแบนผู้ใช้โดยแอดมิน ต้องระบุเหตุผลและสามารถกำหนดวันหมดอายุได้
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - reason
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: รหัสผู้ใช้ที่ต้องการแบน
 *               reason:
 *                 type: string
 *                 description: เหตุผลของการแบน
 *               expires_at:
 *                 type: string
 *                 format: date-time
 *                 description: วันเวลาที่การแบนจะหมดอายุ (ไม่บังคับ)
 *             example:
 *               user_id: 2
 *               reason: "พฤติกรรมไม่เหมาะสม"
 *               expires_at: "2025-06-16T22:30:00Z"
 *     responses:
 *       201:
 *         description: การแบนสำเร็จ
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
 *                   example: แบนผู้ใช้สำเร็จ
 *                 data:
 *                   $ref: '#/components/schemas/UserBan'
 *       400:
 *         description: ข้อมูลไม่ถูกต้องหรือผู้ใช้เป็นแอดมิน
 *       401:
 *         description: Token ไม่ถูกต้องหรือไม่ได้ลงทะเบียน
 *       403:
 *         description: ไม่ใช่แอดมินหรือบัญชีถูกแบน
 *       404:
 *         description: ไม่พบผู้ใช้
 */
router.post('/user-ban', restrictToAdminToken, createUserBan);

/**
 * @swagger
 * /api/user-ban:
 *   patch:
 *     summary: ยกเลิกการแบน
 *     tags: [User Bans]
 *     description: ลบการแบนที่ใช้งานอยู่โดยใช้อีเมล
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 description: อีเมลของผู้ใช้ที่ต้องการยกเลิกการแบน
 *             example:
 *               email: "user@example.com"
 *     responses:
 *       200:
 *         description: ยกเลิกการแบันสำเร็จ
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
 *                   example: ยกเลิกการแบนสำเร็จ
 *                 data:
 *                   $ref: '#/components/schemas/DeactivatedBan'
 *       400:
 *         description: ไม่ระบุอีเมล
 *       401:
 *         description: Token ไม่ถูกต้องหรือไม่ได้ลงทะเบียน
 *       403:
 *         description: ไม่ใช่แอดมินหรือบัญชีถูกแบน
 *       404:
 *         description: ไม่พบผู้ใช้หรือการแบน
 */
router.patch('/user-ban', restrictToAdminToken, deactivateUserBan);

/**
 * @swagger
 * /api/user-ban:
 *   get:
 *     summary: ดึงข้อมูลการแบนทั้งหมด
 *     tags: [User Bans]
 *     description: ดึงรายการการแบนทั้งหมด (เฉพาะแอดมิน)
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
 *                   example: 1
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserBan'
 *       401:
 *         description: Token ไม่ถูกต้องหรือไม่ได้ลงทะเบียน
 *       403:
 *         description: ไม่ใช่แอดมินหรือบัญชีถูกแบน
 */
router.get('/user-ban', restrictToAdminToken, getAllUserBans);

module.exports = router;