// ไฟล์ - middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  // ตรวจสอบประเภทของ error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message,
      errors: err.errors
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'ไม่ได้รับอนุญาตให้เข้าถึง'
    });
  }
  
  // สำหรับ error ทั่วไปหรือที่ไม่ได้ระบุ
  const statusCode = err.statusCode || 500;
  const message = err.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์';
  
  res.status(statusCode).json({
    success: false,
    message: message
  });
};

module.exports = {
  errorHandler
};