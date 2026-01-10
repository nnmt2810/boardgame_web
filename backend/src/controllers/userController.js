const db = require('../database/db');

exports.getProfile = async (req, res) => {
  try {
    const user_id = req.user.id; // Lấy từ Token sau khi verify

    // Lấy thông tin cơ bản của user
    const user = await db('users')
      .where({ id: user_id })
      .select('username', 'email', 'created_at')
      .first();

    // Lấy số lượng bạn bè
    const friendsCount = await db('friends')
      .where(function() {
        this.where('user_id', user_id).orWhere('friend_id', user_id);
      })
      .andWhere('status', 'accepted')
      .count('id as total');

    // Lấy danh sách điểm cao nhất theo từng game
    const topScores = await db('rankings')
      .join('games', 'rankings.game_id', '=', 'games.id')
      .where('rankings.user_id', user_id)
      .select('games.name as game_name', 'rankings.high_score', 'rankings.updated_at');
    
    res.json({
      userInfo: user,
      totalFriends: parseInt(friendsCount[0].total),
      achievements: topScores
    });

  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy thông tin Profile", error: error.message });
  }
};