import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Map from './components/Map';
import Register from './pages/register';
import Login from './pages/login';
import Profile from './pages/profile';
import Sidebar from './components/sidebar';
import ChangePassword from './pages/changepass';
import ForgotPasswordSender from './pages/forgotpasssender';
import ResetPassword from './pages/forgotpass';

function App() {
  return (
    <BrowserRouter>
      <Sidebar recentPlaces={[]} onSelectLocation={() => {}} onRemoveLocation={() => {}} />
      <Routes>
        <Route path="/" element={<Map />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/changepass" element={<ChangePassword />} />
        <Route path="/forgotpasssender" element={<ForgotPasswordSender />} />
        <Route path="/forgotpass/:id/:token" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;