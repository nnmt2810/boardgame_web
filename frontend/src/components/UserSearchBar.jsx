import { useState, useEffect, useRef } from 'react';
import { Search, X, UserPlus, UserCheck, Clock } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const UserSearchBar = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const resultsRef = useRef(null);

  // Debounce search
  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const query = searchTerm.trim();
        console.log('Searching for:', query);
        const response = await axiosClient.get(`/users/search?q=${encodeURIComponent(query)}`);
        console.log('Search results:', response.data);
        setResults(response.data);
        setShowResults(true);
      } catch (error) {
        console.error('Error searching users:', error);
        console.error('Error response:', error.response?.data);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Đóng kết quả khi click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target) &&
        resultsRef.current &&
        !resultsRef.current.contains(event.target)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSendFriendRequest = async (targetUserId) => {
    // Không cho phép gửi nếu đã gửi hoặc là bạn
    const target = results.find(r => r.id === targetUserId);
    if (!target || target.friendStatus === 'pending' || target.friendStatus === 'accepted') return;

    // Đánh dấu pending
    setResults(prev => prev.map(u => u.id === targetUserId ? { ...u, friendStatus: 'pending' } : u));

    try {
      await axiosClient.post('/friends/request', { friend_id: targetUserId });
      console.log(`Friend request sent to ${targetUserId}`);
    } catch (error) {
      console.error('Error sending friend request:', error);
      // Rollback UI nếu thất bại
      setResults(prev => prev.map(u => u.id === targetUserId ? { ...u, friendStatus: null } : u));
    }
  };

  const getButtonLabel = (status) => {
    switch (status) {
      case 'accepted':
        return 'Đã là bạn bè';
      case 'pending':
        return 'Đã gửi lời mời';
      default:
        return 'Kết bạn';
    }
  };

  return (
    <div className="relative flex-1 max-w-md mx-4">
      <div ref={searchRef} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Tìm kiếm người dùng..."
          className="w-full pl-10 pr-10 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.trim().length > 0 && setShowResults(true)}
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div ref={resultsRef} className="absolute z-40 mt-2 left-0 right-0 bg-white rounded-lg shadow-lg max-h-72 overflow-auto">
          {results.map(resultUser => (
            <div
              key={resultUser.id}
              className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
                  {resultUser.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">
                    {resultUser.username}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {resultUser.email}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => handleSendFriendRequest(resultUser.id)}
                disabled={resultUser.friendStatus === 'accepted' || resultUser.friendStatus === 'pending'}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  resultUser.friendStatus === 'accepted'
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : resultUser.friendStatus === 'pending'
                    ? 'bg-yellow-50 text-yellow-700 cursor-default'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {resultUser.friendStatus === 'accepted' ? <UserCheck size={14} /> : resultUser.friendStatus === 'pending' ? <Clock size={14} /> : <UserPlus size={14} />}
                <span>{getButtonLabel(resultUser.friendStatus)}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSearchBar;