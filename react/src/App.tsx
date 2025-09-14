import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import Map from "./pages/Map";
import Register from "./pages/register";
import Login from "./pages/login";
import ChangePassword from "./pages/changepass";
import ForgotPasswordSender from "./pages/forgotpasssender";
import ResetPassword from "./pages/forgotpass";
import Tracks from "./pages/tracks";

// Components
import AdminPanel from "./components/AdminPanel";
import { AuthProvider, useAuth } from "./pages/AuthContext";
import BackButton from "./components/BackButton";
import ChatDrawer from "./components/ChatDrawer";

/* ============================
   AppRoutes – contains all route definitions
   AuthProvider must wrap this for `useAuth` to work
   ============================ */
function AppRoutes() {
  const { user } = useAuth(); // Get user from context (to check role, etc.)

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Map />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/changepass" element={<ChangePassword />} />
      <Route path="/forgotpasssender" element={<ForgotPasswordSender />} />
      <Route path="/forgotpass/:id/:token" element={<ResetPassword />} />
      <Route
        path="/chat"
        element={
          <ChatDrawer
            open={false}
            onClose={function (): void {
              throw new Error("Function not implemented.");
            }}
          />
        }
      />
      <Route path="/tracks" element={<Tracks />} />

      {/* Example: Profile page could be added here later */}
      {/* <Route path="/profile" element={<Profile />} /> */}

      {/* Protected route: only visible to admin users */}
      {user?.role === "admin" && (
        <Route path="/admin" element={<AdminPanel user={user} />} />
      )}
    </Routes>
  );
}

/* ============================
   App – wraps everything with providers and router
   ============================ */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Persistent back button available on all pages */}
        <BackButton />
        {/* Route definitions */}
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
