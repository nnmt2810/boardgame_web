const db = require("../database/db");

async function resolveGame(gameParam) {
  if (!gameParam) return null;
  if (/^\d+$/.test(String(gameParam))) {
    const id = Number(gameParam);
    const game = await db("games").where({ id }).first();
    return game || null;
  }
  // Tìm theo code
  const game = await db("games")
    .where({ code: String(gameParam) })
    .first();
  return game || null;
}

function pickMetric(gameRow, metricOverride) {
  const metric = metricOverride ? String(metricOverride).toLowerCase() : null;
  if (metric === "score" || metric === "high_score") return "high_score";
  if (metric === "wins" || metric === "total_wins") return "total_wins";

  if (!gameRow) return "high_score";
  const code = (gameRow.code || "").toLowerCase();
  
  // Các game dựa trên điểm số (score-based)
  if (code === "snake" || code === "match3") return "high_score";
  
  // Mặc định các game khác coi là win-based (caro, tictactoe, etc.)
  return "total_wins";
}

// Lấy bảng xếp hạng toàn cầu cho một game
exports.getLeaderboard = async (req, res) => {
  try {
    const rawGameParam = req.params.game_id;
    const metricOverride = req.query.metric;
    const game = await resolveGame(rawGameParam);

    if (!game) {
      return res.status(404).json({ message: "Game không tồn tại" });
    }

    const metric = pickMetric(game, metricOverride);

    console.log(`Leaderboard for ${game.code} using metric: ${metric}`);

    // Chuẩn bị cột select theo metric
    const selectCols = ["users.id as user_id", "users.username"];
    if (metric === "high_score") {
      selectCols.push("rankings.high_score");
    } else {
      selectCols.push("rankings.total_wins");
    }
    selectCols.push("rankings.updated_at");

    const leaderboard = await db("rankings")
      .join("users", "rankings.user_id", "=", "users.id")
      .select(selectCols)
      .where("rankings.game_id", game.id)
      .orderBy(
        metric === "high_score" ? "rankings.high_score" : "rankings.total_wins",
        "desc",
      )
      .limit(10);

    // Chuẩn hóa kết quả trả về để frontend dễ dùng
    const normalized = leaderboard.map((row) => ({
      user_id: row.user_id,
      username: row.username,
      score:
        metric === "high_score" ? (row.high_score ?? 0) : (row.total_wins ?? 0),
      updated_at: row.updated_at ?? null,
    }));

    res.json(normalized);
  } catch (error) {
    console.error("getLeaderboard error:", error);
    res
      .status(500)
      .json({ message: "Lỗi lấy bảng xếp hạng", error: error.message });
  }
};

// Cập nhật điểm số / thắng sau khi kết thúc game
exports.updateScore = async (req, res) => {
  try {
    const { game_id: rawGameParam, score, win } = req.body;
    const user_id = req.user.id;

    const game = await resolveGame(rawGameParam);
    if (!game) {
      return res.status(404).json({ message: "Game không tồn tại" });
    }

    const metric = pickMetric(game, null);

    // Nếu có flag win => tăng total_wins lên 1
    if (win) {
      const existing = await db("rankings")
        .where({ user_id, game_id: game.id })
        .first();
      if (!existing) {
        await db("rankings").insert({
          user_id,
          game_id: game.id,
          total_wins: 1,
          high_score: 0,
        });
      } else {
        await db("rankings")
          .where({ user_id, game_id: game.id })
          .update({
            total_wins: db.raw("COALESCE(total_wins,0) + 1"),
            updated_at: db.raw("NOW()"),
          });
      }
      const updated = await db("rankings")
        .where({ user_id, game_id: game.id })
        .first();
      
      console.log(`✓ Win recorded for ${game.code}: user ${user_id}, total_wins: ${updated.total_wins}`);
      
      return res.json({ message: "Cập nhật thắng thành công", data: updated });
    }

    // Nếu có score => cập nhật high_score (chỉ khi cao hơn)
    if (typeof score !== "undefined" && score !== null) {
      if (isNaN(Number(score))) {
        return res.status(400).json({ message: "Score không hợp lệ" });
      }
      const numScore = Number(score);
      const existing = await db("rankings")
        .where({ user_id, game_id: game.id })
        .first();

      if (!existing) {
        await db("rankings").insert({
          user_id,
          game_id: game.id,
          high_score: numScore,
          total_wins: 0,
        });
        console.log(`✓ New high score for ${game.code}: user ${user_id}, score: ${numScore}`);
      } else if (numScore > (existing.high_score || 0)) {
        await db("rankings")
          .where({ user_id, game_id: game.id })
          .update({
            high_score: numScore,
            updated_at: db.raw("NOW()"),
          });
        console.log(`✓ Updated high score for ${game.code}: user ${user_id}, ${existing.high_score} → ${numScore}`);
      } else {
        console.log(`Score not updated for ${game.code}: ${numScore} <= ${existing.high_score}`);
      }
      
      const updated = await db("rankings")
        .where({ user_id, game_id: game.id })
        .first();
      return res.json({ message: "Cập nhật điểm thành công", data: updated });
    }

    return res
      .status(400)
      .json({ message: "Thiếu tham số cập nhật (score hoặc win)" });
  } catch (error) {
    console.error("updateScore error:", error);
    res
      .status(500)
      .json({ message: "Lỗi cập nhật điểm", error: error.message });
  }
};

// Lấy bảng xếp hạng bạn bè cho một game
exports.getFriendLeaderboard = async (req, res) => {
  try {
    const rawGameParam = req.params.game_id;
    const metricOverride = req.query.metric;
    const user_id = req.user.id;

    const game = await resolveGame(rawGameParam);
    if (!game) {
      return res.status(404).json({ message: "Game không tồn tại" });
    }

    const metric = pickMetric(game, metricOverride);

    // Lấy danh sách ID của bạn bè
    const friends = await db("friends")
      .where(function () {
        this.where("user_id", user_id).orWhere("friend_id", user_id);
      })
      .andWhere("status", "accepted");

    const friendIds = friends.map((f) =>
      f.user_id === user_id ? f.friend_id : f.user_id,
    );
    friendIds.push(user_id); // Bao gồm cả chính mình trong bảng xếp hạng bạn bè

    // Lấy ranking của những ID này
    const selectCols = ["users.id as user_id", "users.username"];
    if (metric === "high_score") selectCols.push("rankings.high_score");
    else selectCols.push("rankings.total_wins");

    const leaderboard = await db("rankings")
      .join("users", "rankings.user_id", "=", "users.id")
      .select(selectCols)
      .where("rankings.game_id", game.id)
      .whereIn("rankings.user_id", friendIds)
      .orderBy(
        metric === "high_score" ? "rankings.high_score" : "rankings.total_wins",
        "desc",
      );

    const normalized = leaderboard.map((row) => ({
      user_id: row.user_id,
      username: row.username,
      score:
        metric === "high_score" ? (row.high_score ?? 0) : (row.total_wins ?? 0),
    }));

    res.json(normalized);
  } catch (error) {
    console.error("getFriendLeaderboard error:", error);
    res
      .status(500)
      .json({ message: "Lỗi lấy ranking bạn bè", error: error.message });
  }
};