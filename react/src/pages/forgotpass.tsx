import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../style/login.css";
import { resetWithToken } from "../lib/auth";

export default function ResetPassword() {
  const { id, token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

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
      setMsg(err?.response?.data?.error || "reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Reset Password</h2>
        {msg && <p className="error-message">{msg}</p>}
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
