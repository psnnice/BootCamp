const { pool } = require('../config/db');

exports.createUserBan = async (req, res) => {
  try {
    const { user_id, reason, expires_at } = req.body;

    if (!user_id || !reason) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุรหัสผู้ใช้และเหตุผลของการแบน'
      });
    }

    const [user] = await pool.query(
      'SELECT id, role, ban_count FROM users WHERE id = ?',
      [user_id]
    );
    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้ใช้'
      });
    }
    if (user[0].role === 'ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถแบนผู้ใช้ที่มีบทบาทแอดมินได้'
      });
    }

    const [result] = await pool.query(
      'INSERT INTO user_bans (user_id, reason, banned_by, expires_at, is_active) VALUES (?, ?, ?, ?, ?)',
      [user_id, reason, req.user.id, expires_at || null, 1]
    );

    const [newBan] = await pool.query(
      'SELECT b.*, u.ban_count FROM user_bans b JOIN users u ON b.user_id = u.id WHERE b.id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'แบนผู้ใช้สำเร็จ',
      data: newBan[0]
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการแบนผู้ใช้: ' + err.message
    });
  }
};

exports.deactivateUserBan = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุอีเมลของผู้ใช้'
      });
    }

    const [user] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้ใช้ที่มีอีเมลนี้'
      });
    }

    const [ban] = await pool.query(
      'SELECT * FROM user_bans WHERE user_id = ? AND is_active = 1',
      [user[0].id]
    );
    if (ban.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบการแบนที่ใช้งานอยู่สำหรับผู้ใช้นี้'
      });
    }

    await pool.query(
      'DELETE FROM user_bans WHERE id = ?',
      [ban[0].id]
    );

    const [activeBans] = await pool.query(
      'SELECT COUNT(*) AS count FROM user_bans WHERE user_id = ? AND is_active = 1',
      [user[0].id]
    );
    if (activeBans[0].count === 0) {
      await pool.query(
        'UPDATE users SET is_banned = 0 WHERE id = ?',
        [user[0].id]
      );
    }

    const [updatedUser] = await pool.query(
      'SELECT ban_count FROM users WHERE id = ?',
      [user[0].id]
    );

    res.status(200).json({
      success: true,
      message: 'ยกเลิกการแบนสำเร็จ',
      data: {
        user_id: user[0].id,
        email,
        ban_count: updatedUser[0].ban_count,
        is_banned: activeBans[0].count === 0 ? 0 : 1
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการยกเลิกการแบน: ' + err.message
    });
  }
};

exports.getAllUserBans = async (req, res) => {
  try {
    const [bans] = await pool.query(
      'SELECT b.*, u.ban_count FROM user_bans b JOIN users u ON b.user_id = u.id ORDER BY b.banned_at DESC'
    );

    res.status(200).json({
      success: true,
      count: bans.length,
      data: bans
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการแบน: ' + err.message
    });
  }
};