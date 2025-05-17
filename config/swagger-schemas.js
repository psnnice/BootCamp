// ไฟล์ - config/swagger-schemas.js
/**
 * ไฟล์นี้ใช้สำหรับกำหนด Swagger Schemas ทั้งหมดสำหรับ API documentation
 * นำไปใช้ในไฟล์ config/swagger.js
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Activity:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: รหัสกิจกรรม
 *         title:
 *           type: string
 *           description: ชื่อกิจกรรม
 *         description:
 *           type: string
 *           description: รายละเอียดกิจกรรม
 *         category:
 *           type: string
 *           description: ประเภทกิจกรรม
 *           enum: [อาสา, ช่วยงาน, อบรม, VOLUNTEER, WORK, TRAINING]
 *         start_time:
 *           type: string
 *           format: date-time
 *           description: วันเวลาที่เริ่มต้น
 *         end_time:
 *           type: string
 *           format: date-time
 *           description: วันเวลาที่สิ้นสุด
 *         max_participants:
 *           type: integer
 *           description: จำนวนผู้เข้าร่วมสูงสุด
 *         status:
 *           type: string
 *           description: สถานะกิจกรรม
 *           enum: [รออนุมัติ, อนุมัติ, ปฏิเสธ, เสร็จสิ้น, ยกเลิก]
 *         created_by:
 *           type: integer
 *           description: รหัสผู้สร้างกิจกรรม
 *         creator_name:
 *           type: string
 *           description: ชื่อผู้สร้างกิจกรรม
 *         category_id:
 *           type: integer
 *           description: รหัสหมวดหมู่
 *         category_name:
 *           type: string
 *           description: ชื่อหมวดหมู่
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: วันเวลาที่สร้าง
 *         application_count:
 *           type: integer
 *           description: จำนวนผู้สมัครเข้าร่วม
 *         is_registered:
 *           type: boolean
 *           description: สถานะการลงทะเบียนของผู้ใช้ปัจจุบัน
 *         location:
 *           type: string
 *           description: สถานที่จัดกิจกรรม
 *         hours:
 *           type: number
 *           description: จำนวนชั่วโมงกิจกรรม
 *         points:
 *           type: number
 *           description: คะแนนที่จะได้รับ
 *       example:
 *         id: 1
 *         title: "ปลูกป่าชายเลน"
 *         description: "กิจกรรมปลูกป่าชายเลนเพื่อฟื้นฟูระบบนิเวศ"
 *         category: "อาสา"
 *         start_time: "2025-06-01T08:00:00Z"
 *         end_time: "2025-06-01T16:00:00Z"
 *         max_participants: 50
 *         status: "อนุมัติ"
 *         created_by: 1
 *         creator_name: "อาจารย์ สมชาย ใจดี"
 *         category_id: 1
 *         category_name: "อนุรักษ์สิ่งแวดล้อม"
 *         created_at: "2025-05-15T10:00:00Z"
 *         application_count: 20
 *         is_registered: false
 *         location: "หาดบางแสน จังหวัดชลบุรี"
 *         hours: 8
 *         points: 10
 * 
 *     ActivityDetail:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: รหัสกิจกรรม
 *         title:
 *           type: string
 *           description: ชื่อกิจกรรม
 *         description:
 *           type: string
 *           description: รายละเอียดกิจกรรม
 *         type:
 *           type: string
 *           description: ประเภทกิจกรรม
 *           enum: [อาสา, ช่วยงาน, อบรม, VOLUNTEER, WORK, TRAINING]
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: วันเวลาที่เริ่มต้น
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: วันเวลาที่สิ้นสุด
 *         status:
 *           type: string
 *           description: สถานะกิจกรรม
 *           enum: [รออนุมัติ, อนุมัติ, ปฏิเสธ, เสร็จสิ้น, ยกเลิก]
 *         maxParticipants:
 *           type: integer
 *           description: จำนวนผู้เข้าร่วมสูงสุด
 *         currentParticipants:
 *           type: integer
 *           description: จำนวนผู้เข้าร่วมปัจจุบัน
 *         isActive:
 *           type: boolean
 *           description: สถานะการเปิดรับสมัคร
 *         isRegistered:
 *           type: boolean
 *           description: สถานะการลงทะเบียนของผู้ใช้ปัจจุบัน
 *         location:
 *           type: string
 *           description: สถานที่จัดกิจกรรม
 *         hours:
 *           type: number
 *           description: จำนวนชั่วโมงกิจกรรม
 *         points:
 *           type: number
 *           description: คะแนนที่จะได้รับ
 *         createdBy:
 *           type: integer
 *           description: รหัสผู้สร้างกิจกรรม
 *         creatorName:
 *           type: string
 *           description: ชื่อผู้สร้างกิจกรรม
 *         categoryName:
 *           type: string
 *           description: ชื่อหมวดหมู่
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: วันเวลาที่สร้าง
 *       example:
 *         id: 1
 *         title: "ปลูกป่าชายเลน"
 *         description: "กิจกรรมปลูกป่าชายเลนเพื่อฟื้นฟูระบบนิเวศ"
 *         type: "อาสา"
 *         startDate: "2025-06-01T08:00:00Z"
 *         endDate: "2025-06-01T16:00:00Z"
 *         status: "อนุมัติ"
 *         maxParticipants: 50
 *         currentParticipants: 20
 *         isActive: true
 *         isRegistered: false
 *         location: "หาดบางแสน จังหวัดชลบุรี"
 *         hours: 8
 *         points: 10
 *         createdBy: 1
 *         creatorName: "อาจารย์ สมชาย ใจดี"
 *         categoryName: "อนุรักษ์สิ่งแวดล้อม"
 *         createdAt: "2025-05-15T10:00:00Z"
 * 
 *     Applicant:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: รหัสการสมัคร
 *         user_id:
 *           type: integer
 *           description: รหัสผู้ใช้
 *         sid:
 *           type: string
 *           description: รหัสนิสิต
 *         firstname:
 *           type: string
 *           description: ชื่อ
 *         lastname:
 *           type: string
 *           description: นามสกุล
 *         email:
 *           type: string
 *           description: อีเมล
 *         faculty_name:
 *           type: string
 *           description: คณะ
 *         major_name:
 *           type: string
 *           description: สาขา
 *         status:
 *           type: string
 *           description: สถานะการสมัคร
 *           enum: [รอดำเนินการ, อนุมัติ, ปฏิเสธ]
 *         applied_at:
 *           type: string
 *           format: date-time
 *           description: วันเวลาที่สมัคร
 *       example:
 *         id: 1
 *         user_id: 2
 *         sid: "65050123"
 *         firstname: "นิสิต"
 *         lastname: "ใจดี"
 *         email: "student@example.com"
 *         faculty_name: "คณะวิทยาศาสตร์"
 *         major_name: "วิทยาการคอมพิวเตอร์"
 *         status: "รอดำเนินการ"
 *         applied_at: "2025-05-17T14:30:00Z"
 * 
 *     ActivitySummary:
 *       type: object
 *       properties:
 *         registered:
 *           type: integer
 *           description: จำนวนกิจกรรมที่สมัคร
 *         hours:
 *           type: number
 *           description: ชั่วโมงสะสม
 *         points:
 *           type: number
 *           description: คะแนนสะสม
 *         totalActivities:
 *           type: integer
 *           description: จำนวนกิจกรรมทั้งหมดในระบบ
 *       example:
 *         registered: 5
 *         hours: 32.5
 *         points: 40
 *         totalActivities: 20
 * 
 *     StaffSummary:
 *       type: object
 *       properties:
 *         totalActivities:
 *           type: integer
 *           description: จำนวนกิจกรรมทั้งหมดที่สร้าง
 *         pendingApprovals:
 *           type: integer
 *           description: จำนวนกิจกรรมที่รออนุมัติ
 *         upcomingActivities:
 *           type: integer
 *           description: จำนวนกิจกรรมที่กำลังจะมาถึง
 *       example:
 *         totalActivities: 15
 *         pendingApprovals: 3
 *         upcomingActivities: 7
 */

// No exports needed as this file is just for documentation purposes