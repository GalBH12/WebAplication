import { useState } from "react";
import { Link } from "react-router-dom";
import "../style/sidebar.css";
import { useAuth } from "../pages/AuthContext";
import type { LocationItem } from "./Map";

interface SidebarProps {
  places?: LocationItem[];
  onSelectLocation: (location: [number, number]) => void;
  onRemoveLocation: (id: string) => void;
  onAddCurrentLocation?: () => void;
}

const Sidebar = ({
  places = [],
  onSelectLocation,
}: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => setIsOpen((s) => !s);

  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setIsOpen(false); // close the menu after logout
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const found = places.find((p) => p.id === id);
    if (found) {
      onSelectLocation(found.latlng);
      setIsOpen(false);
    }
  };
  console.log(user);
  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="top-bar">
        <button className="menu-button" onClick={toggleSidebar} title="Open menu">
          <div className="button" />
          <div className="button" />
          <div className="button" />
        </button>
      </div>

      <div className="top-links">
        {!user ? (
          <>
            <Link to="/login" onClick={() => setIsOpen(false)}>login</Link>
            <p className="line"> | </p>
            <Link to="/register" onClick={() => setIsOpen(false)}>register</Link>
          </>
        ) : (
          <>
            {/* safe access to username */}
            <span className="welcome-message">hello, {user.username}</span>
            <p className="line"> | </p>
            <Link to="/" onClick={handleLogout}>logout</Link>
          </>
        )}
      </div>

      <div className="recent-places-section">
        <h4>Saved Places</h4>
        
        {/* Dropdown selector */}
        <select className="places-select" defaultValue="" onChange={handleSelectChange}>
          <option value="" disabled>Select a place…</option>
          {places.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <nav>
        <ul>
          <div className="main-links">
            <li><Link to="/" onClick={() => setIsOpen(false)}>Home</Link></li>
            <li><Link to="/tracks" onClick={() => setIsOpen(false)}>Tracks</Link></li>
            {user ? (
              <>
                <li><Link to="/profile" onClick={() => setIsOpen(false)}>Profile</Link></li>
                <li><Link to="/chat" onClick={() => setIsOpen(false)}>Chat</Link></li>
                <li><Link to="/changepass" onClick={() => setIsOpen(false)}>Change Password</Link></li>
              </>
            ) : null}
          </div>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;