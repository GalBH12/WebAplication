import { useState } from "react";
import { useAuth } from "./AuthContext";
import { Link, useNavigate } from "react-router-dom";
import "../style/login.css";

export default function Login() {
  const { loginWithCredentials } = useAuth();
  const navigate = useNavigate();

  // local form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Handles the login form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setMsg("");
    setLoading(true);
    try {
      await loginWithCredentials(username, password);
      navigate("/");
    } catch (err: any) {
      // Show a friendly message on error
      const serverMsg = err?.response?.data?.error || "Login failed";
      setMsg(serverMsg);
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

        {/* Hook up the handler to the form */}
        <form onSubmit={handleSubmit}>
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
