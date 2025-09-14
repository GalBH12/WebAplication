import { BrowserRouter, Routes, Route } from "react-router-dom";
import Map from "./pages/Map";
import Register from "./pages/register";
import Login from "./pages/login";
import ChangePassword from "./pages/changepass";
import ForgotPasswordSender from "./pages/forgotpasssender";
import ResetPassword from "./pages/forgotpass";
import Tracks from "./pages/tracks";
import Chat from "./pages/chat";
import AdminPanel from "./components/AdminPanel";
import { AuthProvider, useAuth } from "./pages/AuthContext";
import BackButton from "./components/BackButton";

// קומפוננטה פנימית שנטענת אחרי שה־AuthProvider עוטף


function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Map />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/changepass" element={<ChangePassword />} />
      <Route path="/forgotpasssender" element={<ForgotPasswordSender />} />
      <Route path="/forgotpass/:id/:token" element={<ResetPassword />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/tracks" element={<Tracks />} />
      {/* אם תרצה מסך Profile אמיתי בעתיד, תוכל להחזיר כאן קומפוננטה אחרת */}
      {/* <Route path="/profile" element={<Profile />} /> */}

      {user?.role === "admin" && (
        <Route path="/admin" element={<AdminPanel user={user} />} />
      )}
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
            <BackButton />     
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
