import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import axiosClient from '../api/axiosClient';
import { Users, Search, X, UserCheck, ExternalLink, Trophy, Mail } from "lucide-react";

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State quản lý Modal bạn bè
  const [showFullList, setShowFullList] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosClient.get('/users/me');
        setProfileData(response.data);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu Profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  if (loading) return <div className="text-center mt-10 font-mono animate-pulse">Đang tải dữ liệu hồ sơ...</div>;
  if (!profileData) return null;

  const userInfo = profileData.userInfo;
  const totalWins = userInfo?.total_wins || 0;
  const snakeScore = userInfo?.snake_high_score || 0;
  const totalFriends = profileData.totalFriends || 0;
  
  // Lấy danh sách bạn bè từ API
  const friends = profileData.friends || [];

  // Lọc bạn bè theo ô tìm kiếm
  const filteredFriends = friends.filter(f => 
    f.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow-2xl border border-gray-100">
      
      {/* HEADER HỒ SƠ */}
      <div className="relative mb-8 pb-8 border-b border-gray-100">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 bg-linear-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-6xl shadow-xl text-white font-black transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            {userInfo?.username?.charAt(0).toUpperCase() || "👤"}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">{userInfo?.username}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
              <p className="flex items-center gap-1 text-gray-500 text-sm font-medium">
                <Mail size={14} /> {userInfo?.email}
              </p>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span> Online
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* THỐNG KÊ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard title="Tổng trận thắng" value={totalWins} color="blue" icon={<Trophy size={20}/>} />
        <StatCard title="Điểm Snake" value={snakeScore} color="red" icon="🐍" />
        
        {/* Bạn bè */}
        <div className="group relative p-6 bg-linear-to-br from-green-50 to-green-100 rounded-2xl shadow-sm border-l-4 border-green-500 hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">Bạn bè</p>
              <p className="text-4xl font-black text-green-600 mt-1">{totalFriends}</p>
            </div>
            <button 
              onClick={() => setShowFullList(true)}
              className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-lg shadow-green-200"
            >
              <ExternalLink size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* THÀNH TÍCH CHI TIẾT */}
      {profileData.achievements?.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
            <Trophy className="text-yellow-500" /> THÀNH TÍCH CÁC GAME
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profileData.achievements.map((ach, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-white transition-all">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{ach.game_name}</p>
                <p className="text-2xl font-black text-gray-800 mt-1">{ach.high_score} <span className="text-xs text-gray-400 font-normal italic">pts</span></p>
                <p className="text-[9px] text-gray-400 mt-2 uppercase">Cập nhật: {new Date(ach.updated_at).toLocaleDateString('vi-VN')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="mt-12 pt-6 border-t border-gray-50 text-gray-400 text-[10px] flex justify-between font-mono">
        <p>UID: #{userInfo?.id?.toString().padStart(6, '0')}</p>
        <p>THÀNH VIÊN TỪ: {new Date(userInfo?.created_at).toLocaleDateString('vi-VN')}</p>
      </div>

      {/* MODAL HIỂN THỊ DANH SÁCH BẠN BÈ */}
      {showFullList && (
        <div className="fixed inset-0 z-1000 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowFullList(false)} />
          
          <div className="relative bg-white w-full max-w-md h-125 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
            {/* Header Modal */}
            <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black flex items-center gap-2 tracking-tighter uppercase">
                  <UserCheck size={20} /> Danh sách bạn bè
                </h2>
                <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest">Tổng cộng {friends.length} người</p>
              </div>
              <button onClick={() => setShowFullList(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Tìm tên bạn bè..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {filteredFriends.length > 0 ? (
                filteredFriends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                        {friend.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{friend.username}</p>
                        <p className="text-[10px] text-gray-400">Online</p>
                      </div>
                    </div>
                    <button className="p-2 text-gray-300 hover:text-indigo-600 transition-colors">
                      <ExternalLink size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-20">
                  <p className="text-gray-400 text-xs italic">Không tìm thấy ai phù hợp...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Component con Helper cho các thẻ thống kê
const StatCard = ({ title, value, color, icon }) => {
  const colors = {
    blue: "from-blue-50 to-blue-100 border-blue-500 text-blue-600",
    red: "from-red-50 to-red-100 border-red-500 text-red-600",
    green: "from-green-50 to-green-100 border-green-500 text-green-600"
  };
  
  return (
    <div className={`p-6 bg-linear-to-br ${colors[color]} rounded-2xl shadow-sm border-l-4 transition-transform hover:-translate-y-1`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-gray-400">{icon}</span>
        <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">{title}</p>
      </div>
      <p className={`text-4xl font-black ${colors[color].split(' ').pop()}`}>{value}</p>
    </div>
  );
};

export default Profile;