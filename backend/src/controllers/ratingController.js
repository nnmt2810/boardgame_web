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

// Lấy tất cả ratings của một game
exports.getGameRatings = async (req, res) => {
  try {
    const { game_id } = req.params;
    const gameId = await resolveGameId(game_id);
    
    if (!gameId) {
      return res.status(404).json({ message: "Game không tồn tại" });
    }
    
    const ratings = await db("ratings")
      .join("users", "ratings.user_id", "=", "users.id")
      .select("ratings.id", "ratings.rating", "ratings.created_at", "users.username")
      .where("ratings.game_id", gameId)
      .orderBy("ratings.created_at", "desc");

    const avgRating = await db("ratings")
      .where("game_id", gameId)
      .avg("rating as avg")
      .first();

    const count = await db("ratings")
      .where("game_id", gameId)
      .count("* as total")
      .first();

    res.json({
      ratings,
      average: avgRating?.avg ? parseFloat(avgRating.avg).toFixed(1) : 0,
      count: count?.total || 0,
    });
  } catch (error) {
    console.error("Error fetching ratings:", error);
    res.status(500).json({ message: "Lỗi lấy ratings", error: error.message });
  }
};

// User rate một game
exports.rateGame = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { game_id, rating } = req.body;

    const gameId = await resolveGameId(game_id);
    if (!gameId) {
      return res.status(404).json({ message: "Game không tồn tại" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating phải từ 1-5" });
    }

    const existing = await db("ratings")
      .where({ user_id, game_id: gameId })
      .first();

    if (existing) {
      // Cập nhật rating cũ
      await db("ratings")
        .where({ user_id, game_id: gameId })
        .update({ rating, updated_at: db.raw("NOW()") });
      return res.json({ message: "Rating đã được cập nhật", data: { user_id, game_id: gameId, rating } });
    }

    // Tạo rating mới
    await db("ratings").insert({ user_id, game_id: gameId, rating });
    res.json({ message: "Rating đã được lưu", data: { user_id, game_id: gameId, rating } });
  } catch (error) {
    console.error("Error saving rating:", error);
    res.status(500).json({ message: "Lỗi lưu rating", error: error.message });
  }
};

// Lấy rating của user hiện tại cho game
exports.getUserRating = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { game_id } = req.params;

    const gameId = await resolveGameId(game_id);
    if (!gameId) {
      return res.status(404).json({ message: "Game không tồn tại" });
    }

    const rating = await db("ratings")
      .where({ user_id, game_id: gameId })
      .first();

    res.json({ rating: rating?.rating || 0 });
  } catch (error) {
    console.error("Error fetching user rating:", error);
    res.status(500).json({ message: "Lỗi lấy rating", error: error.message });
  }
};
