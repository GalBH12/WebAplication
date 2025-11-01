import "../style/auth.css";
import { useState } from "react";
import { useAuth } from "./AuthContext";
import { Link, useNavigate } from "react-router-dom";
import "../style/login.css";

/**
 * Login
 *
 * - Renders a login form with username + password fields.
 * - Calls `loginWithCredentials` from AuthContext on submit.
 * - Navigates to home ("/") if login succeeds.
 * - Displays error messages from the server or a fallback message.
 * - Provides links to register and forgot password flows.
 */
export default function Login() {
  const { loginWithCredentials } = useAuth();
  const navigate = useNavigate();

  // ===== Local form state =====
  const [username, setUsername] = useState(""); // controlled input
  const [password, setPassword] = useState(""); // controlled input
  const [msg, setMsg] = useState("");           // error/status message
  const [loading, setLoading] = useState(false); // submit in-flight flag

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setMsg("");
    setLoading(true);
    try {
      await loginWithCredentials(username, password);
      navigate("/");
    } catch (err: any) {
      const serverMsg = err?.response?.data?.error;
      if (serverMsg === "Your account is suspended.") {
        setMsg("החשבון שלך מושעה מהאתר.");
      } else {
        setMsg(serverMsg || "התחברות נכשלה");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>התחברות</h2>

        {/* Displays error/info message */}
        {msg && <p className="error-message">{msg}</p>}

        {/* Login form */}
        <form className="auth-card" onSubmit={handleSubmit}>
          {/* Controlled username input */}
          <input
            type="text"
            placeholder="שם משתמש"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            dir="rtl"
          />

          {/* Controlled password input */}
          <input
            type="password"
            placeholder="סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            dir="rtl"
          />

          {/* Submit button reflects loading state */}
          <button type="submit" disabled={loading}>
            {loading ? "מתחבר…" : "התחבר"}
          </button>
        </form>

        {/* Helpful links */}
        <p>אין לך חשבון? <Link to="/register">הרשם כאן</Link></p>
        <p>שכחת סיסמה? <Link to="/forgotpasssender">איפוס סיסמה</Link></p>
      </div>
    </div>
  );
}
