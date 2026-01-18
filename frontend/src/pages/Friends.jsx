import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import { UserCheck, UserPlus, UserX, ArrowLeft } from 'lucide-react';

const LIMIT = 10;

const Friends = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('friends'); // 'friends' | 'pending'
  const [friendsData, setFriendsData] = useState({ data: [], total: 0, page: 1, limit: LIMIT });
  const [pendingData, setPendingData] = useState({ data: [], total: 0, page: 1, limit: LIMIT });
  const [loading, setLoading] = useState(false);

  const fetchFriends = async (page = 1) => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/friends/list?page=${page}&limit=${LIMIT}`);
      setFriendsData({ data: res.data.data || [], total: res.data.total || 0, page: res.data.page || page, limit: res.data.limit || LIMIT });
    } catch (err) {
      console.error('Lỗi lấy friends:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPending = async (page = 1) => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/friends/pending?page=${page}&limit=${LIMIT}`);
      setPendingData({ data: res.data.data || [], total: res.data.total || 0, page: res.data.page || page, limit: res.data.limit || LIMIT });
    } catch (err) {
      console.error('Lỗi lấy pending:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'friends') fetchFriends(1);
    else fetchPending(1);
  }, [tab]);

  const handleUnfriend = async (otherUserId) => {
    if (!confirm('Bạn có chắc muốn hủy kết bạn / hủy lời mời với người này?')) return;
    try {
      await axiosClient.delete(`/friends/${otherUserId}`);
      await Promise.all([fetchFriends(friendsData.page), fetchPending(pendingData.page)]);
    } catch (err) {
      console.error('Lỗi unfriend:', err);
      alert(err.response?.data?.message || 'Lỗi khi hủy');
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await axiosClient.post('/friends/accept', { requestId });
      await Promise.all([fetchFriends(friendsData.page), fetchPending(pendingData.page)]);
    } catch (err) {
      console.error('Lỗi accept:', err);
      alert(err.response?.data?.message || 'Lỗi khi chấp nhận');
    }
  };

  const friendsTotalPages = Math.max(1, Math.ceil((friendsData.total || 0) / LIMIT));
  const pendingTotalPages = Math.max(1, Math.ceil((pendingData.total || 0) / LIMIT));

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow-2xl border border-gray-100">
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => navigate('/profile')} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft /> Quay lại
        </button>
        <h1 className="text-2xl font-black">Bạn bè & Lời mời</h1>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setTab('friends')} className={`px-4 py-2 rounded-lg ${tab === 'friends' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Bạn bè</button>
        <button onClick={() => setTab('pending')} className={`px-4 py-2 rounded-lg ${tab === 'pending' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Lời mời</button>
      </div>

      {loading && <div className="py-6 text-center text-sm text-gray-500">Đang tải...</div>}

      {tab === 'friends' && (
        <div>
          {friendsData.data.length === 0 ? (
            <div className="py-8 text-center text-gray-400 italic">Bạn chưa có bạn bè nào.</div>
          ) : (
            <div className="space-y-3">
              {friendsData.data.map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold">{f.username?.charAt(0)?.toUpperCase()}</div>
                    <div>
                      <p className="font-semibold">{f.username}</p>
                      <p className="text-xs text-gray-400">{f.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleUnfriend(f.id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm">Hủy bạn</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {friendsTotalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button disabled={friendsData.page <= 1} onClick={() => fetchFriends(friendsData.page - 1)} className="px-3 py-1 bg-gray-100 rounded">Trước</button>
              <span className="px-3 py-1">{friendsData.page} / {friendsTotalPages}</span>
              <button disabled={friendsData.page >= friendsTotalPages} onClick={() => fetchFriends(friendsData.page + 1)} className="px-3 py-1 bg-gray-100 rounded">Sau</button>
            </div>
          )}
        </div>
      )}

      {tab === 'pending' && (
        <div>
          {pendingData.data.length === 0 ? (
            <div className="py-8 text-center text-gray-400 italic">Không có lời mời.</div>
          ) : (
            <div className="space-y-3">
              {pendingData.data.map(r => (
                <div key={r.requestId} className="flex items-center justify-between p-3 border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold">{r.username?.charAt(0)?.toUpperCase()}</div>
                    <div>
                      <p className="font-semibold">{r.username}</p>
                      <p className="text-xs text-gray-400">{r.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.isIncoming ? (
                      <button onClick={() => handleAccept(r.requestId)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm">Chấp nhận</button>
                    ) : (
                      <button onClick={() => handleUnfriend(r.counterpartId)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm">Hủy yêu cầu</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pendingTotalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button disabled={pendingData.page <= 1} onClick={() => fetchPending(pendingData.page - 1)} className="px-3 py-1 bg-gray-100 rounded">Trước</button>
              <span className="px-3 py-1">{pendingData.page} / {pendingTotalPages}</span>
              <button disabled={pendingData.page >= pendingTotalPages} onClick={() => fetchPending(pendingData.page + 1)} className="px-3 py-1 bg-gray-100 rounded">Sau</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Friends;