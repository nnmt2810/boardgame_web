import React, { useEffect, useState } from 'react';
import { X, UserCheck, UserPlus } from 'lucide-react';
import axiosClient from '../api/axiosClient';

const PendingRequests = ({ isOpen, onClose, onAccepted }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState([]);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/friends/pending');
      setRequests(res.data || []);
    } catch (err) {
      console.error('Lỗi lấy lời mời:', err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchPending();
  }, [isOpen]);

  const acceptRequest = async (requestId) => {
    if (processingIds.includes(requestId)) return;
    setProcessingIds(prev => [...prev, requestId]);
    // Lập tức xóa khỏi list để hiển thị UI mượt hơn
    setRequests(prev => prev.filter(r => r.requestId !== requestId));

    try {
      await axiosClient.post('/friends/accept', { requestId });
      // Thông báo cho component cha để làm mới danh sách bạn bè / số lượng
      if (typeof onAccepted === 'function') onAccepted();
    } catch (err) {
      console.error('Lỗi chấp nhận lời mời:', err);
      await fetchPending();
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== requestId));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
          <h3 className="font-black flex items-center gap-2 uppercase tracking-tight">
            <UserPlus size={18} /> Lời mời kết bạn
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-center py-8 text-sm text-gray-500">Đang tải...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400 italic">Không có lời mời nào</div>
          ) : (
            <div className="space-y-3">
              {requests.map(r => (
                <div key={r.requestId} className="flex items-center justify-between p-3 border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                      {r.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{r.username}</p>
                      <p className="text-xs text-gray-400">ID: {r.senderId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => acceptRequest(r.requestId)}
                      disabled={processingIds.includes(r.requestId)}
                      className="flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 transition-colors"
                    >
                      <UserCheck size={14} /> Chấp nhận
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingRequests;