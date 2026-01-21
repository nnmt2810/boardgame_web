const db = require("../database/db");

// Hàm helper để resolve game ID
async function resolveGameId(gameParam) {
  if (!gameParam) return null;
  
  // Nếu là số, trả về trực tiếp
  if (/^\d+$/.test(String(gameParam))) {
    return Number(gameParam);
  }
  
  // Tìm game theo code
  const game = await db("games").where({ code: String(gameParam) }).first();
  return game?.id || null;
}

// Lấy tất cả comments của một game
exports.getGameComments = async (req, res) => {
  try {
    const { game_id } = req.params;
    
    const gameId = await resolveGameId(game_id);
    if (!gameId) {
      return res.status(404).json({ message: "Game không tồn tại" });
    }
    
    const comments = await db("comments")
      .join("users", "comments.user_id", "=", "users.id")
      .select("comments.id", "comments.content", "comments.created_at", "users.username", "users.id as user_id")
      .where("comments.game_id", gameId)
      .orderBy("comments.created_at", "desc");

    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Lỗi lấy comments", error: error.message });
  }
};

// Thêm comment cho game
exports.addComment = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { game_id, content } = req.body;

    const gameId = await resolveGameId(game_id);
    
    if (!gameId) {
      return res.status(404).json({ message: "Game không tồn tại" });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Nội dung comment không được để trống" });
    }

    if (content.length > 500) {
      return res.status(400).json({ message: "Comment quá dài (tối đa 500 ký tự)" });
    }

    // Insert comment
    const result = await db("comments").insert({ user_id, game_id: gameId, content });
    const newId = Array.isArray(result) ? result[0] : result;
    
    // Lấy username từ user
    const user = await db("users").where({ id: user_id }).select("username").first();
    
    // Return comment data ngay lập tức mà không cần query lại
    const newComment = {
      id: newId,
      content: content,
      created_at: new Date().toISOString(),
      username: user?.username || "Unknown",
      user_id: user_id
    };

    res.json({ message: "Comment đã được lưu", data: newComment });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Lỗi lưu comment", error: error.message });
  }
};

// Xóa comment (chỉ owner hoặc admin)
exports.deleteComment = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { comment_id } = req.params;

    const comment = await db("comments").where({ id: comment_id }).first();
    
    if (!comment) {
      return res.status(404).json({ message: "Comment không tồn tại" });
    }

    if (comment.user_id !== user_id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền xóa comment này" });
    }

    await db("comments").where({ id: comment_id }).delete();
    res.json({ message: "Comment đã được xóa" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Lỗi xóa comment", error: error.message });
  }
};
