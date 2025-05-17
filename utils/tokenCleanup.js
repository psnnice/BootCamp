// utils/tokenCleanup.js
const { pool } = require('../config/db');

/**
 * ฟังก์ชั่นทำความสะอาด token ที่หมดอายุหรือไม่ถูกใช้งานแล้ว
 * สามารถเรียกใช้เป็น cron job ได้
 */
exports.cleanupExpiredTokens = async () => {
  try {
    const startTime = Date.now();
    console.log(`[${new Date().toISOString()}] เริ่มการทำความสะอาด token...`);

    // ลบ token ที่หมดอายุหรือไม่ใช้งานแล้ว
    const [result] = await pool.query(`
      DELETE FROM auth_tokens 
      WHERE is_invalid = 1 OR (expires_at IS NOT NULL AND expires_at < NOW())
    `);

    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ทำความสะอาดเสร็จสิ้น: ลบ ${result.affectedRows} token (${duration}ms)`);

    return {
      success: true,
      deletedCount: result.affectedRows,
      duration
    };
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ข้อผิดพลาดในการทำความสะอาด token:`, err);
    throw err;
  }
};

/**
 * ฟังก์ชั่นแสดงสถิติของ token ในระบบ
 */
exports.getTokenStats = async () => {
  try {
    const [totalCount] = await pool.query('SELECT COUNT(*) as count FROM auth_tokens');
    
    const [activeCount] = await pool.query(`
      SELECT COUNT(*) as count FROM auth_tokens 
      WHERE is_invalid = 0 AND (expires_at IS NULL OR expires_at > NOW())
    `);
    
    const [expiredCount] = await pool.query(`
      SELECT COUNT(*) as count FROM auth_tokens 
      WHERE expires_at IS NOT NULL AND expires_at < NOW() AND is_invalid = 0
    `);
    
    // จำนวน token ที่ถูกทำให้ไม่สามารถใช้งานได้
    const [invalidCount] = await pool.query('SELECT COUNT(*) as count FROM auth_tokens WHERE is_invalid = 1');
    const [activeUserCount] = await pool.query(`
      SELECT COUNT(DISTINCT user_id) as count FROM auth_tokens 
      WHERE is_invalid = 0 AND (expires_at IS NULL OR expires_at > NOW())
    `);

    return {
      total: totalCount[0].count,
      active: activeCount[0].count,
      expired: expiredCount[0].count,
      invalid: invalidCount[0].count,
      activeUsers: activeUserCount[0].count
    };
  } catch (err) {
    console.error('ข้อผิดพลาดในการดึงสถิติ token:', err);
    throw err;
  }
};

if (require.main === module) {
  (async () => {
    try {
      console.log('สถิติก่อนทำความสะอาด:');
      const statsBefore = await exports.getTokenStats();
      console.log(statsBefore);

      const result = await exports.cleanupExpiredTokens();
      console.log('ผลลัพธ์การทำความสะอาด:', result);

      console.log('สถิติหลังทำความสะอาด:');
      const statsAfter = await exports.getTokenStats();
      console.log(statsAfter);

      process.exit(0);
    } catch (err) {
      console.error('เกิดข้อผิดพลาด:', err);
      process.exit(1);
    }
  })();
}