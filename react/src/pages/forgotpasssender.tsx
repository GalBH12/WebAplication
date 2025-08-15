import { useState } from "react";
import "../style/login.css"; // reuse styles or create a dedicated one
import { sendForgot } from "../lib/auth";

export default function ForgotPassSender() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setMsg("");
    setLoading(true);
    try {
      await sendForgot(email);
      setMsg("reset link sent to your email");
    } catch (err: any) {
      setMsg(err?.response?.data?.error || "send failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Forgot Password</h2>
        {msg && <p className="error-message">{msg}</p>}
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