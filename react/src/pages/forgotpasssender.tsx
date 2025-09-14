import { useState } from "react";
import "../style/login.css"; // reuse styles or create a dedicated one
import { sendForgot } from "../lib/auth";

/**
 * ForgotPassSender
 *
 * - Page for initiating a password reset.
 * - User enters their email, which is sent to the backend.
 * - If the email exists, the server sends a reset link.
 * - Displays status or error messages to the user.
 */
export default function ForgotPassSender() {
  // ===== Local state =====
  const [email, setEmail] = useState("");   // input email
  const [msg, setMsg] = useState("");       // status or error message
  const [loading, setLoading] = useState(false); // submit in-progress flag

  /**
   * Handle form submission:
   * - Prevent multiple submissions while loading
   * - Clear message and set loading
   * - Call API to send reset link
   * - Show success or error message
   */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setMsg("");
    setLoading(true);
    try {
      await sendForgot(email);
      setMsg("reset link sent to your email");
    } catch (err: any) {
      // Prefer server error if provided
      setMsg(err?.response?.data?.error || "send failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Forgot Password</h2>

        {/* Status / error message */}
        {msg && <p className="error-message">{msg}</p>}

        {/* Form for entering email */}
        <form onSubmit={submit}>
          <input
            type="email"
            placeholder="your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "send reset link"}
          </button>
        </form>
      </div>
    </div>
  );
}
