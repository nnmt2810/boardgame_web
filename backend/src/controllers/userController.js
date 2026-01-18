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
    const totalFriends = friendsDetails.length;

    // Lấy danh sách điểm cao nhất theo từng game
    const topScores = await db('rankings')
      .join('games', 'rankings.game_id', '=', 'games.id')
      .where('rankings.user_id', user_id)
      .select('games.name as game_name', 'rankings.high_score', 'rankings.updated_at');
    
    console.log('Profile data:', {
      user_id,
      friendsCount: friendsDetails.length,
      totalFriends
    });
    
    res.json({
      userInfo: user,
      friends: friendsDetails,
      totalFriends: totalFriends,
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

// Tìm kiếm người dùng theo username
exports.searchUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { q } = req.query; // Query string từ URL: /users/search?q=username
    
    if (!q || q.trim().length === 0) {
      return res.json([]);
    }

    const searchTerm = `%${q.trim()}%`;
    console.log('Search request:', { 
      currentUserId, 
      query: q, 
      searchTerm 
    });
    
    // Tìm kiếm users theo username (không bao gồm chính mình)
    // Sử dụng whereRaw để đảm bảo tương thích với PostgreSQL
    const users = await db('users')
      .whereRaw('LOWER(username) LIKE LOWER(?)', [searchTerm])
      .whereNot('id', currentUserId) // Không lấy chính mình
      .select('id', 'username', 'email', 'created_at')
      .limit(20); // Giới hạn 20 kết quả
    
    console.log('Found users:', users.length, users.map(u => ({ id: u.id, username: u.username })));
    
    // Kiểm tra trạng thái bạn bè cho mỗi user
    const userIds = users.map(u => u.id);
    const friendRelations = await db('friends')
      .where(function() {
        this.where('user_id', currentUserId).whereIn('friend_id', userIds);
      })
      .orWhere(function() {
        this.where('friend_id', currentUserId).whereIn('user_id', userIds);
      })
      .select('user_id', 'friend_id', 'status');
    
    // Tạo map để tra cứu nhanh trạng thái bạn bè
    const friendStatusMap = {};
    friendRelations.forEach(rel => {
      const friendId = rel.user_id === currentUserId ? rel.friend_id : rel.user_id;
      friendStatusMap[friendId] = rel.status;
    });
    
    // Thêm thông tin trạng thái bạn bè vào mỗi user
    const usersWithStatus = users.map(user => ({
      ...user,
      friendStatus: friendStatusMap[user.id] || null // null = chưa kết bạn
    }));
    
    res.json(usersWithStatus);
  } catch (error) {
    console.error('Error in searchUsers:', error);
    res.status(500).json({ message: "Lỗi tìm kiếm người dùng", error: error.message });
  }
};