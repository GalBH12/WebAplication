// react/src/components/AdminPanel.tsx
import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import type { User as AuthUser } from "../pages/AuthContext";

type AdminUserRow = {
  _id: string;
  username: string;
  role: string;
  banned: boolean;
};

type Props = {
  user: AuthUser | null; // מקבל את המשתמש מהקונטקסט
};

export default function AdminPanel({ user }: Props) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";

  const reload = useCallback(async () => {
    try {
      setErr(null);
      const res = await api.get("/api/admin/users");
      setUsers(res.data as AdminUserRow[]);
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    reload();
  }, [isAdmin, reload]);

  const promote = async (id: string) => {
    try {
      await api.post(`/api/admin/users/${id}/promote`);
      await reload();
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Promote failed");
    }
  };

  const demote = async (id: string) => {
    try {
      await api.post(`/api/admin/users/${id}/demote`);
      await reload();
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Demote failed"); // ✅ השתנה ל-||
    }
  };

  const ban = async (id: string) => {
    try {
      await api.post(`/api/admin/users/${id}/ban`);
      await reload();
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Ban failed");
    }
  };

  const unban = async (id: string) => {
    try {
      await api.post(`/api/admin/users/${id}/unban`);
      await reload();
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Unban failed");
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/api/admin/users/${id}`);
      await reload();
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Delete failed");
    }
  };

  if (!isAdmin) return <div>Access denied</div>;
  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2>Admin Control Panel</h2>

      {err && (
        <div style={{ color: "crimson", marginBottom: 12 }}>
          {err}
        </div>
      )}

      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={th}>Username</th>
            <th style={th}>Role</th>
            <th style={th}>Banned</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td style={td}>{u.username}</td>
              <td style={td}>{u.role}</td>
              <td style={td}>{u.banned ? "Yes" : "No"}</td>
              <td style={td}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {u.role !== "admin" && (
                    <button onClick={() => promote(u._id)}>Promote</button>
                  )}
                  {u.role !== "member" && (
                    <button onClick={() => demote(u._id)}>Demote</button>
                  )}
                  {!u.banned && (
                    <button onClick={() => ban(u._id)}>Ban</button>
                  )}
                  {u.banned && (
                    <button onClick={() => unban(u._id)}>Unban</button>
                  )}
                  <button onClick={() => remove(u._id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td style={td} colSpan={4}>
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* inline styles קטנים לטבלה */
const th: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
  padding: "8px 6px",
  fontWeight: 700,
  color: "#111827",
};

const td: React.CSSProperties = {
  borderBottom: "1px solid #f3f4f6",
  padding: "8px 6px",
  color: "#374151",
};
