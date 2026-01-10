const db = require('../database/db');

// Gửi lời mời kết bạn
exports.sendFriendRequest = async (req, res) => {
  try {
    const user_id = req.user.id; // Người gửi (lấy từ Token)
    const { friend_id } = req.body; // Người nhận

    if (user_id === parseInt(friend_id)) {
      return res.status(400).json({ message: "Bạn không thể kết bạn với chính mình" });
    }

    // Kiểm tra xem đã có lời mời hoặc đã là bạn chưa
    const existing = await db('friends')
      .where({ user_id, friend_id })
      .orWhere({ user_id: friend_id, friend_id: user_id })
      .first();

    if (existing) {
      return res.status(400).json({ message: "Yêu cầu đã tồn tại hoặc đã là bạn bè" });
    }

    await db('friends').insert({ user_id, friend_id, status: 'pending' });
    res.json({ message: "Đã gửi lời mời kết bạn" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

// Chấp nhận lời mời
exports.acceptFriendRequest = async (req, res) => {
  try {
    const user_id = req.user.id; // Người nhấn "Đồng ý"
    const { requestId } = req.body;

    const request = await db('friends').where({ id: requestId, friend_id: user_id }).first();

    if (!request) {
      return res.status(404).json({ message: "Không tìm thấy lời mời kết bạn" });
    }

    await db('friends').where({ id: requestId }).update({ status: 'accepted' });
    res.json({ message: "Đã trở thành bạn bè" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

// Xem danh sách bạn bè đã kết bạn
exports.getFriendsList = async (req, res) => {
  try {
    const user_id = req.user.id;
    const friends = await db('friends')
      .join('users', function() {
        this.on('friends.user_id', '=', 'users.id').orOn('friends.friend_id', '=', 'users.id')
      })
      .where(function() {
        this.where('friends.user_id', user_id).orWhere('friends.friend_id', user_id)
      })
      .andWhere('friends.status', 'accepted')
      .andWhereNot('users.id', user_id) // Không lấy chính mình
      .select('users.id', 'users.username', 'users.email');

    res.json(friends);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách bạn bè", error: error.message });
  }
};

// Xem các lời mời kết bạn
exports.getPendingRequests = async (req, res) => {
  try {
    const user_id = req.user.id;
    const requests = await db('friends')
      .join('users', 'friends.user_id', '=', 'users.id')
      .where({ 'friends.friend_id': user_id, 'friends.status': 'pending' })
      .select('friends.id as requestId', 'users.username', 'users.id as senderId');

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy lời mời", error: error.message });
  }
};