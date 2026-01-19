import { useEffect, useState, useContext, useCallback } from "react";
import axiosClient from "../api/axiosClient";
import { AuthContext } from "../contexts/AuthContext";

export default function LeaderboardPanel({ gameId, compact = true }) {
  const { user } = useContext(AuthContext);
  const me = user?.username;
  const [tab, setTab] = useState("system"); // 'system' | 'friends'
  const [systemRows, setSystemRows] = useState([]);
  const [friendRows, setFriendRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSystem = useCallback(async () => {
    if (!gameId) return;
    try {
      const res = await axiosClient.get(
        `/games/leaderboard/${encodeURIComponent(gameId)}`,
      );
      const payload = res?.data ?? [];
      const arr = Array.isArray(payload)
        ? payload
        : payload.data && Array.isArray(payload.data)
          ? payload.data
          : [];
      const normalized = arr.map((r) => ({
        user_id: r.user_id ?? r.id,
        username: r.username ?? r.name ?? "Unknown",
        score: r.score ?? r.high_score ?? r.total_wins ?? 0,
        updated_at: r.updated_at ?? r.updatedAt ?? null,
      }));
      setSystemRows(normalized.slice(0, 10));
      setError(null);
    } catch (err) {
      console.error("fetchSystem leaderboard", err);
      setSystemRows([]);
      setError("Không thể tải bảng xếp hạng hệ thống");
    }
  }, [gameId]);

  const fetchFriends = useCallback(async () => {
    if (!gameId) return;
    try {
      const res = await axiosClient.get(
        `/games/leaderboard/friends/${encodeURIComponent(gameId)}`,
      );
      const payload = res?.data ?? [];
      const arr = Array.isArray(payload)
        ? payload
        : payload.data && Array.isArray(payload.data)
          ? payload.data
          : [];
      const normalized = arr.map((r) => ({
        user_id: r.user_id ?? r.id,
        username: r.username ?? r.name ?? "Unknown",
        score: r.score ?? r.high_score ?? r.total_wins ?? 0,
      }));
      setFriendRows(normalized.slice(0, 10));
      setError(null);
    } catch (err) {
      console.error("fetchFriends leaderboard", err);
      setFriendRows([]);
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setError("Đăng nhập để xem bảng xếp hạng bạn bè");
      } else {
        setError("Không thể tải bảng xếp hạng bạn bè");
      }
    }
  }, [gameId, user]);

  const refresh = useCallback(async () => {
    setError(null);
    setLoading(true);
    await Promise.allSettled([
      fetchSystem(),
      user ? fetchFriends() : Promise.resolve(),
    ]);
    setLoading(false);
  }, [fetchSystem, fetchFriends, user]);

  useEffect(() => {
    setSystemRows([]);
    setFriendRows([]);
    setError(null);
    if (gameId) refresh();
  }, [gameId, user, refresh]);

  // Làm mới leaderboard khi có event cập nhật mới
  useEffect(() => {
    const onRefresh = (e) => {
      try {
        const gid = e?.detail?.gameId;
        if (!gid) {
          refresh();
          return;
        }
        if (String(gid) === String(gameId)) {
          refresh();
        }
      } catch (err) {
        console.error("Error handling leaderboard:refresh event", err);
      }
    };
    window.addEventListener("leaderboard:refresh", onRefresh);
    return () => window.removeEventListener("leaderboard:refresh", onRefresh);
  }, [gameId, refresh]);

  const rows = tab === "system" ? systemRows : friendRows;
  const title = tab === "system" ? "Hệ thống" : "Bạn bè";

  return (
    <div
      className={`mt-3 p-3 rounded-lg border ${compact ? "text-sm" : ""} bg-white/5 border-white/10`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("system")}
            className={`px-2 py-1 rounded ${tab === "system" ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-white/5"}`}
          >
            Hệ thống
          </button>
          <button
            onClick={() => setTab("friends")}
            className={`px-2 py-1 rounded ${tab === "friends" ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-white/5"}`}
          >
            Bạn bè
          </button>
          <div className="text-xs text-gray-300 ml-3">
            {gameId ? `Game: ${gameId}` : "Chọn game để xem"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && <div className="text-xs text-gray-300">Loading...</div>}
      {error && <div className="text-xs text-red-400 mb-2">{error}</div>}

      {!loading && rows.length === 0 && (
        <div className="text-xs text-gray-400">
          Không có dữ liệu cho mục {title}.
        </div>
      )}

      <ol className="mt-2 space-y-1">
        {rows.slice(0, 5).map((r, i) => (
          <li
            key={r.username + "-" + i}
            className={`flex justify-between items-center px-2 py-1 rounded ${r.username === me ? "bg-yellow-50 text-gray-900" : "text-gray-200"}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 text-right font-mono text-sm">{i + 1}.</div>
              <div className="font-medium">{r.username}</div>
            </div>
            <div className="font-mono">{r.score}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}
