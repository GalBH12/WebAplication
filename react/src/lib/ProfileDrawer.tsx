import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../pages/AuthContext";
import { api } from "./api";
import "../style/profile-drawer.css";

type Props = {
  open: boolean;
  onClose: () => void;
};

const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export default function ProfileDrawer({ open, onClose }: Props) {
  const { user, setUser, logout } = useAuth();

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await api.get("/api/me");
        const u = res?.data?.user;
        if (!u) return;
        const normalized = { ...u, _id: (u as any)?._id ?? (u as any)?.id ?? "" };
        setUser(normalized as any);
        localStorage.setItem("user", JSON.stringify(normalized));
      } catch {}
    })();
  }, [open, setUser]);

  if (!open) return null;

  const label = (v?: string | number | null) => (v ?? "—");
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    "—";

  const body = (
    <div className="profile-overlay" onClick={onClose}>
      <aside
        className="profile-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Profile"
      >
        <header className="profile-header">
          <div className="avatar">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="avatar" />
            ) : (
              <div className="avatar-fallback">
                {(user?.firstName?.[0] ||
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

  return createPortal(body, document.body);
}
