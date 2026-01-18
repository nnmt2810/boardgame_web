import React from 'react';
import { X } from 'lucide-react';

const SaveLoadModal = ({ isOpen, onClose, onLoad, onNew }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black">Đã save game trước đó</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
        </div>
        <p className="text-sm text-gray-600 mb-4">Bạn có muốn tiếp tục từ lần chơi trước hay bắt đầu ván mới?</p>
        <div className="flex gap-3">
          <button onClick={onLoad} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg">Tải ván</button>
          <button onClick={onNew} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg">Ván mới</button>
        </div>
      </div>
    </div>
  );
};

export default SaveLoadModal;