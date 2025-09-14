import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../pages/AuthContext";
import { api } from "./api";
import "../style/profile-drawer.css";

type Props = {
  open: boolean;   // whether the drawer is visible
  onClose: () => void; // callback to close the drawer
};

/**
 * Format ISO date string → dd/mm/yyyy.
 * If invalid/missing, returns "—".
 */
const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

/**
 * ProfileDrawer
 *
 * - Slide-in drawer showing the logged-in user's profile info.
 * - Fetches `/api/me` on open to refresh user data.
 * - Displays avatar, personal info, and a logout button.
 * - Closes when clicking outside the drawer or pressing the logout button.
 */
export default function ProfileDrawer({ open, onClose }: Props) {
  const { user, setUser, logout } = useAuth();

  // On open, fetch latest user info from the server
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await api.get("/api/me");
        const u = res?.data?.user;
        if (!u) return;
        // Normalize _id (sometimes "id", sometimes "_id")
        const normalized = { ...u, _id: (u as any)?._id ?? (u as any)?.id ?? "" };
        setUser(normalized as any);
        localStorage.setItem("user", JSON.stringify(normalized));
      } catch {
        // fail silently (drawer still shows cached user)
      }
    })();
  }, [open, setUser]);

  // If drawer is closed, render nothing
  if (!open) return null;

  // Helper to display fallback for missing values
  const label = (v?: string | number | null) => v ?? "—";

  // Prefer full name → username → fallback
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    "—";

  // Drawer markup
  const body = (
    <div className="profile-overlay" onClick={onClose}>
      <aside
        className="profile-drawer"
        onClick={(e) => e.stopPropagation()} // prevent overlay close
        role="dialog"
        aria-modal="true"
        aria-label="Profile"
      >
        {/* Header with avatar + identity */}
        <header className="profile-header">
          <div className="avatar">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="avatar" />
            ) : (
              <div className="avatar-fallback">
                {(
                  user?.firstName?.[0] ||
                  user?.lastName?.[0] ||
                  user?.username?.[0] ||
                  "U"
                ).toUpperCase()}
              </div>
            )}
          </div>
          <div className="identity">
            <div className="name">{fullName}</div>
            <div className="email">{label(user?.email)}</div>
          </div>
        </header>

        {/* User details */}
        <section className="profile-section">
          <div className="row">
            <span>שם פרטי:</span>
            <b>{label(user?.firstName)}</b>
          </div>
          <div className="row">
            <span>שם משפחה:</span>
            <b>{label(user?.lastName)}</b>
          </div>
          <div className="row">
            <span>מייל:</span>
            <b>{label(user?.email)}</b>
          </div>
          <div className="row">
            <span>טלפון:</span>
            <b>{label(user?.phone)}</b>
          </div>
          <div className="row">
            <span>תאריך לידה:</span>
            <b>{formatDate(user?.birthDate ?? null)}</b>
          </div>
        </section>

        {/* Footer with logout */}
        <footer className="profile-footer">
          <button
            className="logout-btn"
            onClick={() => {
              logout();
              onClose();
            }}
          >
            התנתקות
          </button>
        </footer>
      </aside>
    </div>
  );

  // Render into document.body via React portal
  return createPortal(body, document.body);
}
