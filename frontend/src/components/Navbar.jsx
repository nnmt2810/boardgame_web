import { useState, useRef, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LayoutDashboard, Trophy, MessageSquare, LogOut, Gamepad2, User } from 'lucide-react';
import UserSearchBar from './UserSearchBar';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [openUserMenu, setOpenUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const onClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setOpenUserMenu(false);
      }
    };
    const onEsc = (e) => {
      if (e.key === 'Escape') setOpenUserMenu(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  // Nếu chưa đăng nhập thì không hiện Navbar
  if (!user) return null;

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2 text-indigo-600 font-bold text-xl">
              <Gamepad2 className="w-8 h-8" />
              <span className="hidden sm:block">AncientGame</span>
            </Link>
          </div>

          {/* Search Bar */}
          <UserSearchBar />

          <div className="flex items-center space-x-4">
            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setOpenUserMenu((s) => !s)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-full transition-all duration-200 border border-transparent hover:border-indigo-200 group"
                title="Tài khoản"
                aria-haspopup="true"
                aria-expanded={openUserMenu}
              >
                <User size={16} className="text-gray-500 group-hover:text-indigo-600" />
                <span className="text-sm font-bold text-gray-700 group-hover:text-indigo-600">
                  {user.username}
                </span>
              </button>

              {openUserMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-white text-gray-900 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
                  <Link
                    to="/messages"
                    onClick={() => setOpenUserMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    <MessageSquare size={16} />
                    <span>Messages</span>
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setOpenUserMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    <User size={16} />
                    <span>Profile</span>
                  </Link>
                </div>
              )}
            </div>
            
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

export default Navbar;