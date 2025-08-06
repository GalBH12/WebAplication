import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Map from './components/Map';
import Register from './pages/register';
import Login from './pages/login';
import Profile from './pages/profile';
import Sidebar from './components/sidebar';
import ChangePassword from './pages/changepass';
import ForgotPassword from './pages/forgotpass';

function App() {
  return (
    <BrowserRouter>
      <Sidebar recentPlaces={[]} onSelectLocation={function (_location: [number, number]): void {
        throw new Error('Function not implemented.');
      } } onRemoveLocation={function (_name: string): void {
        throw new Error('Function not implemented.');
      } } />
      <Routes>
        {/* עמוד הבית יציג את המפה */}
        <Route path="/" element={<Map />} />
        {/* עמוד ההרשמה */}
        <Route path="/register" element={<Register />} />
        {/* עמוד ההתחברות */}
        <Route path="/login" element={<Login />} />
        {/* עמוד הפרופיל */}
        <Route path="/profile" element={<Profile />} />
        {/* עמוד שינוי סיסמה */}
        <Route path="/changepass" element={<ChangePassword />} />
        {/* עמוד איפוס סיסמה */}
        <Route path="/forgotpass" element={<ForgotPassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;