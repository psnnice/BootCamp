// controllers/facultyController.js
const { pool } = require('../config/db');

// ดึงข้อมูลคณะทั้งหมด
exports.getAllFaculties = async (req, res, next) => {
  try {
    const [faculties] = await pool.query('SELECT * FROM faculties ORDER BY name');
    
    res.status(200).json({
      success: true,
      count: faculties.length,
      data: faculties
    });
  } catch (err) {
    console.error('Error in getAllFaculties:', err);
    next(err);
  }
};

// ดึงข้อมูลคณะตาม ID
exports.getFacultyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [faculty] = await pool.query('SELECT * FROM faculties WHERE id = ?', [id]);
    
    if (faculty.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลคณะ'
      });
    }
    
    res.status(200).json({
      success: true,
      data: faculty[0]
    });
  } catch (err) {
    console.error('Error in getFacultyById:', err);
    next(err);
  }
};

// ดึงข้อมูลสาขาทั้งหมด
exports.getAllMajors = async (req, res, next) => {
  try {
    const [majors] = await pool.query(`
      SELECT m.*, f.name as faculty_name 
      FROM majors m
      LEFT JOIN faculties f ON m.faculty_id = f.id
      ORDER BY m.faculty_id, m.name
    `);
    
    res.status(200).json({
      success: true,
      count: majors.length,
      data: majors
    });
  } catch (err) {
    console.error('Error in getAllMajors:', err);
    next(err);
  }
};

// ดึงข้อมูลสาขาตาม ID
exports.getMajorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [major] = await pool.query(`
      SELECT m.*, f.name as faculty_name 
      FROM majors m
      LEFT JOIN faculties f ON m.faculty_id = f.id
      WHERE m.id = ?
    `, [id]);
    
    if (major.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลสาขา'
      });
    }
    
    res.status(200).json({
      success: true,
      data: major[0]
    });
  } catch (err) {
    console.error('Error in getMajorById:', err);
    next(err);
  }
};

// ดึงข้อมูลสาขาตามคณะ
exports.getMajorsByFacultyId = async (req, res, next) => {
  try {
    const { faculty_id } = req.params;
    
    // ตรวจสอบว่าคณะมีอยู่จริงหรือไม่
    const [faculty] = await pool.query('SELECT * FROM faculties WHERE id = ?', [faculty_id]);
    
    if (faculty.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลคณะที่ระบุ'
      });
    }
    
    // ดึงข้อมูลสาขาตามคณะ
    const [majors] = await pool.query('SELECT * FROM majors WHERE faculty_id = ? ORDER BY name', [faculty_id]);
    
    res.status(200).json({
      success: true,
      faculty: faculty[0],
      count: majors.length,
      data: majors
    });
  } catch (err) {
    console.error('Error in getMajorsByFacultyId:', err);
    next(err);
  }
};