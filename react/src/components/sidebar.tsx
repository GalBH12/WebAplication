import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../style/Sidebar.css';
import {useAuth} from '../pages/AuthContext';

const Sidebar = () => {
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
            <Link to="/" onClick={handleLogout}>התנתק</Link>
          )}
      </div>

        <nav>
          <ul>
            <div className="main-links">
              <li><Link to="/" onClick={toggleSidebar}>דף הבית</Link></li>
              <li><Link to="/profile" onClick={toggleSidebar}>פרופיל</Link></li>
              <li><Link to="/chat" onClick={toggleSidebar}>צ'אט</Link></li>
              <li><Link to="/tracks" onClick={toggleSidebar}>מסלולים</Link></li>
            </div>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;