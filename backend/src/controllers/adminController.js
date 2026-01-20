const db = require('../database/db');

// Trả về danh sách users (trừ password)
exports.getUsers = async (req, res) => {
  try {
    const users = await db('users')
      .select('id', 'username', 'email', 'role', 'created_at', 'updated_at')
      .orderBy('id', 'asc');
    res.json(users);
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({ message: 'Lỗi lấy danh sách người dùng', error: error.message });
  }
};

// Cập nhật role của user
exports.updateUserRole = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role không hợp lệ' });
    }
    const user = await db('users').where({ id: userId }).first();
    if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

    await db('users').where({ id: userId }).update({ role, updated_at: db.raw('NOW()') });
    res.json({ message: 'Cập nhật role thành công' });
  } catch (error) {
    console.error('updateUserRole error:', error);
    res.status(500).json({ message: 'Lỗi cập nhật role', error: error.message });
  }
};

// Xóa user
exports.deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await db('users').where({ id: userId }).first();
    if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

    await db('users').where({ id: userId }).del();
    res.json({ message: 'Đã xóa người dùng' });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({ message: 'Lỗi xóa người dùng', error: error.message });
  }
};

// Danh sách games
exports.getGames = async (req, res) => {
  try {
    const games = await db('games').select('id', 'name', 'code', 'default_size', 'is_active', 'created_at', 'updated_at');
    res.json(games);
  } catch (error) {
    console.error('getGames error:', error);
    res.status(500).json({ message: 'Lỗi lấy games', error: error.message });
  }
};

// Bật/tắt game (is_active)
exports.updateGameStatus = async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ message: 'is_active phải là boolean' });
    }
    const game = await db('games').where({ id: gameId }).first();
    if (!game) return res.status(404).json({ message: 'Game không tồn tại' });

    await db('games').where({ id: gameId }).update({ is_active, updated_at: db.raw('NOW()') });
    res.json({ message: 'Cập nhật trạng thái game thành công' });
  } catch (error) {
    console.error('updateGameStatus error:', error);
    res.status(500).json({ message: 'Lỗi cập nhật game', error: error.message });
  }
};

// Thống kê nhanh cho admin (counts)
exports.getStats = async (req, res) => {
  try {
    const usersCount = await db('users').count('id as cnt').first();
    const gamesCount = await db('games').count('id as cnt').first();
    const rankingsCount = await db('rankings').count('id as cnt').first();
    const messagesCount = await db('messages').count('id as cnt').first();
    res.json({
      users: Number(usersCount.cnt),
      games: Number(gamesCount.cnt),
      rankings: Number(rankingsCount.cnt),
      messages: Number(messagesCount.cnt),
    });
  } catch (error) {
    console.error('getStats error:', error);
    res.status(500).json({ message: 'Lỗi lấy thống kê', error: error.message });
  }
};