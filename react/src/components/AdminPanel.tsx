import { useEffect, useState } from "react";
import { api } from "../lib/api"; // your axios instance

type User = {
  _id: string;
  username: string;
  role: string;
  banned: boolean;
};

export default function AdminPanel({ user }: { user: { role: string } }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === "admin") {
      api.get("/api/admin/users").then(res => {
        setUsers(res.data);
        setLoading(false);
      });
    }
  }, [user]);

  const promote = (id: string) =>
    api.post(`/api/admin/users/${id}/promote`).then(() => reload());
  const ban = (id: string) =>
    api.post(`/api/admin/users/${id}/ban`).then(() => reload());
    const unban = (id: string) =>
    api.post(`/api/admin/users/${id}/unban`).then(() => reload());
  const remove = (id: string) =>
    api.delete(`/api/admin/users/${id}`).then(() => reload());

  const reload = () =>
    api.get("/api/admin/users").then(res => setUsers(res.data));

  if (user?.role !== "admin") return <div>Access denied</div>;
  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Admin Control Panel</h2>
      <table>
        <thead>
          <tr>
            <th>Username</th><th>Role</th><th>Banned</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users
            .filter(u => u.role !== "admin")
            .map(u => (
              <tr key={u._id}>
                <td>{u.username}</td>
                <td>{u.role}</td>
                <td>{u.banned ? "Yes" : "No"}</td>
                <td>
                  {u.role !== "admin" && !u.banned && (
                    <button onClick={() => promote(u._id)}>Promote to Admin</button>
                  )}
                  {!u.banned && (
                    <button onClick={() => ban(u._id)}>Ban</button>
                  )}
                  {u.banned && (
                    <button onClick={() => unban(u._id)}>Unban</button>
                  )}
                  <button onClick={() => remove(u._id)}>Delete</button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}