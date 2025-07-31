import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../style/Sidebar.css';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      <button className="menu-button" onClick={toggleSidebar}>
        <div className="button"></div>
        <div className="button"></div>
        <div className="button"></div>
      </button>

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <button className="close-button" onClick={toggleSidebar}>✕</button>
        <nav>
          <ul>
            <li><Link to="/" onClick={toggleSidebar}>דף הבית</Link></li>
            <li><Link to="/profile" onClick={toggleSidebar}>פרופיל</Link></li>
            <li><Link to="/chat" onClick={toggleSidebar}>צ'אט</Link></li>
            <li><Link to="/tracks" onClick={toggleSidebar}>מסלולים</Link></li>
            <li><Link to="/login" onClick={() => {
              localStorage.clear();
              toggleSidebar();
            }}>התנתק</Link></li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;