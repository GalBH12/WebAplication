import { useState } from "react";
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
    const id = e.target.value;
    const found = places.find((p) => p.id === id);
    if (found) {
      onSelectLocation(found.latlng);
      setIsOpen(false);
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
          aria-label="Open menu"
          title="Open menu"
        >
          <span className="hamburger">
            <span className="hamburger__bar" />
            <span className="hamburger__bar" />
            <span className="hamburger__bar" />
          </span>
        </button>
      )}

      {/* Sidebar container; toggles .open class */}
      <aside className={`sidebar ${isOpen ? "open" : ""}`} aria-label="Main sidebar">
        {/* Top bar with brand and menu toggle */}
        <div className="top-bar">
          <button
            className={`menu-button ${isOpen ? "is-open" : ""}`}
            onClick={toggleSidebar}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            title={isOpen ? "Close menu" : "Open menu"}
          >
            <span className="hamburger">
              <span className="hamburger__bar" />
              <span className="hamburger__bar" />
              <span className="hamburger__bar" />
            </span>
          </button>

          <div className="brand">
            <span className="brand__dot" />
            <span className="brand__text">Explore</span>
          </div>
        </div>

        {/* Auth shortcuts / greeting + logout */}
        <div className="top-links">
          {!user ? (
            <>
              <Link className="top-link" to="/login" onClick={() => setIsOpen(false)}>
                login
              </Link>
              <span className="sep">·</span>
              <Link className="top-link" to="/register" onClick={() => setIsOpen(false)}>
                register
              </Link>
            </>
          ) : (
            <>
              <span className="welcome-message">hello, {displayName}</span>
              <span className="sep">·</span>
              <button className="top-link top-link--ghost" onClick={handleLogout}>
                logout
              </button>
            </>
          )}
        </div>

        {/* Quick jump to a saved place (select → centers the map) */}
        <section className="recent-places-section">
          <h4 className="section-title">Saved places</h4>
          <div className="field">
            <select
              className="places-select"
              defaultValue=""
              onChange={handleSelectChange}
              aria-label="Select saved place"
            >
              <option value="" disabled>
                Select a place…
              </option>
              {places.map((p) => (
                <option key={p.id} value={p.id}>
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
                Home
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
                Tracks
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
                    Profile
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
                    Chat
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
                    Change password
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
                      Admin panel
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
