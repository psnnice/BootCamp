// routes/faculty.js
const express = require('express');
const facultyController = require('../controllers/facultyController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Faculties
 *   description: การจัดการข้อมูลคณะ
 */

/**
 * @swagger
 * /api/faculties:
 *   get:
 *     summary: ดึงข้อมูลคณะทั้งหมด
 *     tags: [Faculties]
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
 *                       name:
 *                         type: string
 */
router.get('/', facultyController.getAllFaculties);

/**
 * @swagger
 * /api/faculties/{id}:
 *   get:
 *     summary: ดึงข้อมูลคณะตาม ID
 *     tags: [Faculties]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: รหัสคณะ
 *     responses:
 *       200:
 *         description: ดึงข้อมูลสำเร็จ
 *       404:
 *         description: ไม่พบข้อมูล
 */
router.get('/:id', facultyController.getFacultyById);

/**
 * @swagger
 * /api/majors:
 *   get:
 *     summary: ดึงข้อมูลสาขาทั้งหมด
 *     tags: [Faculties]
 *     responses:
 *       200:
 *         description: ดึงข้อมูลสำเร็จ
 */
router.get('/majors/all', facultyController.getAllMajors);

/**
 * @swagger
 * /api/majors/{id}:
 *   get:
 *     summary: ดึงข้อมูลสาขาตาม ID
 *     tags: [Faculties]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: รหัสสาขา
 *     responses:
 *       200:
 *         description: ดึงข้อมูลสำเร็จ
 *       404:
 *         description: ไม่พบข้อมูล
 */
router.get('/majors/:id', facultyController.getMajorById);

/**
 * @swagger
 * /api/faculties/{faculty_id}/majors:
 *   get:
 *     summary: ดึงข้อมูลสาขาตามคณะ
 *     tags: [Faculties]
 *     parameters:
 *       - in: path
 *         name: faculty_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: รหัสคณะ
 *     responses:
 *       200:
 *         description: ดึงข้อมูลสำเร็จ
 *       404:
 *         description: ไม่พบข้อมูลคณะที่ระบุ
 */
router.get('/:faculty_id/majors', facultyController.getMajorsByFacultyId);

module.exports = router;