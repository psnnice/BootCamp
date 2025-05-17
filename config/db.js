// ไฟล์ - config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// สร้าง Pool สำหรับการเชื่อมต่อกับฐานข้อมูล MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'volunteer_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ทดสอบการเชื่อมต่อกับฐานข้อมูล
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connection established successfully');
    connection.release();
    return true;
  } catch (err) {
    console.error('❌ Error connecting to database:', err);
    return false;
  }
};

module.exports = {
  pool,
  testConnection
};