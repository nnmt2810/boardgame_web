const db = require('../database/db');

exports.getProfile = async (req, res) => {
  try {
    const user_id = req.user.id; // Lấy từ Token sau khi verify

    // Lấy thông tin cơ bản của user kèm stats
    const user = await db('users')
      .where({ id: user_id })
      .select('id', 'username', 'email', 'total_wins', 'snake_high_score', 'created_at')
      .first();

    // Lấy danh sách bạn bè
    const friendsList = await db('friends')
      .where(function() {
        this.where('user_id', user_id).orWhere('friend_id', user_id);
      })
      .andWhere('status', 'accepted')
      .select('user_id', 'friend_id');
    
    // Lấy chi tiết bạn bè
    const friendIds = friendsList.map(f => f.user_id === user_id ? f.friend_id : f.user_id);
    const friendsDetails = await db('users')
      .whereIn('id', friendIds)
      .select('id', 'username');

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
      friends: friendsDetails,
      totalFriends: parseInt(friendsCount[0].total),
      achievements: topScores
    });

  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy thông tin Profile", error: error.message });
  }
};

// Cập nhật thống kê người chơi (trận thắng hoặc điểm cao Snake)
exports.updatePlayerStats = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { stat_type, value } = req.body;

    const user = await db('users').where({ id: user_id }).first();
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    const updateData = {};

    if (stat_type === 'win') {
      // Cộng thêm 1 trận thắng
      updateData.total_wins = (user.total_wins || 0) + 1;
    } else if (stat_type === 'snake_score') {
      // Cập nhật điểm Snake nếu cao hơn
      if (value > (user.snake_high_score || 0)) {
        updateData.snake_high_score = value;
      }
    } else {
      return res.status(400).json({ message: "Loại thống kê không hợp lệ" });
    }

    if (Object.keys(updateData).length > 0) {
      await db('users').where({ id: user_id }).update(updateData);
    }

    res.json({ 
      message: "Cập nhật thống kê thành công",
      stats: {
        total_wins: updateData.total_wins || user.total_wins,
        snake_high_score: updateData.snake_high_score || user.snake_high_score
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật thống kê", error: error.message });
  }
};