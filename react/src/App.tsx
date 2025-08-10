import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Map from './components/Map';
import Register from './pages/register';
import Login from './pages/login';
import Profile from './pages/profile';
import ChangePassword from './pages/changepass';
import ForgotPasswordSender from './pages/forgotpasssender';
import ResetPassword from './pages/forgotpass';
import Tracks from './pages/tracks';
import Chat from './pages/chat';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Map />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/changepass" element={<ChangePassword />} />
        <Route path="/forgotpasssender" element={<ForgotPasswordSender />} />
        <Route path="/forgotpass/:id/:token" element={<ResetPassword />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/tracks" element={<Tracks />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;