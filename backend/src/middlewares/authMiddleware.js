const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // Lấy token từ header Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Bạn cần đăng nhập để thực hiện thao tác này' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Lưu thông tin user (id, role) vào request để dùng ở sau
    next(); // Cho phép đi tiếp vào Controller
  } catch (error) {
    return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

// Kiểm tra quyền Admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Chỉ Admin mới có quyền truy cập' });
  }
  next();
};

module.exports = { verifyToken, isAdmin };