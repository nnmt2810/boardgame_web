const db = require('../database/db');

// Gửi tin nhắn
exports.sendMessage = async (req, res) => {
  try {
    const sender_id = req.user.id;
    const { receiver_id, content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Nội dung tin nhắn không được để trống" });
    }

    const newMessage = await db('messages').insert({
      sender_id,
      receiver_id,
      content
    }).returning('*');

    res.json({ message: "Đã gửi tin nhắn", data: newMessage[0] });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi gửi tin nhắn", error: error.message });
  }
};

// Lấy lịch sử tin nhắn giữa 2 người (Chat log)
exports.getMessageHistory = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { friend_id } = req.params;

    const chatHistory = await db('messages')
      .where(function() {
        this.where('sender_id', user_id).andWhere('receiver_id', friend_id);
      })
      .orWhere(function() {
        this.where('sender_id', friend_id).andWhere('receiver_id', user_id);
      })
      .orderBy('created_at', 'asc'); // Sắp xếp tin nhắn cũ trước, mới sau

    res.json(chatHistory);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy lịch sử tin nhắn", error: error.message });
  }
};

// Đánh dấu đã đọc
exports.markAsRead = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { friend_id } = req.params;

    await db('messages')
      .where({
        sender_id: friend_id,
        receiver_id: user_id,
        is_read: false
      })
      .update({ is_read: true });

    res.json({ message: "Đã đánh dấu các tin nhắn là đã đọc" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật trạng thái", error: error.message });
  }
};