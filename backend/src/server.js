require('dotenv').config();
const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const friendRoutes = require('./routes/friendRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const adminRoutes = require('./routes/adminRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const commentRoutes = require('./routes/commentRoutes');
const apiKeyRoutes = require('./routes/apiKeyRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Sử dụng Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api', apiKeyRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Chào mừng bạn đến với Board Game API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;

// Thiết lập HTTPS
if (process.env.USE_HTTPS === 'true') {
  const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, '../ssl/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../ssl/cert.pem'))
  };

  https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(` HTTPS Server đang chạy tại: https://localhost:${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`Server đang chạy tại cổng: ${PORT}`);
  });
}
