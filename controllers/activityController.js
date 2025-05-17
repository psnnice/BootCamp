// controllers/activityController.js
const { pool } = require('../config/db');

/**
 * @desc    Get all activities
 * @route   GET /api/activities
 * @access  Public (with filtering by status)
 */
exports.getAllActivities = async (req, res, next) => {
  try {
    // Parse query parameters for filtering and pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const category = req.query.category || '';
    const status = req.query.status || '';
    const search = req.query.search || '';
    
    // Build the base query
    let query = `
      SELECT a.*, 
             CONCAT(u.firstname, ' ', u.lastname) as creator_name, 
             c.name as category
      FROM activities a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN activity_categories c ON a.category_id = c.id
      WHERE 1=1
    `;
    
    // Add filter parameters
    const params = [];
    
    // Filter by category
    if (category) {
      query += ` AND a.category = ?`;
      params.push(category);
    }
    
    // Filter by status
    if (status) {
      query += ` AND a.status = ?`;
      params.push(status);
    }
    
    // Filter by search term (in title or description)
    if (search) {
      query += ` AND (a.title LIKE ? OR a.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // If the user is not staff or admin, only show approved activities
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'STAFF')) {
      query += ` AND a.status = 'อนุมัติ'`;
    }
    
    // Count total matching records for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM activities a
      WHERE 1=1
    `;
    
    // Add the same filters to count query
    let countParams = [...params]; // Create a copy of params array
    
    if (category) {
      countQuery += ` AND a.category = ?`;
    }
    
    if (status) {
      countQuery += ` AND a.status = ?`;
    }
    
    if (search) {
      countQuery += ` AND (a.title LIKE ? OR a.description LIKE ?)`;
      // No need to push to countParams as they are already copied from params
    }
    
    // If the user is not staff or admin, only count approved activities
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'STAFF')) {
      countQuery += ` AND a.status = 'อนุมัติ'`;
    }
    
    // Add order, limit and offset to the main query
    query += ` ORDER BY a.start_time DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    // Execute both queries
    const [activities] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);
    
    // Check if user is logged in to determine registration status
    if (req.user) {
      // Get registration status for each activity
      for (const activity of activities) {
        const [registrationStatus] = await pool.query(
          'SELECT * FROM activity_applications WHERE activity_id = ? AND user_id = ?',
          [activity.id, req.user.id]
        );
        
        activity.isRegistered = registrationStatus.length > 0;
        activity.applicationStatus = registrationStatus.length > 0 ? registrationStatus[0].status : null;
      }
    }
    
    // Get participant count for each activity
    for (const activity of activities) {
      const [participantCount] = await pool.query(
        'SELECT COUNT(*) as count FROM activity_applications WHERE activity_id = ? AND status = "อนุมัติ"',
        [activity.id]
      );
      
      activity.currentParticipants = participantCount[0].count;
    }
    
    // Format dates for consistent response
    activities.forEach(activity => {
      activity.startDate = activity.start_time;
      activity.endDate = activity.end_time;
      activity.maxParticipants = activity.max_participants;
      activity.isActive = activity.status === 'อนุมัติ' && 
                       new Date(activity.end_time) > new Date();
    });
    
    res.status(200).json({
      success: true,
      count: activities.length,
      total: countResult[0].total,
      data: activities,
      pagination: {
        current_page: page,
        per_page: limit,
        total_pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (err) {
    console.error('Error in getAllActivities:', err);
    next(err);
  }
};

/**
 * @desc    Get activity by ID
 * @route   GET /api/activities/:id
 * @access  Public
 */
exports.getActivityById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get detailed activity information
    const [activities] = await pool.query(`
      SELECT a.*, 
             CONCAT(u.firstname, ' ', u.lastname) as creator_name, 
             c.name as category_name
      FROM activities a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN activity_categories c ON a.category_id = c.id
      WHERE a.id = ?
    `, [id]);
    
    if (activities.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลกิจกรรม'
      });
    }
    
    const activity = activities[0];
    
    // If activity is not approved, only creator, admin, or staff can view it
    if (activity.status !== 'อนุมัติ' && 
        (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'STAFF' && 
                     req.user.id !== activity.created_by))) {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลกิจกรรมนี้'
      });
    }
    
    // Get current participant count
    const [participantCount] = await pool.query(
      'SELECT COUNT(*) as count FROM activity_applications WHERE activity_id = ? AND status = "อนุมัติ"',
      [id]
    );
    
    // Check if current user is registered
    let isRegistered = false;
    let applicationStatus = null;
    
    if (req.user) {
      const [registration] = await pool.query(
        'SELECT * FROM activity_applications WHERE activity_id = ? AND user_id = ?',
        [id, req.user.id]
      );
      
      isRegistered = registration.length > 0;
      applicationStatus = registration.length > 0 ? registration[0].status : null;
    }
    
    // Format response data
    const activityDetail = {
      ...activity,
      startDate: activity.start_time,
      endDate: activity.end_time,
      currentParticipants: participantCount[0].count,
      maxParticipants: activity.max_participants,
      isRegistered,
      applicationStatus,
      isActive: activity.status === 'อนุมัติ' && 
                new Date(activity.end_time) > new Date()
    };
    
    res.status(200).json({
      success: true,
      data: activityDetail
    });
  } catch (err) {
    console.error('Error in getActivityById:', err);
    next(err);
  }
};

/**
 * @desc    Get activities created by current user
 * @route   GET /api/activities/my-created
 * @access  Private (Staff/Admin)
 */
exports.getMyCreatedActivities = async (req, res, next) => {
  try {
    // Ensure user has proper permissions
    if (!req.user || (req.user.role !== 'STAFF' && req.user.role !== 'ADMIN')) {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้'
      });
    }
    
    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Get activities created by current user
    const [activities] = await pool.query(`
      SELECT a.*, 
             CONCAT(u.firstname, ' ', u.lastname) as creator_name, 
             c.name as category_name
      FROM activities a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN activity_categories c ON a.category_id = c.id
      WHERE a.created_by = ?
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `, [req.user.id, limit, offset]);
    
    // Count total activities created by user
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM activities WHERE created_by = ?',
      [req.user.id]
    );
    
    // Format response
    activities.forEach(activity => {
      activity.startDate = activity.start_time;
      activity.endDate = activity.end_time;
      activity.maxParticipants = activity.max_participants;
    });
    
    res.status(200).json({
      success: true,
      count: activities.length,
      total: countResult[0].total,
      data: activities,
      pagination: {
        current_page: page,
        per_page: limit,
        total_pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (err) {
    console.error('Error in getMyCreatedActivities:', err);
    next(err);
  }
};

/**
 * @desc    Get activities user has applied for
 * @route   GET /api/activities/my
 * @access  Private
 */
exports.getMyActivities = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'กรุณาเข้าสู่ระบบก่อนเข้าถึงข้อมูล'
      });
    }
    
    // Query for activities the user has applied for
    const [activities] = await pool.query(`
      SELECT a.*, 
             aa.status as application_status, 
             aa.applied_at,
             CONCAT(u.firstname, ' ', u.lastname) as creator_name, 
             c.name as category_name
      FROM activities a
      JOIN activity_applications aa ON a.id = aa.activity_id
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN activity_categories c ON a.category_id = c.id
      WHERE aa.user_id = ?
      ORDER BY a.start_time DESC
    `, [req.user.id]);
    
    // Format response
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      title: activity.title,
      description: activity.description,
      type: activity.category,
      status: activity.status,
      startDate: activity.start_time,
      endDate: activity.end_time,
      maxParticipants: activity.max_participants,
      createdAt: activity.created_at,
      updatedAt: activity.created_at, // Assuming there's no updated_at field
      isRegistered: true, // Since these are activities the user is registered for
      applicationStatus: activity.application_status,
      appliedAt: activity.applied_at
    }));
    
    res.status(200).json({
      success: true,
      count: formattedActivities.length,
      data: formattedActivities
    });
  } catch (err) {
    console.error('Error in getMyActivities:', err);
    next(err);
  }
};

/**
 * @desc    Get only approved activities
 * @route   GET /api/activities/approved
 * @access  Public
 */
exports.getApprovedActivities = async (req, res, next) => {
  try {
    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const category = req.query.category || '';
    const search = req.query.search || '';
    
    // Build query for approved activities
    let query = `
      SELECT a.*, 
             CONCAT(u.firstname, ' ', u.lastname) as creator_name, 
             c.name as category_name
      FROM activities a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN activity_categories c ON a.category_id = c.id
      WHERE a.status = 'อนุมัติ'
    `;
    
    // Add filter parameters
    const params = [];
    
    // Filter by category
    if (category) {
      query += ` AND a.category = ?`;
      params.push(category);
    }
    
    // Filter by search term
    if (search) {
      query += ` AND (a.title LIKE ? OR a.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Count total matching records for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM activities a
      WHERE a.status = 'อนุมัติ'
    `;
    
    // Add the same filters to count query
    let countParams = [];
    
    if (category) {
      countQuery += ` AND a.category = ?`;
      countParams.push(category);
    }
    
    if (search) {
      countQuery += ` AND (a.title LIKE ? OR a.description LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    // Add order, limit and offset
    query += ` ORDER BY a.start_time ASC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    // Execute queries
    const [activities] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);
    
    // Check if user is logged in to determine registration status
    if (req.user) {
      for (const activity of activities) {
        const [registrationStatus] = await pool.query(
          'SELECT * FROM activity_applications WHERE activity_id = ? AND user_id = ?',
          [activity.id, req.user.id]
        );
        
        activity.isRegistered = registrationStatus.length > 0;
        activity.applicationStatus = registrationStatus.length > 0 ? registrationStatus[0].status : null;
      }
    }
    
    // Get participant count for each activity
    for (const activity of activities) {
      const [participantCount] = await pool.query(
        'SELECT COUNT(*) as count FROM activity_applications WHERE activity_id = ? AND status = "อนุมัติ"',
        [activity.id]
      );
      
      activity.currentParticipants = participantCount[0].count;
    }
    
    // Format dates and additional fields
    activities.forEach(activity => {
      activity.startDate = activity.start_time;
      activity.endDate = activity.end_time;
      activity.maxParticipants = activity.max_participants;
      activity.isActive = new Date(activity.end_time) > new Date();
      
      // If not registered, set to false
      if (activity.isRegistered === undefined) {
        activity.isRegistered = false;
      }
    });
    
    res.status(200).json({
      success: true,
      count: activities.length,
      total: countResult[0].total,
      data: activities,
      pagination: {
        current_page: page,
        per_page: limit,
        total_pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (err) {
    console.error('Error in getApprovedActivities:', err);
    next(err);
  }
};

/**
 * @desc    Create new activity
 * @route   POST /api/activities
 * @access  Private (Staff/Admin)
 */
exports.createActivity = async (req, res, next) => {
  try {
    // Ensure user has proper permissions
    if (!req.user || (req.user.role !== 'STAFF' && req.user.role !== 'ADMIN')) {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์สร้างกิจกรรมใหม่'
      });
    }
    
    // Extract activity data from request body
    const { 
      title, 
      description, 
      category, 
      start_time, 
      end_time, 
      max_participants,
      category_id
    } = req.body;
    
    // Validate required fields
    if (!title || !description || !category || !start_time || !end_time || !max_participants) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      });
    }
    
    // Validate date range
    if (new Date(start_time) >= new Date(end_time)) {
      return res.status(400).json({
        success: false,
        message: 'วันที่เริ่มต้นต้องอยู่ก่อนวันที่สิ้นสุด'
      });
    }
    
    // Set initial status based on user role
    let status = req.user.role === 'ADMIN' ? 'อนุมัติ' : 'รออนุมัติ';
    
    // Insert new activity
    const [result] = await pool.query(
      `INSERT INTO activities (
        title, 
        description, 
        category, 
        start_time, 
        end_time, 
        max_participants, 
        status, 
        created_by,
        category_id,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        title, 
        description, 
        category, 
        start_time, 
        end_time, 
        max_participants, 
        status, 
        req.user.id,
        category_id || null
      ]
    );
    
    if (result.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        message: 'ไม่สามารถสร้างกิจกรรมได้ โปรดลองอีกครั้ง'
      });
    }
    
    // Get the newly created activity
    const [activities] = await pool.query(`
      SELECT a.*, 
             CONCAT(u.firstname, ' ', u.lastname) as creator_name, 
             c.name as category_name
      FROM activities a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN activity_categories c ON a.category_id = c.id
      WHERE a.id = ?
    `, [result.insertId]);
    
    // Format response
    const activity = activities[0];
    const formattedActivity = {
      ...activity,
      startDate: activity.start_time,
      endDate: activity.end_time,
      maxParticipants: activity.max_participants,
      currentParticipants: 0,
      isRegistered: false,
      isActive: activity.status === 'อนุมัติ'
    };
    
    res.status(201).json({
      success: true,
      message: 'สร้างกิจกรรมสำเร็จ',
      data: formattedActivity
    });
  } catch (err) {
    console.error('Error in createActivity:', err);
    next(err);
  }
};

