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

  /**
   * Handle login form submission:
   * - Prevent multiple submits when already loading
   * - Clear message, set loading
   * - Call loginWithCredentials
   * - Navigate to "/" on success
   * - Show error message on failure
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setMsg("");
    setLoading(true);
    try {
      await loginWithCredentials(username, password);
      navigate("/");
    } catch (err: any) {
      // Use server-provided error if available
      const serverMsg = err?.response?.data?.error;
      if (serverMsg === "Your account is suspended.") {
        setMsg("Your account is suspended from this site.");
      } else {
        setMsg(serverMsg || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Login</h2>

        {/* Displays error/info message */}
        {msg && <p className="error-message">{msg}</p>}

        {/* Login form */}
        <form className="auth-card" onSubmit={handleSubmit}>
          {/* Controlled username input */}
          <input
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />

          {/* Controlled password input */}
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {/* Submit button reflects loading state */}
          <button type="submit" disabled={loading}>
            {loading ? "Connecting..." : "connect"}
          </button>
        </form>

        {/* Helpful links */}
        <p>
          you don't have account <Link to="/register">register here</Link>
        </p>
        <p>
          did you forget your password?{" "}
          <Link to="/forgotpasssender">reset password</Link>
        </p>
      </div>
    </div>
  );
}
