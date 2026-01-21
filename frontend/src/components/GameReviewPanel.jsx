import React, { useState, useEffect, useContext } from "react";
import axiosClient from "../api/axiosClient";
import { AuthContext } from "../contexts/AuthContext";
import { Star, MessageCircle, Trash2 } from "lucide-react";

const GameReviewPanel = ({ gameId, gameName }) => {
  const { user } = useContext(AuthContext);
  const [ratings, setRatings] = useState([]);
  const [comments, setComments] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("ratings"); // "ratings" | "comments"

  // Lấy ratings
  const fetchRatings = async () => {
    try {
      const res = await axiosClient.get(`/ratings/${gameId}`);
      setRatings(res.data.ratings || []);
      setAvgRating(res.data.average || 0);
      setRatingCount(res.data.count || 0);
    } catch (err) {
      console.error("Lỗi lấy ratings:", err);
    }
  };

  // Lấy rating của user hiện tại
  const fetchUserRating = async () => {
    if (!user) return;
    try {
      const res = await axiosClient.get(`/ratings/${gameId}/user`);
      setUserRating(res.data.rating || 0);
    } catch (err) {
      console.error("Lỗi lấy user rating:", err);
    }
  };

  // Lấy comments
  const fetchComments = async () => {
    try {
      const res = await axiosClient.get(`/comments/${gameId}`);
      setComments(res.data || []);
    } catch (err) {
      console.error("Lỗi lấy comments:", err);
    }
  };

  useEffect(() => {
    fetchRatings();
    fetchUserRating();
    fetchComments();
  }, [gameId, user]);

  // Rate game
  const handleRate = async (rating) => {
    if (!user) {
      alert("Vui lòng đăng nhập để rate game");
      return;
    }
    try {
      setLoading(true);
      await axiosClient.post("/ratings", { game_id: gameId, rating });
      setUserRating(rating);
      fetchRatings();
    } catch (err) {
      console.error("Lỗi rate game:", err);
      alert("Lỗi lưu rating");
    } finally {
      setLoading(false);
    }
  };

  // Thêm comment
  const handleAddComment = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để comment");
      return;
    }
    if (!commentText.trim()) {
      alert("Vui lòng nhập nội dung comment");
      return;
    }
    try {
      setLoading(true);
      await axiosClient.post("/comments", {
        game_id: gameId,
        content: commentText,
      });
      setCommentText("");
      fetchComments();
    } catch (err) {
      console.error("Lỗi thêm comment:", err);
      alert("Lỗi lưu comment");
    } finally {
      setLoading(false);
    }
  };

  // Xóa comment
  const handleDeleteComment = async (commentId) => {
    if (!confirm("Bạn có chắc muốn xóa comment này?")) return;
    try {
      setLoading(true);
      await axiosClient.delete(`/comments/${commentId}`);
      fetchComments();
    } catch (err) {
      console.error("Lỗi xóa comment:", err);
      alert("Lỗi xóa comment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 p-4 bg-white rounded-lg shadow-md border border-gray-200">
      <h3 className="text-xl font-bold mb-4">Đánh giá & Bình luận - {gameName}</h3>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b">
        <button
          onClick={() => setTab("ratings")}
          className={`px-4 py-2 font-semibold ${
            tab === "ratings"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Star size={16} className="inline mr-2" />
          Đánh giá ({ratingCount})
        </button>
        <button
          onClick={() => setTab("comments")}
          className={`px-4 py-2 font-semibold ${
            tab === "comments"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <MessageCircle size={16} className="inline mr-2" />
          Bình luận ({comments.length})
        </button>
      </div>

      {/* RATINGS TAB */}
      {tab === "ratings" && (
        <div>
          {/* Rating input */}
          {user && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold mb-2">Đánh giá của bạn:</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRate(star)}
                    disabled={loading}
                    className={`text-2xl transition-all ${
                      star <= userRating ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              {userRating > 0 && <p className="text-xs text-green-600 mt-2"> Bạn đã đánh giá {userRating} sao</p>}
            </div>
          )}

          {/* Average rating */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-semibold">
              Đánh giá trung bình: <span className="text-yellow-500 text-lg">{avgRating}</span> / 5.0 ({ratingCount} đánh giá)
            </p>
          </div>

          {/* Ratings list */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {ratings.length > 0 ? (
              ratings.map((rating) => (
                <div key={rating.id} className="p-2 border rounded bg-gray-50 text-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{rating.username}</p>
                      <p className="text-yellow-500">{"★".repeat(rating.rating)}{"☆".repeat(5 - rating.rating)}</p>
                    </div>
                    <p className="text-xs text-gray-400">{new Date(rating.created_at).toLocaleDateString("vi-VN")}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm italic">Chưa có đánh giá nào</p>
            )}
          </div>
        </div>
      )}

      {/* COMMENTS TAB */}
      {tab === "comments" && (
        <div>
          {/* Comment input */}
          {user && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold mb-2">Thêm bình luận:</p>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={500}
                placeholder="Viết bình luận của bạn..."
                className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="3"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">{commentText.length}/500</p>
                <button
                  onClick={handleAddComment}
                  disabled={loading || !commentText.trim()}
                  className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  Gửi
                </button>
              </div>
            </div>
          )}

          {/* Comments list */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="p-3 border rounded bg-gray-50">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-sm">{comment.username}</p>
                    <div className="flex gap-2 items-center">
                      <p className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleDateString("vi-VN")}</p>
                      {user && (user.id === comment.user_id || user.role === "admin") && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={loading}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50"
                          title="Xóa comment"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm italic">Chưa có bình luận nào</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameReviewPanel;

