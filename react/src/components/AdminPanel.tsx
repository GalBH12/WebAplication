// react/src/components/AdminPanel.tsx

import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import type { User as AuthUser } from "../pages/AuthContext";

/**
 * Represents a single user row in the admin panel table.
 */
type AdminUserRow = {
  _id: string;       // MongoDB user ID
  username: string;  // Username of the user
  role: string;      // Role (e.g. "soldier", "commander", "admin")
  banned: boolean;   // Whether the user is banned
};

/**
 * Props for the AdminPanel component.
 */
type Props = {
  user: AuthUser | null; // Current authenticated user from context
};

/**
 * AdminPanel Component
 *
 * Provides an interface for admins to:
 * - View all users
 * - Promote users to admin
 * - Ban/unban users
 * - Delete users
 *
 * Only accessible to users with the "admin" role.
 */
export default function AdminPanel({ user }: Props) {
  // ===== State =====
  const [users, setUsers] = useState<AdminUserRow[]>([]); // All users loaded from backend
  const [loading, setLoading] = useState(true);           // Loading spinner control
  const [err, setErr] = useState<string | null>(null);    // Holds error messages

  // Check if the current user is admin
  const isAdmin = user?.role === "admin";

  /**
   * Fetch all users from backend.
   * Wrapped in useCallback to avoid unnecessary re-creations.
   */
  const reload = useCallback(async () => {
    try {
      setErr(null); // reset error
      const res = await api.get("/api/admin/users"); // API call to get all users
      setUsers(res.data as AdminUserRow[]);          // save users in state
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Failed to load users"); // error handling
    } finally {
      setLoading(false); // stop loading spinner
    }
  }, []);

  /**
   * Load users when:
   * - Component mounts
   * - User role changes to admin
   */
  useEffect(() => {
    if (!isAdmin) return;  // prevent non-admins from fetching
    setLoading(true);
    reload();
  }, [isAdmin, reload]);

  /**
   * Promote user to admin
   * @param id - user ID
   */
  const promote = async (id: string) => {
    try {
      await api.post(`/api/admin/users/${id}/promote`); // API call
      await reload(); // refresh list
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Promote failed");
    }
  };

  /**
   * Ban user
   * @param id - user ID
   */
  const ban = async (id: string) => {
    try {
      await api.post(`/api/admin/users/${id}/ban`);
      await reload();
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Ban failed");
    }
  };

  /**
   * Unban user
   * @param id - user ID
   */
  const unban = async (id: string) => {
    try {
      await api.post(`/api/admin/users/${id}/unban`);
      await reload();
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Unban failed");
    }
  };

  /**
   * Delete user
   * @param id - user ID
   */
  const remove = async (id: string) => {
    try {
      await api.delete(`/api/admin/users/${id}`);
      await reload();
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Delete failed");
    }
  };

  // ===== Conditional rendering =====

  // If current user is not admin, deny access
  if (!isAdmin) return <div>Access denied</div>;

  // Show loading state
  if (loading) return <div>Loading...</div>;

  // ===== Render UI =====
  return (
    <div style={{ padding: 16 }}>
      <h2>Admin Control Panel</h2>

      {/* Show error messages in red */}
      {err && (
        <div style={{ color: "crimson", marginBottom: 12 }}>
          {err}
        </div>
      )}

      {/* Users table */}
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
          {/* Render all non-admin users */}
          {users
            .filter((u) => u.role !== "admin")
            .map((u) => (
              <tr key={u._id}>
                <td style={td}>{u.username}</td>
                <td style={td}>{u.role}</td>
                <td style={td}>{u.banned ? "Yes" : "No"}</td>
                <td>
                  {/* Promote option (only if not admin & not banned) */}
                  {u.role !== "admin" && !u.banned && (
                    <button onClick={() => promote(u._id)}>Promote to Admin</button>
                  )}
                  {/* Ban option */}
                  {!u.banned && (
                    <button onClick={() => ban(u._id)}>Ban</button>
                  )}
                  {/* Unban option */}
                  {u.banned && (
                    <button onClick={() => unban(u._id)}>Unban</button>
                  )}
                  {/* Delete option */}
                  <button onClick={() => remove(u._id)}>Delete</button>
                </td>
              </tr>
            ))}
          {/* Case: no users found */}
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

/**
 * Inline CSS for table headers
 */
const th: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
  padding: "8px 6px",
  fontWeight: 700,
  color: "#ffffffff",
};

/**
 * Inline CSS for table cells
 */
const td: React.CSSProperties = {
  borderBottom: "1px solid #f3f4f6",
  padding: "8px 6px",
  color: "#ffffffff",
};
