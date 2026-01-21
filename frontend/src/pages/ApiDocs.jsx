import { useState, useContext } from "react";
import { Navigate } from "react-router";
import { AuthContext } from "../contexts/AuthContext";
import { Lock, FileText, Eye, EyeOff } from "lucide-react";

export default function ApiDocs() {
  const { user } = useContext(AuthContext);
  const [apiKey, setApiKey] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Verify với backend API key đã có
      const response = await fetch("https://localhost:5000/api/verify-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: apiKey }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setIsVerified(true);
        setError("");
      } else {
        setError("Invalid API Key. Please check and try again.");
      }
    } catch (err) {
      setError("Failed to verify API key. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Form nhập API key
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-indigo-100 rounded-full mb-4">
              <Lock className="w-12 h-12 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">API Documentation</h1>
            <p className="text-gray-600">Enter your API key to access the documentation</p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showKey ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !apiKey.trim()}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Verifying..." : "Access Documentation"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Need help? Contact your administrator to get an API key.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Nội dung API docs (sau khi verify thành công)
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-600" />
            API Documentation
          </h1>
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2 rounded-full border border-green-200">
            <Lock size={16} />
            <span className="font-semibold">Verified Access</span>
          </div>
        </div>
        
        <div className="mb-8">
          <p className="text-gray-600 mb-4">
            Base URL: <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:5000/api</code>
          </p>
          <p className="text-sm text-gray-500">
            All requests require authentication token in header: <code className="bg-gray-100 px-2 py-1 rounded">Authorization: Bearer YOUR_TOKEN</code>
          </p>
        </div>

        {/* Authentication */}
        <section className="mb-8 border-b pb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4"> Authentication</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-green-500 text-white px-3 py-1 rounded text-sm font-semibold">POST</span>
                <code className="text-gray-700">/auth/register</code>
              </div>
              <p className="text-sm text-gray-600 mb-2">Register new user</p>
              <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`{
  "username": "string",
  "email": "string",
  "password": "string"
}`}
              </pre>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-green-500 text-white px-3 py-1 rounded text-sm font-semibold">POST</span>
                <code className="text-gray-700">/auth/login</code>
              </div>
              <p className="text-sm text-gray-600 mb-2">Login user</p>
              <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`{
  "email": "string",
  "password": "string"
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* Games */}
        <section className="mb-8 border-b pb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4"> Games</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-semibold">GET</span>
                <code className="text-gray-700">/games</code>
              </div>
              <p className="text-sm text-gray-600">Get all games with pagination</p>
              <p className="text-xs text-gray-500 mt-1">Query params: ?page=1&limit=10&search=keyword</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-semibold">GET</span>
                <code className="text-gray-700">/games/:id</code>
              </div>
              <p className="text-sm text-gray-600">Get single game by ID</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-green-500 text-white px-3 py-1 rounded text-sm font-semibold">POST</span>
                <code className="text-gray-700">/games</code>
              </div>
              <p className="text-sm text-gray-600 mb-2">Create new game (Admin only)</p>
              <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`{
  "name": "string",
  "description": "string",
  "min_players": number,
  "max_players": number,
  "playtime": number,
  "age_rating": number,
  "image_url": "string"
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* Ratings */}
        <section className="mb-8 border-b pb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4"> Ratings</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-green-500 text-white px-3 py-1 rounded text-sm font-semibold">POST</span>
                <code className="text-gray-700">/ratings</code>
              </div>
              <p className="text-sm text-gray-600 mb-2">Rate a game</p>
              <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`{
  "game_id": number,
  "rating": number // 1-5
}`}
              </pre>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-semibold">GET</span>
                <code className="text-gray-700">/ratings/game/:gameId</code>
              </div>
              <p className="text-sm text-gray-600">Get all ratings for a game</p>
            </div>
          </div>
        </section>

        {/* Comments */}
        <section className="mb-8 border-b pb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4"> Comments</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-green-500 text-white px-3 py-1 rounded text-sm font-semibold">POST</span>
                <code className="text-gray-700">/comments</code>
              </div>
              <p className="text-sm text-gray-600 mb-2">Add comment to game</p>
              <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`{
  "game_id": number,
  "content": "string"
}`}
              </pre>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-semibold">GET</span>
                <code className="text-gray-700">/comments/game/:gameId</code>
              </div>
              <p className="text-sm text-gray-600">Get all comments for a game</p>
            </div>
          </div>
        </section>

        {/* Friends */}
        <section className="mb-8 border-b pb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4"> Friends</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-semibold">GET</span>
                <code className="text-gray-700">/friends</code>
              </div>
              <p className="text-sm text-gray-600">Get user's friends list</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-green-500 text-white px-3 py-1 rounded text-sm font-semibold">POST</span>
                <code className="text-gray-700">/friends/request</code>
              </div>
              <p className="text-sm text-gray-600 mb-2">Send friend request</p>
              <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`{
  "friend_id": number
}`}
              </pre>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-yellow-500 text-white px-3 py-1 rounded text-sm font-semibold">PUT</span>
                <code className="text-gray-700">/friends/accept/:friendId</code>
              </div>
              <p className="text-sm text-gray-600">Accept friend request</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-red-500 text-white px-3 py-1 rounded text-sm font-semibold">DELETE</span>
                <code className="text-gray-700">/friends/:friendId</code>
              </div>
              <p className="text-sm text-gray-600">Remove friend</p>
            </div>
          </div>
        </section>

        {/* Messages */}
        <section className="mb-8 border-b pb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4"> Messages</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-semibold">GET</span>
                <code className="text-gray-700">/messages/conversations</code>
              </div>
              <p className="text-sm text-gray-600">Get all conversations</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-semibold">GET</span>
                <code className="text-gray-700">/messages/:friendId</code>
              </div>
              <p className="text-sm text-gray-600">Get messages with specific friend</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-green-500 text-white px-3 py-1 rounded text-sm font-semibold">POST</span>
                <code className="text-gray-700">/messages/send</code>
              </div>
              <p className="text-sm text-gray-600 mb-2">Send message to friend</p>
              <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`{
  "friend_id": number,
  "content": "string"
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* Users */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4"> Users</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-semibold">GET</span>
                <code className="text-gray-700">/users</code>
              </div>
              <p className="text-sm text-gray-600">Get all users</p>
              <p className="text-xs text-gray-500 mt-1">Query params: ?search=username&limit=10</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-semibold">GET</span>
                <code className="text-gray-700">/users/:id</code>
              </div>
              <p className="text-sm text-gray-600">Get user profile by ID</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-yellow-500 text-white px-3 py-1 rounded text-sm font-semibold">PUT</span>
                <code className="text-gray-700">/users/profile</code>
              </div>
              <p className="text-sm text-gray-600 mb-2">Update own profile</p>
              <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`{
  "username": "string",
  "email": "string",
  "bio": "string"
}`}
              </pre>
            </div>
          </div>
        </section>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-8">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This documentation is protected by API key authentication. Some endpoints require admin privileges.
          </p>
        </div>
      </div>
    </div>
  );
}
