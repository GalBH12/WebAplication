import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import "../style/sidebar.css";
import { useAuth } from "../pages/AuthContext";
import type { LocationItem } from "../types/location";
import ProfileDrawer from "../lib/ProfileDrawer";
import ChatDrawer from "./ChatDrawer";
import BackButton from "./BackButton";

interface SidebarProps {
  places?: LocationItem[];                         // saved places to choose from
  onSelectLocation: (location: [number, number]) => void; // callback to center map
}

/**
 * Sidebar
 *
 * - Collapsible app sidebar with:
 *   • Auth shortcuts (login/register or hello/logout)
 *   • Quick-jump to saved places (select → centers map)
 *   • Navigation links (Home, Tracks, Change password, Admin)
 *   • Profile drawer & Chat drawer launchers (for logged-in users)
 *   • BackButton component for easy back navigation
 */
const Sidebar = ({ places = [], onSelectLocation }: SidebarProps) => {
  // UI toggles for drawers and sidebar
  const [isChatOpen, setChatOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // keep page content shifted while sidebar is open
  useEffect(() => {
    document.body.classList.toggle("sidebar-open", isOpen);
    return () => document.body.classList.remove("sidebar-open");
  }, [isOpen]);

  // Auth context (user + logout)
  const { user, logout } = useAuth();

  // Toggle the sidebar open/closed
  const toggleSidebar = () => setIsOpen((s) => !s);

  // Logout and close sidebar
  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  // When selecting a saved place, center the map and close sidebar
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const select = e.currentTarget;
    const val = select.value;
    if (!val) return;
    console.debug("places select raw value:", val);

    // value format: "lat,lng"
    const parts = val.split(",").map((s) => s.trim());
    if (parts.length === 2) {
      const lat = Number(parts[0]);
      const lng = Number(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        onSelectLocation([lat, lng]);
        setIsOpen(false);
        // reset select to placeholder
        setTimeout(() => (select.selectedIndex = 0), 0);
        return;
      }
    }

    // fallback: treat value as id
    const found = places.find((p) => p.id === val || (p as any)._id === val);
    if (found) {
      onSelectLocation(found.latlng);
      setIsOpen(false);
      setTimeout(() => (select.selectedIndex = 0), 0);
    }
  };

  // Prefer full name → username → fallback "user"
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    "user";

  return (
    <>
      {/* Floating launcher button (shown when sidebar is closed) */}
      {!isOpen && (
        <button
          className="sidebar-launcher"
          onClick={toggleSidebar}
          aria-label="פתח תפריט"
          title="פתח תפריט"
          style={{ right: 16, left: "auto" }}
        >
          <span className="hamburger">
            <span className="hamburger__bar" />
            <span className="hamburger__bar" />
            <span className="hamburger__bar" />
          </span>
        </button>
      )}

      {/* Sidebar container; toggles .open class */}
      <aside
        className={`sidebar ${isOpen ? "open" : ""}`}
        aria-label="סרגל צד ראשי"
        dir="rtl"
        style={{ textAlign: "right" }}
      >
        {/* Top bar with brand and menu toggle */}
        <div className="top-bar">
          <button
            className={`menu-button ${isOpen ? "is-open" : ""}`}
            onClick={toggleSidebar}
            aria-label={isOpen ? "סגור תפריט" : "פתח תפריט"}
            title={isOpen ? "סגור תפריט" : "פתח תפריט"}
          >
            <span className="hamburger">
              <span className="hamburger__bar" />
              <span className="hamburger__bar" />
              <span className="hamburger__bar" />
            </span>
          </button>
        </div>

        {/* Auth shortcuts / greeting + logout */}
        <div className="top-links">
          {!user ? (
            <>
              <Link className="top-link" to="/login" onClick={() => setIsOpen(false)}>
                התחברות
              </Link>
              <span className="sep">·</span>
              <Link className="top-link" to="/register" onClick={() => setIsOpen(false)}>
                הרשמה
              </Link>
            </>
          ) : (
            <>
              <span className="welcome-message">שלום, {displayName}</span>
              <span className="sep">·</span>
              <button className="top-link top-link--ghost" onClick={handleLogout}>
                התנתק
              </button>
            </>
          )}
        </div>

        {/* Quick jump to a saved place (select → centers the map) */}
        <section className="recent-places-section">
          <h4 className="section-title">מקומות שמורים</h4>
          <div className="field">
            <select
              className="places-select"
              defaultValue=""
              onChange={handleSelectChange}
              aria-label="בחר מקום שמור"
            >
              <option value="" disabled>
                בחר מקום…
              </option>
              {places.map((p) => (
                // store lat,lng as plain comma separated value for robust parsing
                <option key={p.id ?? (p as any)._id} value={`${p.latlng[0]},${p.latlng[1]}`}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Main navigation */}
        <nav className="nav">
          <ul className="nav-list">
            <li>
              <NavLink
                to="/"
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `nav-btn ${isActive ? "nav-btn--active" : ""}`
                }
                end
              >
                בית
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/tracks"
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `nav-btn nav-btn--primary ${isActive ? "nav-btn--active" : ""}`
                }
              >
                מסלולים
              </NavLink>
            </li>

            {/* Additional items for authenticated users */}
            {user ? (
              <>
                <li>
                  <button
                    className="nav-btn"
                    onClick={() => {
                      setIsProfileOpen(true);
                      setIsOpen(false);
                    }}
                  >
                    פרופיל
                  </button>
                </li>

                <li>
                  <button
                    className="nav-btn nav-btn--accent"
                    onClick={() => {
                      setChatOpen(true);
                      setIsOpen(false);
                    }}
                  >
                    צ'אט
                  </button>
                </li>

                <li>
                  <NavLink
                    to="/changepass"
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `nav-btn nav-btn--ghost ${isActive ? "nav-btn--active" : ""}`
                    }
                  >
                    שנה סיסמה
                  </NavLink>
                </li>

                {/* Admin-only link */}
                {user?.role === "admin" && (
                  <li>
                    <NavLink
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) =>
                        `nav-btn nav-btn--ghost ${isActive ? "nav-btn--active" : ""}`
                      }
                    >
                      לוח מנהל
                    </NavLink>
                  </li>
                )}
              </>
            ) : null}
          </ul>
        </nav>

        {/* Back nav shortcut */}
        <BackButton />
        {/* Profile drawer (modal-like) */}
        <ProfileDrawer open={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      </aside>

      {/* Chat drawer is outside the sidebar so it can overlay the page */}
      <ChatDrawer open={isChatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
};

export default Sidebar;
