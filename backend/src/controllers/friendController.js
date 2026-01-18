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
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = (page - 1) * limit;

    // Lấy tất cả relation accepted liên quan tới user
    const relations = await db('friends')
      .where(function() {
        this.where('user_id', user_id).orWhere('friend_id', user_id);
      })
      .andWhere('status', 'accepted')
      .select('user_id', 'friend_id');

    const friendIds = relations.map(f => f.user_id === user_id ? f.friend_id : f.user_id);

    const total = friendIds.length;
    const pagedIds = friendIds.slice(offset, offset + limit);

    let friends = [];
    if (pagedIds.length > 0) {
      const rows = await db('users')
        .whereIn('id', pagedIds)
        .select('id', 'username', 'email');
      // Giữ thứ tự theo pagedIds
      const rowsMap = rows.reduce((acc, r) => {
        acc[r.id] = r;
        return acc;
      }, {});
      friends = pagedIds.map(id => rowsMap[id]).filter(Boolean);
    }

    res.json({ data: friends, total, page, limit });
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách bạn bè", error: error.message });
  }
};

// Xem các lời mời kết bạn (incoming và outgoing)
exports.getPendingRequests = async (req, res) => {
  try {
    const user_id = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = (page - 1) * limit;

    // Lấy tất cả record pending liên quan tới user
    const rows = await db('friends')
      .where('status', 'pending')
      .andWhere(function() {
        this.where('user_id', user_id).orWhere('friend_id', user_id);
      })
      .select('id', 'user_id', 'friend_id');

    const total = rows.length;
    const paged = rows.slice(offset, offset + limit);

    // Lấy thông tin user cho mỗi record
    const counterpartIds = paged.map(r => (r.user_id === user_id ? r.friend_id : r.user_id));
    let users = [];
    if (counterpartIds.length > 0) {
      users = await db('users')
        .whereIn('id', counterpartIds)
        .select('id', 'username', 'email');
    }
    const usersMap = users.reduce((acc, u) => { acc[u.id] = u; return acc; }, {});

    const data = paged.map(r => {
      const isIncoming = r.friend_id === user_id; // nếu true thì user nhận lời mời từ r.user_id
      const otherId = isIncoming ? r.user_id : r.friend_id;
      return {
        requestId: r.id,
        senderId: r.user_id,
        receiverId: r.friend_id,
        counterpartId: otherId,
        username: usersMap[otherId]?.username || null,
        email: usersMap[otherId]?.email || null,
        isIncoming
      };
    });

    res.json({ data, total, page, limit });
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy lời mời", error: error.message });
  }
};

// Hủy kết bạn hoặc hủy lời mời
exports.removeFriend = async (req, res) => {
  try {
    const user_id = req.user.id;
    const friendId = parseInt(req.params.friendId);

    if (!friendId) {
      return res.status(400).json({ message: "friendId không hợp lệ" });
    }

    const record = await db('friends')
      .where(function() {
        this.where({ user_id: user_id, friend_id: friendId })
            .orWhere({ user_id: friendId, friend_id: user_id });
      })
      .first();

    if (!record) {
      return res.status(404).json({ message: "Không tìm thấy mối quan hệ" });
    }

    await db('friends').where({ id: record.id }).del();

    // Trả về thông tin về hành động đã thực hiện
    res.json({ message: `Đã hủy ${record.status === 'accepted' ? 'kết bạn' : 'lời mời'}` });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};