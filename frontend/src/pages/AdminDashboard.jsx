import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sResp, uResp, gResp] = await Promise.all([
        axiosClient.get('/admin/stats'),
        axiosClient.get('/admin/users'),
        axiosClient.get('/admin/games'),
      ]);
      setStats(sResp.data);
      setUsers(uResp.data);
      setGames(gResp.data);
    } catch (err) {
      console.error('Admin fetchAll error:', err);
      setError('Không thể tải dữ liệu admin. Kiểm tra token và quyền admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const updateRole = async (userId, newRole) => {
    try {
      await axiosClient.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((u) => u.map(x => x.id === userId ? { ...x, role: newRole } : x));
    } catch (err) {
      alert('Cập nhật role thất bại');
      console.error(err);
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Xóa người dùng? Hành động không thể hoàn tác.')) return;
    try {
      await axiosClient.delete(`/admin/users/${userId}`);
      setUsers((u) => u.filter(x => x.id !== userId));
    } catch (err) {
      alert('Xóa user thất bại');
      console.error(err);
    }
  };

  const toggleGame = async (gameId, isActive) => {
    try {
      await axiosClient.put(`/admin/games/${gameId}`, { is_active: !isActive });
      setGames((g) => g.map(x => x.id === gameId ? { ...x, is_active: !isActive } : x));
    } catch (err) {
      alert('Cập nhật game thất bại');
      console.error(err);
    }
  };

  if (loading) return <div className="p-6">Loading admin...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>

      <section className="mb-6">
        <h3 className="font-semibold">Thống kê nhanh</h3>
        <div className="flex gap-4 mt-2">
          <div className="p-3 bg-white rounded shadow">Người dùng: {stats?.users ?? '-'}</div>
          <div className="p-3 bg-white rounded shadow">Games: {stats?.games ?? '-'}</div>
          <div className="p-3 bg-white rounded shadow">Rankings: {stats?.rankings ?? '-'}</div>
          <div className="p-3 bg-white rounded shadow">Messages: {stats?.messages ?? '-'}</div>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="font-semibold mb-2">Users</h3>
        <div className="bg-white rounded shadow overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">Username</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Role</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t">
                  <td className="p-2">{u.id}</td>
                  <td className="p-2">{u.username}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">
                    <select value={u.role} onChange={(e) => updateRole(u.id, e.target.value)} className="border rounded px-2 py-1">
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <button onClick={() => deleteUser(u.id)} className="px-2 py-1 bg-red-500 text-white rounded">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Games</h3>
        <div className="bg-white rounded shadow overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">Code</th>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Active</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {games.map(g => (
                <tr key={g.id} className="border-t">
                  <td className="p-2">{g.id}</td>
                  <td className="p-2">{g.code}</td>
                  <td className="p-2">{g.name}</td>
                  <td className="p-2">{g.is_active ? 'Yes' : 'No'}</td>
                  <td className="p-2">
                    <button onClick={() => toggleGame(g.id, g.is_active)} className="px-2 py-1 bg-indigo-600 text-white rounded">
                      {g.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}