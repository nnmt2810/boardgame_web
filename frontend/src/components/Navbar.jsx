import { useState, useRef, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LogOut, Gamepad2, User, MessageSquare, Shield, Lock } from 'lucide-react';
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

  const isAdmin = user?.role === "admin";

  return (
    <nav className={`shadow-md border-b sticky top-0 z-50 ${
      isAdmin 
        ? 'bg-linear-to-r from-amber-500 via-orange-500 to-red-500 border-amber-600' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          
          <div className="flex items-center space-x-8">
            <Link 
              to="/" 
              className={`flex items-center space-x-2 font-bold text-xl ${
                isAdmin 
                  ? 'text-white drop-shadow-md' 
                  : 'text-indigo-600'
              }`}
            >
              <Gamepad2 className="w-8 h-8" />
              <span className="hidden sm:block">AncientGame</span>
              {isAdmin && (
                <Shield className="w-5 h-5 ml-1 text-yellow-200 animate-pulse" />
              )}
            </Link>
          </div>

          {/* Search Bar */}
          <UserSearchBar />

          <div className="flex items-center space-x-4">
            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setOpenUserMenu((s) => !s)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-full transition-all duration-200 border group ${
                  isAdmin
                    ? 'bg-amber-900/30 hover:bg-amber-900/50 border-amber-300/50 hover:border-yellow-200 backdrop-blur-sm'
                    : 'bg-gray-100 hover:bg-indigo-50 border-transparent hover:border-indigo-200'
                }`}
                title="Tài khoản"
                aria-haspopup="true"
                aria-expanded={openUserMenu}
              >
                {isAdmin ? (
                  <Lock size={16} className="text-yellow-200 group-hover:text-yellow-100" />
                ) : (
                  <User size={16} className="text-gray-500 group-hover:text-indigo-600" />
                )}
                <span className={`text-sm font-bold ${
                  isAdmin 
                    ? 'text-white group-hover:text-yellow-50' 
                    : 'text-gray-700 group-hover:text-indigo-600'
                }`}>
                  {user.username}
                </span>
                {isAdmin && (
                  <span className="px-2 py-0.5 bg-yellow-400 text-amber-900 text-xs font-bold rounded uppercase shadow-sm">
                    Admin
                  </span>
                )}
              </button>

              {openUserMenu && (
                <div className={`absolute right-0 mt-2 w-52 rounded-md shadow-lg ring-1 ring-opacity-5 z-50 overflow-hidden ${
                  isAdmin
                    ? 'bg-linear-to-b from-amber-50 to-orange-50 text-gray-900 ring-amber-300'
                    : 'bg-white text-gray-900 ring-black'
                }`}>
                  {isAdmin && (
                    <>
                      <Link
                        to="/admin"
                        onClick={() => setOpenUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-linear-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                      >
                        <Shield size={16} />
                        <span>Admin Dashboard</span>
                      </Link>
                      <div className="border-t border-amber-300 my-1"></div>
                    </>
                  )}
                  <Link
                    to="/messages"
                    onClick={() => setOpenUserMenu(false)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm ${
                      isAdmin ? 'hover:bg-amber-100' : 'hover:bg-gray-100'
                    }`}
                  >
                    <MessageSquare size={16} />
                    <span>Messages</span>
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setOpenUserMenu(false)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm ${
                      isAdmin ? 'hover:bg-amber-100' : 'hover:bg-gray-100'
                    }`}
                  >
                    <User size={16} />
                    <span>Profile</span>
                  </Link>
                </div>
              )}
            </div>
            
            <button 
              onClick={handleLogout}
              className={`p-2 transition-all rounded-lg ${
                isAdmin
                  ? 'text-white hover:text-red-200 hover:bg-red-600/50'
                  : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
              }`}
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