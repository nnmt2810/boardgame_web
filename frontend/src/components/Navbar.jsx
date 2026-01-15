import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LayoutDashboard, Trophy, Users, MessageSquare, LogOut, Gamepad2, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Nếu chưa đăng nhập thì không hiện Navbar
  if (!user) return null;

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2 text-indigo-600 font-bold text-xl">
              <Gamepad2 className="w-8 h-8" />
              <span className="hidden sm:block">AncientGame</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link 
              to="/profile" 
              className="flex items-center space-x-2 px-4 py-1.5 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-full transition-all duration-200 border border-transparent hover:border-indigo-200 group"
              title="Xem hồ sơ cá nhân"
            >
              <User size={16} className="text-gray-500 group-hover:text-indigo-600" />
              <span className="text-sm font-bold text-gray-700 group-hover:text-indigo-600">
                {user.username}
              </span>
            </Link>
            
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all rounded-lg"
              title="Đăng xuất"
            >
              <LogOut size={20} />
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
};

const NavItem = ({ to, icon, label }) => (
  <Link 
    to={to} 
    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all text-sm font-medium"
  >
    {icon}
    <span>{label}</span>
  </Link>
);

export default Navbar;