// ไฟล์ - README.md
# VolunteerHub API

ระบบ Backend API สำหรับแอพพลิเคชัน VolunteerHub - ระบบจัดการงานอาสาและกิจกรรมมหาวิทยาลัย

## ความต้องการระบบ

- Node.js (เวอร์ชัน 14 ขึ้นไป)
- MySQL หรือ MariaDB

## การติดตั้ง

1. โคลนโปรเจคนี้
   ```bash
   git clone <repository-url>
   cd volunteer-hub-backend
   ```

2. ติดตั้ง dependencies
   ```bash
   npm install
   ```

3. สร้างไฟล์ .env และกำหนดค่าต่างๆ
   ```
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=volunteer_system
   JWT_SECRET=your_secret_key
   JWT_EXPIRES_IN=7d
   ```

4. สร้างฐานข้อมูล
   ```bash
   mysql -u root -p -e "CREATE DATABASE volunteer_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   mysql -u root -p volunteer_system < database/schema.sql
   ```

5. เพิ่มข้อมูลตัวอย่าง (ถ้าต้องการ)
   ```bash
   mysql -u root -p volunteer_system < database/sample_data.sql
   ```

6. เริ่มต้นการทำงานของเซิร์ฟเวอร์
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

## เอกสาร API

เมื่อเริ่มต้นเซิร์ฟเวอร์แล้ว สามารถเข้าถึงเอกสาร API ได้ที่:
http://localhost:3000/api-docs

## โครงสร้างโปรเจค

```
volunteer-hub-backend/
├── app.js                 # Entry point
├── config/
│   ├── db.js              # Database configuration
│   └── swagger.js         # Swagger configuration
├── controllers/
│   ├── authController.js  # Authentication controllers
│   └── userController.js  # User controllers
├── middleware/
│   ├── auth.js            # Authentication middleware
│   └── errorHandler.js    # Error handling middleware
├── routes/
│   ├── auth.js            # Authentication routes
│   └── user.js            # User routes
├── database/
│   ├── schema.sql         # Database schema
│   └── sample_data.sql    # Sample data
└── .env                   # Environment variables
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - ลงทะเบียนผู้ใช้ใหม่
- `POST /api/auth/login` - เข้าสู่ระบบ
- `GET /api/auth/me` - ดึงข้อมูลผู้ใช้ปัจจุบัน (ต้องมี token)

### Users

- `GET /api/users` - ดึงข้อมูลผู้ใช้ทั้งหมด
- `GET /api/users/:id` - ดึงข้อมูลผู้ใช้ตาม ID

## การทดสอบ API

### ใช้ Postman

1. นำเข้า Collection จากไฟล์ `postman/volunteer-hub.postman_collection.json`
2. สร้าง Environment และกำหนดค่า
   - `baseUrl`: `http://localhost:3000/api`
   - `token`: (จะได้จากการเข้าสู่ระบบ)

### ใช้ cURL

#### ลงทะเบียนผู้ใช้ใหม่

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "12345678",
    "password": "password123",
    "full_name": "ชื่อ นามสกุล",
    "faculty_id": 2,
    "major_id": 7
  }'
```

#### เข้าสู่ระบบ

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "12345678",
    "password": "password123"
  }'
```

#### ดึงข้อมูลผู้ใช้ปัจจุบัน

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### ดึงข้อมูลผู้ใช้ทั้งหมด

```bash
curl -X GET http://localhost:3000/api/users
```

#### ดึงข้อมูลผู้ใช้ตาม ID

```bash
curl -X GET http://localhost:3000/api/users/1
```

## ผู้พัฒนา

- [ชื่อผู้พัฒนา] - [อีเมล]

## License

[LICENSE]