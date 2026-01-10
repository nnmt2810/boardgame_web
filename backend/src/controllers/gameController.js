const db = require('../database/db');

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