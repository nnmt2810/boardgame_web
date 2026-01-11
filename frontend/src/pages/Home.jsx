import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const Home = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-indigo-600">Chào mừng, {user?.username}!</h1>
        <p className="mt-2 text-gray-600">Bạn đã đăng nhập thành công vào hệ thống Boardgame.</p>
        
        <button 
          onClick={logout}
          className="mt-6 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
};

export default Home;