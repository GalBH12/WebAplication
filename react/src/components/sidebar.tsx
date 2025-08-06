import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../style/Sidebar.css';
import {useAuth} from '../pages/AuthContext';

interface SidebarProps {
  recentPlaces: { name: string; latlng: [number, number] }[];
  onSelectLocation: (location: [number, number]) => void;
    onRemoveLocation: (name: string) => void;
}

const Sidebar = ({ recentPlaces, onSelectLocation }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => setIsOpen(!isOpen);
  const { user, logout } = useAuth();

   const handleLogout = () => {
    logout();
    toggleSidebar();
  };

  return (
    <>

    

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="top-bar">
        <button className="menu-button" onClick={toggleSidebar}>
          <div className="button"></div>
          <div className="button"></div>
          <div className="button"></div>
        </button>
        </div>

          <div className="top-links">
          {!user ? (
            <>
              <Link to="/login" onClick={toggleSidebar}>התחברות</Link> <p className = "line"> | </p>
              <Link to="/register" onClick={toggleSidebar}>הרשמה</Link>
            </>
          ) : (
            <>
              <span className="welcome-message">שלום, {user.username}</span>
              <p className = "line"> | </p>
            <Link to="/" onClick={handleLogout}>התנתק</Link>
            </>
          )}
      </div>
          
<div className="recent-places-section">
  <h4>מקומות אחרונים</h4>
  {recentPlaces && recentPlaces.length > 0 ? (
    <ul className="recent-places-list">
      {recentPlaces.map((place, idx) => (
        <li key={idx}>
          <button onClick={() => {
            onSelectLocation(place.latlng);
            setIsOpen(false);
          }}>
            {place.name}
          </button>
        </li>
      ))}
    </ul>
  ) : (
    <p>אין מקומות אחרונים</p>
  )}
</div>

        <nav>
          <ul>
            <div className="main-links">
              <li><Link to="/" onClick={toggleSidebar}>דף הבית</Link></li>
              <li><Link to="/tracks" onClick={toggleSidebar}>מסלולים</Link></li>
              
            { user ? (
              <>
                <li><Link to="/profile" onClick={toggleSidebar}>פרופיל</Link></li>
                <li><Link to="/chat" onClick={toggleSidebar}>צ'אט</Link></li>
                <li><Link to="/changepass" onClick={toggleSidebar}>שנה סיסמה</Link></li>
              </>
            ) : null}
            </div>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;