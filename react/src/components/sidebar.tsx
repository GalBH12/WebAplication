import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import "../style/sidebar.css";
import { useAuth } from "../pages/AuthContext";
import type { LocationItem } from "../types/location";
import ProfileDrawer from "../lib/ProfileDrawer";
import ChatDrawer from "./ChatDrawer";
import BackButton from "./BackButton";

interface SidebarProps {
  places?: LocationItem[];
  onSelectLocation: (location: [number, number]) => void;
}

const Sidebar = ({ places = [], onSelectLocation }: SidebarProps) => {
  const [isChatOpen, setChatOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const { user, logout } = useAuth();

  const toggleSidebar = () => setIsOpen((s) => !s);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const found = places.find((p) => p.id === id);
    if (found) {
      onSelectLocation(found.latlng);
      setIsOpen(false);
    }
  };

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    "user";

  return (
    <>
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

      <aside className={`sidebar ${isOpen ? "open" : ""}`} aria-label="Main sidebar">
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

        <BackButton />
        <ProfileDrawer open={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      </aside>

      <ChatDrawer open={isChatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
};

export default Sidebar;
