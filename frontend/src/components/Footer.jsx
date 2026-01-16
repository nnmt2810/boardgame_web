import { Link } from 'react-router-dom';
import { Gamepad2, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Gamepad2 className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-bold text-white">AncientGame</span>
            </div>
            <p className="text-xs text-gray-400">
              Nền tảng game board trực tuyến với nhiều trò chơi thú vị.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-xs font-semibold mb-2">Liên kết nhanh</h3>
            <ul className="space-y-1">
              <li>
                <Link to="/" className="text-xs text-gray-400 hover:text-indigo-400 transition-colors">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-xs text-gray-400 hover:text-indigo-400 transition-colors">
                  Hồ sơ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white text-xs font-semibold mb-2">Liên hệ</h3>
            <ul className="space-y-1">
              <li className="flex items-center space-x-1">
                <Mail className="w-3 h-3" />
                <a href="mailto:support@ancientgame.com" className="text-xs text-gray-400 hover:text-indigo-400 transition-colors">
                  support@ancientgame.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-4 pt-3 text-center text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} AncientGame. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

