import { useState, useEffect, useRef, useContext } from "react";
import axiosClient from "../api/axiosClient";
import { AuthContext } from "../contexts/AuthContext";

const POLL_INTERVAL = 500000; // ms

function timeAgo(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleString();
}

export default function MessagesPage() {
  const { user } = useContext(AuthContext);
  const meId = user?.id;
  const [friends, setFriends] = useState([]);
  const [activePeer, setActivePeer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [friendsError, setFriendsError] = useState(null);
  const [messagesError, setMessagesError] = useState(null);
  const messagesRef = useRef(null);
  const pollRef = useRef(null);

  // Làm mịn dữ liệu trả về từ API
  const normalizeArray = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (payload.data && Array.isArray(payload.data)) return payload.data;
    // Nếu không phải mảng, trả về mảng rỗng
    return [];
  };

  // Danh sách bạn bè
  const loadFriends = async () => {
    setLoadingFriends(true);
    setFriendsError(null);
    try {
      const res = await axiosClient.get("/friends");
      const payload = res?.data ?? null;
      const normalized = normalizeArray(payload);
      setFriends(normalized);
      setLoadingFriends(false);
      return;
    } catch (err) {
      if (err?.response?.status === 404) {
        try {
          const resUsers = await axiosClient.get("/users?limit=50"); // Thử lấy từ /users
          const usersPayload = resUsers?.data ?? null;
          const normalizedUsers = normalizeArray(usersPayload).map((u) => ({
            id: u.id,
            username: u.username ?? u.name,
          }));
          if (normalizedUsers.length > 0) {
            setFriends(normalizedUsers);
            setLoadingFriends(false);
            return;
          }
        } catch (err2) {}

        try {
          const resConv = await axiosClient.get("/messages/conversations");
          const convPayload = resConv?.data ?? null;
          const convs = normalizeArray(convPayload).map((c) => ({
            id: c.peerId,
            username: c.peerName,
            lastMessage: c.lastMessage,
            unread: c.unreadCount ?? 0,
          }));
          setFriends(convs);
          setLoadingFriends(false);
          return;
        } catch (err3) {
          // Không có endpoint /users hoặc /messages/conversations
          setFriends([]);
          setFriendsError(
            "No friends endpoint and no conversations available on server.",
          );
          setLoadingFriends(false);
          return;
        }
      }

      console.error("Failed to load friends", err);
      setFriends([]);
      setFriendsError("Failed to load friends.");
    } finally {
      setLoadingFriends(false);
    }
  };

  // Tải tin nhắn cho bạn chat đang hoạt động
  const loadMessages = async (peerId) => {
    if (!peerId) return;
    setLoadingMsgs(true);
    setMessagesError(null);
    try {
      const res = await axiosClient.get(`/messages/${peerId}`);
      const msgsPayload = res?.data ?? [];
      const normalized = Array.isArray(msgsPayload)
        ? msgsPayload
        : normalizeArray(msgsPayload);
      setMessages(normalized);
      try {
        await axiosClient.put(`/messages/mark-read/${peerId}`);
      } catch (_) {
        try {
          await axiosClient.put(`/messages/read/${peerId}`);
        } catch (_) {}
      }
      scrollToBottom();
    } catch (err) {
      console.error("Failed to load messages", err);
      setMessages([]);
      setMessagesError(
        err?.response?.status === 404
          ? "Conversation not found on server."
          : "Failed to load messages (server error). You can still send a message.",
      );
    } finally {
      setLoadingMsgs(false);
    }
  };

  useEffect(() => {
    loadFriends();
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When activePeer changes, load messages and start polling
  useEffect(() => {
    if (!activePeer) {
      setMessages([]);
      clearInterval(pollRef.current);
      return;
    }
    loadMessages(activePeer.id);
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      loadMessages(activePeer.id);
      loadFriends();
    }, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePeer]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    });
  };

  const handleSend = async () => {
    const text = input?.trim();
    if (!text || !activePeer) return;

    const temp = {
      id: `temp-${Date.now()}`,
      sender_id: meId,
      receiver_id: activePeer.id,
      content: text,
      is_read: false,
      created_at: new Date().toISOString(),
      sending: true,
    };
    setMessages((m) => [...m, temp]);
    setInput("");
    scrollToBottom();

    try {
      const res = await axiosClient.post("/messages/send", {
        receiver_id: activePeer.id,
        content: text,
      });
      const saved = res?.data?.data ?? res?.data ?? null;
      if (saved && saved.id) {
        setMessages((m) => m.map((it) => (it.id === temp.id ? saved : it)));
      } else {
        setMessages((m) =>
          m.map((it) => (it.id === temp.id ? { ...it, sending: false } : it)),
        );
      }
      loadFriends();
      scrollToBottom();
    } catch (err) {
      console.error("Send failed", err);
      setMessages((m) =>
        m.map((it) =>
          it.id === temp.id ? { ...it, sending: false, failed: true } : it,
        ),
      );
    }
  };

  // Cho phép người dùng bắt đầu cuộc trò chuyện mới bằng cách nhập tên người dùng hoặc ID
  const handleStartConversation = async () => {
    const q = window.prompt("Start conversation — enter username or user id:");
    if (!q) return;
    try {
      const res = await axiosClient.get(
        `/users?search=${encodeURIComponent(q)}&limit=10`,
      );
      const users = normalizeArray(res?.data ?? null);
      if (users.length > 0) {
        const u = users[0];
        setActivePeer({ id: u.id, name: u.username ?? u.name });
        return;
      }
    } catch (err) {
      console.warn("User search failed", err);
    }

    if (!isNaN(Number(q))) {
      setActivePeer({ id: Number(q), name: `User ${q}` });
      return;
    }

    alert(
      "Could not find user. If your backend does not provide /users search, please implement an endpoint or use friends API.",
    );
  };

  const handleSelectFriend = (friend) => {
    setActivePeer({
      id: friend.id,
      name: friend.username || friend.name || friend.peerName,
    });
  };

  // Đảm bảo friends luôn là mảng để render
  const friendsForRender = Array.isArray(friends) ? friends : [];

  return (
    <div className="flex h-full min-h-[60vh] gap-6 p-6">
      {/* Friends list */}
      <aside className="w-72 bg-white rounded-xl p-3 shadow-md flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-sm uppercase">Friends</h3>
          <div className="flex items-center gap-2">
            <button onClick={loadFriends} className="text-xs text-indigo-500">
              Refresh
            </button>
            <button
              onClick={handleStartConversation}
              className="text-xs text-gray-500"
            >
              Start
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loadingFriends && (
            <div className="text-xs text-gray-400 mb-2">Loading...</div>
          )}
          {friendsError && (
            <div className="text-xs text-red-500 mb-2">{friendsError}</div>
          )}
          {!loadingFriends &&
            friendsForRender.length === 0 &&
            !friendsError && (
              <div className="text-xs text-gray-500">
                No friends found. Use "Start" to search users.
              </div>
            )}
          <ul>
            {friendsForRender.map((f) => (
              <li
                key={f.id}
                onClick={() => handleSelectFriend(f)}
                className={`cursor-pointer p-2 rounded-md mb-1 hover:bg-gray-100 transition-all ${activePeer?.id === f.id ? "bg-gray-100" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">
                      {f.username ? f.username.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">
                        {f.username || f.name || `User ${f.id}`}
                      </div>
                      <div className="text-xs text-gray-400 truncate max-w-44">
                        {f.lastMessage?.content ?? ""}
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    {f.unread > 0 && (
                      <div className="mt-1 bg-red-500 text-white rounded-full px-2 text-[11px]">
                        {f.unread}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Chat area */}
      <main className="flex-1 bg-gray-50 rounded-xl shadow-md overflow-hidden flex flex-col">
        <header className="bg-white p-4 border-b flex items-center justify-between">
          <div>
            <div className="text-sm font-black">
              {activePeer ? activePeer.name : "Select a friend"}
            </div>
            <div className="text-xs text-gray-500">
              {activePeer
                ? `Chat with ${activePeer.name}`
                : ""}
            </div>
          </div>
          <div>
            {activePeer && (
              <button
                onClick={() => {
                  setMessages([]);
                }}
                className="text-xs text-red-500"
              >
                Clear view
              </button>
            )}
          </div>
        </header>

        <section
          ref={messagesRef}
          className="flex-1 p-4 overflow-auto space-y-3 bg-linear-to-b from-white to-gray-100"
        >
          {activePeer ? (
            <>
              {messagesError && (
                <div className="text-sm text-red-500 mb-2">{messagesError}</div>
              )}
              {loadingMsgs ? (
                <div className="text-sm text-gray-500">Loading messages...</div>
              ) : (
                messages.map((m) => {
                  const mine = m.sender_id === meId;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${mine ? "bg-indigo-600 text-white" : "bg-white text-gray-900 shadow"}`}
                      >
                        <div className="text-sm whitespace-pre-wrap">
                          {m.content}
                        </div>
                        <div className="text-[10px] mt-1 text-gray-200">
                          {timeAgo(m.created_at)}
                        </div>
                        {m.sending && (
                          <div className="text-[10px] mt-1 text-yellow-200">
                            Sending…
                          </div>
                        )}
                        {m.failed && (
                          <div className="text-[10px] mt-1 text-red-200">
                            Failed
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          ) : (
            <div className="p-6 text-gray-500">
              Chọn bạn để bắt đầu trò chuyện
            </div>
          )}
        </section>

        <footer className="p-4 bg-white border-t">
          {activePeer ? (
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={`Message ${activePeer.name}...`}
                className="flex-1 border rounded-md px-3 py-2"
              />
              <button
                onClick={handleSend}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md"
              >
                Send
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              Chọn bạn để gửi tin nhắn
            </div>
          )}
        </footer>
      </main>
    </div>
  );
}
