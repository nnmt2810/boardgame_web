const db = require('../database/db');

// Lưu trạng thái game
exports.saveSession = async (req, res) => {
  try {
    const { game_id, matrix_state, current_score, time_elapsed } = req.body;
    const user_id = req.user.id; // Lấy từ middleware verifyToken

    const session = await db('game_sessions').insert({
      user_id,
      game_id,
      matrix_state: JSON.stringify(matrix_state), // Lưu ma trận dưới dạng JSON
      current_score,
      time_elapsed,
      status: 'saved'
    }).returning('*');

    res.status(201).json({ message: 'Đã lưu game!', session: session[0] });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lưu game', error: error.message });
  }
};

// Lấy bản lưu gần nhất
exports.getLatestSession = async (req, res) => {
  try {
    const { game_id } = req.params;
    const user_id = req.user.id;

    const session = await db('game_sessions')
      .where({ user_id, game_id })
      .orderBy('created_at', 'desc')
      .first();

    if (!session) return res.status(404).json({ message: 'Không tìm thấy bản lưu' });

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tải game', error: error.message });
  }
};

// Lấy bảng xếp hạng toàn cầu cho một game
exports.getLeaderboard = async (req, res) => {
  try {
    const { game_id } = req.params;

    const leaderboard = await db('rankings')
      .join('users', 'rankings.user_id', '=', 'users.id')
      .select('users.username', 'rankings.high_score', 'rankings.updated_at')
      .where('rankings.game_id', game_id)
      .orderBy('rankings.high_score', 'desc')
      .limit(10);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy bảng xếp hạng', error: error.message });
  }
};

// Cập nhật điểm số sau khi kết thúc game
exports.updateScore = async (req, res) => {
  try {
    const { game_id, score } = req.body;
    const user_id = req.user.id;

    const existing = await db('rankings').where({ user_id, game_id }).first();

    if (!existing) {
      await db('rankings').insert({ user_id, game_id, high_score: score });
    } else if (score > existing.high_score) {
      // Chỉ cập nhật nếu điểm mới cao hơn điểm cũ
      await db('rankings').where({ user_id, game_id }).update({ 
        high_score: score,
        updated_at: db.raw('NOW()') 
      });
    }

    res.json({ message: 'Cập nhật điểm thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật điểm', error: error.message });
  }
};

// Lấy bảng xếp hạng bạn bè cho một game
exports.getFriendLeaderboard = async (req, res) => {
  try {
    const { game_id } = req.params;
    const user_id = req.user.id;

    // Lấy danh sách ID của bạn bè
    const friends = await db('friends')
      .where(function() {
        this.where('user_id', user_id).orWhere('friend_id', user_id);
      })
      .andWhere('status', 'accepted');

    const friendIds = friends.map(f => f.user_id === user_id ? f.friend_id : f.user_id);
    friendIds.push(user_id); // Bao gồm cả chính mình trong bảng xếp hạng bạn bè

    // Lấy ranking của những ID này
    const leaderboard = await db('rankings')
      .join('users', 'rankings.user_id', '=', 'users.id')
      .select('users.username', 'rankings.high_score')
      .where('rankings.game_id', game_id)
      .whereIn('rankings.user_id', friendIds)
      .orderBy('rankings.high_score', 'desc');

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy ranking bạn bè', error: error.message });
  }
};