/**
 * @desc    Update activity
 * @route   PUT /api/activities/:id
 * @access  Private (Staff/Admin)
 */
exports.updateActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Verify activity exists
    const [activities] = await pool.query('SELECT * FROM activities WHERE id = ?', [id]);
    
    if (activities.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลกิจกรรม'
      });
    }
    
    const activity = activities[0];
    
    // Check permissions - must be activity creator, admin, or staff
    if (req.user.role !== 'ADMIN' && 
        (req.user.role !== 'STAFF' || req.user.id !== activity.created_by)) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์แก้ไขกิจกรรมนี้'
      });
    }
    
    // Extract fields to update
    const { 
      title, 
      description, 
      category, 
      start_time, 
      end_time, 
      max_participants,
      status,
      category_id
    } = req.body;
    
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    
    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    
    if (category !== undefined) {
      updateFields.push('category = ?');
      updateValues.push(category);
    }
    
    if (start_time !== undefined) {
      updateFields.push('start_time = ?');
      updateValues.push(start_time);
    }
    
    if (end_time !== undefined) {
      updateFields.push('end_time = ?');
      updateValues.push(end_time);
    }
    
    if (max_participants !== undefined) {
      updateFields.push('max_participants = ?');
      updateValues.push(max_participants);
    }
    
    // Only admin can update status
    if (status !== undefined && req.user.role === 'ADMIN') {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    
    if (category_id !== undefined) {
      updateFields.push('category_id = ?');
      updateValues.push(category_id);
    }
    
    // If no fields to update
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ไม่มีข้อมูลที่ต้องการอัปเดต'
      });
    }
    
    // Add id to update values
    updateValues.push(id);
    
    // Update activity
    await pool.query(
      `UPDATE activities SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    // Get updated activity details
    const [updatedActivities] = await pool.query(`
      SELECT a.*, 
             CONCAT(u.firstname, ' ', u.lastname) as creator_name, 
             c.name as category_name
      FROM activities a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN activity_categories c ON a.category_id = c.id
      WHERE a.id = ?
    `, [id]);
    
    // Format response
    const updatedActivity = updatedActivities[0];
    const formattedActivity = {
      ...updatedActivity,
      startDate: updatedActivity.start_time,
      endDate: updatedActivity.end_time,
      maxParticipants: updatedActivity.max_participants,
      isActive: updatedActivity.status === 'อนุมัติ' && 
                new Date(updatedActivity.end_time) > new Date()
    };
    
    res.status(200).json({
      success: true,
      message: 'อัปเดตกิจกรรมสำเร็จ',
      data: formattedActivity
    });
  } catch (err) {
    console.error('Error in updateActivity:', err);
    next(err);
  }
};

/**
 * @desc    Delete activity
 * @route   DELETE /api/activities/:id
 * @access  Private (Staff/Admin)
 */
exports.deleteActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Verify activity exists
    const [activities] = await pool.query('SELECT * FROM activities WHERE id = ?', [id]);
    
    if (activities.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลกิจกรรม'
      });
    }
    
    const activity = activities[0];
    
    // Check permissions - must be activity creator or admin
    if (req.user.role !== 'ADMIN' && req.user.id !== activity.created_by) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ลบกิจกรรมนี้'
      });
    }
    
    // Check if activity has participants
    const [participants] = await pool.query(
      'SELECT COUNT(*) as count FROM activity_applications WHERE activity_id = ?',
      [id]
    );
    
    if (participants[0].count > 0 && req.user.role !== 'ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถลบกิจกรรมที่มีผู้สมัครแล้ว โปรดติดต่อผู้ดูแลระบบ'
      });
    }
    
    // Delete activity (this will cascade delete related applications due to foreign key constraints)
    await pool.query('DELETE FROM activities WHERE id = ?', [id]);
    
    res.status(200).json({
      success: true,
      message: 'ลบกิจกรรมสำเร็จ'
    });
  } catch (err) {
    console.error('Error in deleteActivity:', err);
    next(err);
  }
};

/**
 * @desc    Update activity status
 * @route   PUT /api/activities/:id/status
 * @access  Private (Staff/Admin)
 */
exports.updateActivityStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['อนุมัติ', 'เสร็จสิ้น', 'ยกเลิก'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'สถานะไม่ถูกต้อง กรุณาระบุ: อนุมัติ, เสร็จสิ้น หรือ ยกเลิก'
      });
    }
    
    // Verify activity exists
    const [activities] = await pool.query('SELECT * FROM activities WHERE id = ?', [id]);
    
    if (activities.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลกิจกรรม'
      });
    }
    
    const activity = activities[0];
    
    // Check permissions - must be admin or activity creator
    if (req.user.role !== 'ADMIN' && req.user.id !== activity.created_by) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์แก้ไขสถานะกิจกรรมนี้'
      });
    }
    
    // Update status
    await pool.query(
      'UPDATE activities SET status = ? WHERE id = ?',
      [status, id]
    );
    
    // Process participants if activity is marked as completed
    if (status === 'เสร็จสิ้น') {
      // Get approved participants
      const [approvedParticipants] = await pool.query(
        'SELECT user_id FROM activity_applications WHERE activity_id = ? AND status = "อนุมัติ"',
        [id]
      );
      
      // Calculate hours based on activity duration
      const startTime = new Date(activity.start_time);
      const endTime = new Date(activity.end_time);
      const durationHours = (endTime - startTime) / (1000 * 60 * 60);
      
      // Only process if there are approved participants
      if (approvedParticipants.length > 0) {
        console.log(`Processing ${approvedParticipants.length} participants for completed activity ${id}`);
        
        // Add participation records for each approved participant
        for (const participant of approvedParticipants) {
          await pool.query(
            `INSERT INTO activity_participation 
             (activity_id, user_id, hours, points, verified_by, verified_at) 
             VALUES (?, ?, ?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE 
             hours = VALUES(hours), 
             points = VALUES(points), 
             verified_by = VALUES(verified_by), 
             verified_at = NOW()`,
            [id, participant.user_id, durationHours, durationHours, req.user.id]
          );
          
          console.log(`Added participation record for user ${participant.user_id}: ${durationHours} hours, ${durationHours} points`);
        }
      }
    }
    
    res.status(200).json({
      success: true,
      message: `อัปเดตสถานะกิจกรรมเป็น ${status} สำเร็จ`
    });
  } catch (err) {
    console.error('Error in updateActivityStatus:', err);
    next(err);
  }
};

/**
 * @desc    Apply to participate in an activity
 * @route   POST /api/activities/:id/apply
 * @access  Private
 */
exports.applyForActivity = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'กรุณาเข้าสู่ระบบก่อนสมัครกิจกรรม'
      });
    }
    
    const { id } = req.params;
    
    // Verify activity exists and is open for applications
    const [activities] = await pool.query(
      'SELECT * FROM activities WHERE id = ? AND status = "อนุมัติ"',
      [id]
    );
    
    if (activities.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบกิจกรรมที่เปิดรับสมัคร'
      });
    }
    
    const activity = activities[0];
    
    // Check if activity date has passed
    if (new Date(activity.end_time) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'กิจกรรมนี้ผ่านไปแล้ว ไม่สามารถสมัครได้'
      });
    }
    
    // Check if user has already applied
    const [existingApplications] = await pool.query(
      'SELECT * FROM activity_applications WHERE activity_id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    if (existingApplications.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'คุณได้สมัครกิจกรรมนี้ไปแล้ว'
      });
    }
    
    // Check if activity is full
    const [approvedParticipants] = await pool.query(
      'SELECT COUNT(*) as count FROM activity_applications WHERE activity_id = ? AND status = "อนุมัติ"',
      [id]
    );
    
    if (approvedParticipants[0].count >= activity.max_participants) {
      return res.status(400).json({
        success: false,
        message: 'กิจกรรมนี้มีผู้เข้าร่วมเต็มแล้ว'
      });
    }
    
    // Create application
    await pool.query(
      'INSERT INTO activity_applications (activity_id, user_id, status, applied_at) VALUES (?, ?, ?, NOW())',
      [id, req.user.id, 'รอดำเนินการ']
    );
    
    res.status(201).json({
      success: true,
      message: 'สมัครกิจกรรมสำเร็จ กรุณารอการอนุมัติ'
    });
  } catch (err) {
    console.error('Error in applyForActivity:', err);
    next(err);
  }
};

/**
 * @desc    Cancel application for an activity
 * @route   DELETE /api/activities/:id/apply
 * @access  Private
 */
exports.cancelApplication = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'กรุณาเข้าสู่ระบบก่อนยกเลิกการสมัคร'
      });
    }
    
    const { id } = req.params;
    
    // Verify activity exists
    const [activities] = await pool.query('SELECT * FROM activities WHERE id = ?', [id]);
    
    if (activities.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลกิจกรรม'
      });
    }
    
    // Check if user has an application
    const [applications] = await pool.query(
      'SELECT * FROM activity_applications WHERE activity_id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'คุณไม่ได้สมัครกิจกรรมนี้'
      });
    }
    
    // Check if application can be canceled (only if not yet approved or activity not started)
    const application = applications[0];
    const activity = activities[0];
    
    if (application.status === 'อนุมัติ' && new Date(activity.start_time) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถยกเลิกการสมัครได้เนื่องจากกิจกรรมเริ่มแล้ว'
      });
    }
    
    // Delete application
    await pool.query(
      'DELETE FROM activity_applications WHERE activity_id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    res.status(200).json({
      success: true,
      message: 'ยกเลิกการสมัครสำเร็จ'
    });
  } catch (err) {
    console.error('Error in cancelApplication:', err);
    next(err);
  }
};

/**
 * @desc    Toggle registration (apply or cancel application)
 * @route   POST /api/activities/:id/toggle
 * @access  Private
 */
exports.toggleRegistration = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ'
      });
    }
    
    const { id } = req.params;
    
    // Verify activity exists
    const [activities] = await pool.query('SELECT * FROM activities WHERE id = ?', [id]);
    
    if (activities.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลกิจกรรม'
      });
    }
    
    const activity = activities[0];
    
    // Check if user is already registered
    const [applications] = await pool.query(
      'SELECT * FROM activity_applications WHERE activity_id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    // If registered, cancel the application
    if (applications.length > 0) {
      const application = applications[0];
      
      // Check if application can be canceled (only if not yet approved or activity not started)
      if (application.status === 'อนุมัติ' && new Date(activity.start_time) <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'ไม่สามารถยกเลิกการสมัครได้เนื่องจากกิจกรรมเริ่มแล้ว'
        });
      }
      
      // Delete application
      await pool.query(
        'DELETE FROM activity_applications WHERE activity_id = ? AND user_id = ?',
        [id, req.user.id]
      );
      
      return res.status(200).json({
        success: true,
        message: 'ยกเลิกการสมัครสำเร็จ',
        isRegistered: false
      });
    } 
    // If not registered, apply for the activity
    else {
      // Check if activity is approved and not expired
      if (activity.status !== 'อนุมัติ') {
        return res.status(400).json({
          success: false,
          message: 'กิจกรรมนี้ยังไม่ได้รับการอนุมัติหรือถูกยกเลิก'
        });
      }
      
      // Check if activity date has passed
      if (new Date(activity.end_time) < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'กิจกรรมนี้ผ่านไปแล้ว ไม่สามารถสมัครได้'
        });
      }
      
      // Check if activity is full
      const [approvedParticipants] = await pool.query(
        'SELECT COUNT(*) as count FROM activity_applications WHERE activity_id = ? AND status = "อนุมัติ"',
        [id]
      );
      
      if (approvedParticipants[0].count >= activity.max_participants) {
        return res.status(400).json({
          success: false,
          message: 'กิจกรรมนี้มีผู้เข้าร่วมเต็มแล้ว'
        });
      }
      
      // Create application
      await pool.query(
        'INSERT INTO activity_applications (activity_id, user_id, status, applied_at) VALUES (?, ?, ?, NOW())',
        [id, req.user.id, 'รอดำเนินการ']
      );
      
      return res.status(201).json({
        success: true,
        message: 'สมัครกิจกรรมสำเร็จ กรุณารอการอนุมัติ',
        isRegistered: true
      });
    }
  } catch (err) {
    console.error('Error in toggleRegistration:', err);
    next(err);
  }
};

/**
 * @desc    Get activity summary for current user
 * @route   GET /api/activities/summary
 * @access  Private
 */
exports.getActivitySummary = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'กรุณาเข้าสู่ระบบก่อนเข้าถึงข้อมูล'
      });
    }
    
    // Count registered activities
    const [registeredActivities] = await pool.query(
      'SELECT COUNT(*) as count FROM activity_applications WHERE user_id = ?',
      [req.user.id]
    );
    
    // Count total hours and points
    const [participation] = await pool.query(
      'SELECT SUM(hours) as total_hours, SUM(points) as total_points FROM activity_participation WHERE user_id = ?',
      [req.user.id]
    );
    
    // Count total approved activities
    const [totalActivities] = await pool.query(
      'SELECT COUNT(*) as count FROM activities WHERE status = "อนุมัติ"'
    );
    
    const summary = {
      registered: registeredActivities[0].count || 0,
      hours: participation[0].total_hours || 0,
      points: participation[0].total_points || 0,
      totalActivities: totalActivities[0].count || 0
    };
    
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (err) {
    console.error('Error in getActivitySummary:', err);
    next(err);
  }
};

/**
 * @desc    Get summary for staff dashboard
 * @route   GET /api/activities/staff/summary
 * @access  Private (Staff/Admin)
 */
exports.getStaffSummary = async (req, res, next) => {
  try {
    // Ensure user has proper permissions
    if (!req.user || (req.user.role !== 'STAFF' && req.user.role !== 'ADMIN')) {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้'
      });
    }
    
    // Count total activities
    const [totalActivities] = await pool.query(
      'SELECT COUNT(*) as count FROM activities'
    );
    
    // Count pending approvals (applications that need staff approval)
    const [pendingApprovals] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM activity_applications aa
      JOIN activities a ON aa.activity_id = a.id
      WHERE aa.status = 'รอดำเนินการ'
      ${req.user.role === 'STAFF' ? 'AND a.created_by = ?' : ''}
    `, req.user.role === 'STAFF' ? [req.user.id] : []);
    
    // Count upcoming activities
    const [upcomingActivities] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM activities 
      WHERE start_time > NOW() AND status = 'อนุมัติ'
      ${req.user.role === 'STAFF' ? 'AND created_by = ?' : ''}
    `, req.user.role === 'STAFF' ? [req.user.id] : []);
    
    const summary = {
      totalActivities: totalActivities[0].count || 0,
      pendingApprovals: pendingApprovals[0].count || 0,
      upcomingActivities: upcomingActivities[0].count || 0
    };
    
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (err) {
    console.error('Error in getStaffSummary:', err);
    next(err);
  }
};

/**
 * @desc    Approve activity (Admin only)
 * @route   POST /api/activities/:id/approve
 * @access  Private (Admin)
 */
exports.approveActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approved } = req.body; // Boolean value: true for approve, false for reject
    
    // Ensure user is admin
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถอนุมัติกิจกรรมได้'
      });
    }
    
    // Verify activity exists
    const [activities] = await pool.query('SELECT * FROM activities WHERE id = ?', [id]);
    
    if (activities.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลกิจกรรม'
      });
    }
    
    const activity = activities[0];
    
    // Check if activity is in pending status
    if (activity.status !== 'รออนุมัติ') {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถอนุมัติกิจกรรมนี้ได้ เนื่องจากไม่อยู่ในสถานะรออนุมัติ'
      });
    }
    
    // Update status based on admin decision
    const newStatus = approved ? 'อนุมัติ' : 'ปฏิเสธ';
    
    await pool.query(
      'UPDATE activities SET status = ? WHERE id = ?',
      [newStatus, id]
    );
    
    res.status(200).json({
      success: true,
      message: approved ? 'อนุมัติกิจกรรมสำเร็จ' : 'ปฏิเสธกิจกรรมสำเร็จ'
    });
  } catch (err) {
    console.error('Error in approveActivity:', err);
    next(err);
  }
};