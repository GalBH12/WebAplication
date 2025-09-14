import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../style/login.css";
import { resetWithToken } from "../lib/auth";

/**
 * ResetPassword
 *
 * - Page for resetting a forgotten password using a reset token from email.
 * - Extracts `id` and `token` from the URL params.
 * - Lets the user enter a new password and submit it to the API.
 * - On success, navigates to the login page.
 */
export default function ResetPassword() {
  // Params come from route: /resetpass/:id/:token
  const { id, token } = useParams();
  const navigate = useNavigate();

  // ===== Local state =====
  const [password, setPassword] = useState(""); // new password input
  const [msg, setMsg] = useState("");           // success or error message
  const [loading, setLoading] = useState(false); // in-flight flag

  /**
   * Handle form submit:
   * - Prevents multiple submits while loading
   * - Ensures id + token are present
   * - Calls API to reset password
   * - Navigates to login on success
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !id || !token) return;

    setMsg("");
    setLoading(true);
    try {
      await resetWithToken(id, token, password);
      setMsg("password updated");
      navigate("/login");
    } catch (err: any) {
      // Show server error if available
      setMsg(err?.response?.data?.error || "reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Reset Password</h2>

        {/* Error / status message */}
        {msg && <p className="error-message">{msg}</p>}

        {/* New password form */}
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <button type="submit" disabled={loading}>
            {loading ? "Updating..." : "update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
