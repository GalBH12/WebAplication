import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Map from './components/Map';
import Register from './pages/register';
import Login from './pages/login';
import Profile from './pages/profile';
import Sidebar from './components/sidebar';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Sidebar />
      <Routes>
        {/* עמוד הבית יציג את המפה */}
        <Route path="/" element={<Map />} />
        
        {/* עמוד ההרשמה */}
        <Route path="/register" element={<Register />} />
        {/* עמוד ההתחברות */}
        <Route path="/login" element={<Login />} />
        {/* עמוד הפרופיל */}
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;