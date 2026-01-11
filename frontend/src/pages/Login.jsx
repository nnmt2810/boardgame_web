import { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/'); 
    } catch (error) {
      alert("Lỗi: " + (error.response?.data?.message || "Đăng nhập thất bại"));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-100 p-3 rounded-full">
            <LogIn className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
          Chào mừng quay trở lại
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="nguyenvana"
              value={username} 
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="••••••••"
              value={password} 
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            Đăng nhập
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6 text-sm">
          Chưa có tài khoản? <Link to="/register" className="text-indigo-600 hover:underline font-medium">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;