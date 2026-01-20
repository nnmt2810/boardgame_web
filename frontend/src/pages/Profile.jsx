import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import axiosClient from "../api/axiosClient";
import { ExternalLink, Trophy, Mail } from "lucide-react";

const Profile = () => {
  const { user, setUser, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchProfile = async (signal) => {
    try {
      setError(null);
      const response = await axiosClient.get("/users/me", {
        timeout: 8000,
        signal,
        headers: { "Cache-Control": "no-cache" },
      });
      const data = response.data || {};
      const userInfo = data.userInfo ?? data.user ?? null;
      setProfileData({ userInfo, totalFriends: data.totalFriends ?? 0, friends: data.friends ?? [] });

      if (userInfo && typeof setUser === "function") {
        setUser((prev) => {
          if (!prev) return userInfo;
          if (prev.id !== userInfo.id) return userInfo;
          // Cập nhật chỉ khi có thay đổi
          if (
            (prev.total_wins ?? 0) !== (userInfo.total_wins ?? 0) ||
            (prev.snake_high_score ?? 0) !== (userInfo.snake_high_score ?? 0) ||
            (prev.match3_high_score ?? 0) !== (userInfo.match3_high_score ?? 0)
          ) {
            return userInfo;
          }
          return prev;
        });
      }
    } catch (err) {
      if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      console.error("Lỗi lấy dữ liệu Profile:", err);
      const msg = err?.response?.data?.message || err?.message || "Lỗi khi lấy profile";
      setError(msg);
      setProfileData(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const start = Date.now();
        while (authLoading && Date.now() - start < 5000 && mounted) {
          await new Promise((r) => setTimeout(r, 100));
        }

        if (user) {
          await fetchProfile(controller.signal);
        } else {
          setProfileData(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
      try {
        controller.abort();
      } catch (e) {}
    };
    // Dựa vào user.id để refetch khi user thay đổi
  }, [user?.id, authLoading, setUser]);

  if (authLoading || loading)
    return (
      <div className="text-center mt-10 font-mono animate-pulse">
        Đang tải dữ liệu hồ sơ...
      </div>
    );

  if (error)
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
        <h3 className="text-lg font-bold mb-2">Không thể tải profile</h3>
        <p className="text-sm text-gray-600 mb-4">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                await fetchProfile();
              } finally {
                setLoading(false);
              }
            }}
            className="px-3 py-2 bg-indigo-600 text-white rounded"
          >
            Thử lại
          </button>
          <button onClick={() => navigate("/")} className="px-3 py-2 bg-gray-200 rounded">
            Về trang chủ
          </button>
        </div>
      </div>
    );

  if (!profileData) {
    return <div className="text-center mt-12 text-gray-500">Chưa có dữ liệu hồ sơ để hiển thị.</div>;
  }

  const userInfo = profileData.userInfo ?? {};
  const totalWins = userInfo?.total_wins ?? 0;
  const snakeScore = userInfo?.snake_high_score ?? 0;
  const match3Score = userInfo?.match3_high_score ?? 0;
  const totalFriends = profileData.totalFriends ?? 0;
  const friends = profileData.friends ?? [];

  const filteredFriends = friends.filter((f) =>
    f.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow-2xl border border-gray-100">
      {/* HEADER */}
      <div className="relative mb-8 pb-8 border-b border-gray-100">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 bg-linear-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-6xl shadow-xl text-white font-black transform -rotate-3">
            {userInfo?.username?.charAt(0).toUpperCase() || "👤"}
          </div>

          <div className="text-center md:text-left">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">
              {userInfo?.username}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
              <p className="flex items-center gap-1 text-gray-500 text-sm font-medium">
                <Mail size={14} /> {userInfo?.email}
              </p>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>{" "}
                Online
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard title="Tổng trận thắng" value={totalWins} color="blue" icon={<Trophy size={20} />} />
        <StatCard title="Điểm Snake" value={snakeScore} color="red" icon="🐍" />
        <StatCard title="Điểm Match3" value={match3Score} color="green" icon="🎯" />
      </div>

      {/* FRIENDS PREVIEW */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Bạn bè của tôi</h3>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Tìm kiếm trong bạn bè..."
              className="pl-3 pr-3 py-1 rounded-lg bg-gray-100 text-sm focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button onClick={() => navigate("/friends")} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm">
              Xem tất cả
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredFriends.length === 0 ? (
            <div className="text-center py-8 text-gray-400 italic">Không có bạn bè để hiển thị.</div>
          ) : (
            filteredFriends.slice(0, 6).map((friend) => (
              <div key={friend.id} className="flex items-center justify-between p-3 border rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                    {friend.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{friend.username}</p>
                    <p className="text-xs text-gray-400">{friend.email ?? ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-300 hover:text-indigo-600 transition-colors">
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-12 pt-6 border-t border-gray-50 text-gray-400 text-[10px] flex justify-between font-mono">
        <p>UID: #{userInfo?.id?.toString().padStart(6, "0")}</p>
        <p>THÀNH VIÊN TỪ: {new Date(userInfo?.created_at).toLocaleDateString("vi-VN")}</p>
      </div>
    </div>
  );
};

// StatCard helper component
const StatCard = ({ title, value, color, icon }) => {
  const colors = {
    blue: "from-blue-50 to-blue-100 border-blue-500 text-blue-600",
    red: "from-red-50 to-red-100 border-red-500 text-red-600",
    green: "from-green-50 to-green-100 border-green-500 text-green-600",
  };

  return (
    <div className={`p-6 bg-linear-to-br ${colors[color]} rounded-2xl shadow-sm border-l-4 transition-transform hover:-translate-y-1`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-gray-400">{icon}</span>
        <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">{title}</p>
      </div>
      <p className={`text-4xl font-black ${colors[color].split(" ").pop()}`}>{value}</p>
    </div>
  );
};

export default Profile;