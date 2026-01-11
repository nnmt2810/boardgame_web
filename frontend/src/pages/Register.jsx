import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { UserPlus } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/auth/register', formData);
      alert("Đăng ký thành công! Hãy đăng nhập.");
      navigate('/login');
    } catch (error) {
      alert("Lỗi đăng ký: " + (error.response?.data?.message || "Có lỗi xảy ra"));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-3 rounded-full">
            <UserPlus className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Tạo tài khoản mới</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên người dùng</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none transition-all"
              placeholder="nguyenvana"
              onChange={e => setFormData({...formData, username: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none transition-all"
              placeholder="email@example.com"
              onChange={e => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <input 
              type="password" 
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none transition-all"
              placeholder="••••••••"
              onChange={e => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>

          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-md">
            Đăng ký
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6 text-sm">
          Đã có tài khoản? <Link to="/login" className="text-green-600 hover:underline font-medium">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;