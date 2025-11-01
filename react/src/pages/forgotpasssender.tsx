import { useState } from "react";
import "../style/login.css"; // reuse styles

import { sendForgot } from "../lib/auth";

/**
 * ForgotPassSender - עמוד בקשה לאיפוס סיסמה (עברית, RTL)
 */
export default function ForgotPassSender() {
  // ===== Local state =====
  const [email, setEmail] = useState(""); // input email
  const [msg, setMsg] = useState(""); // status or error message
  const [loading, setLoading] = useState(false); // submit in-progress flag

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setMsg("");
    setLoading(true);
    try {
      await sendForgot(email);
      setMsg("נשלח קישור לאיפוס הסיסמה למייל שלך");
    } catch (err: any) {
      setMsg(err?.response?.data?.error || "השליחה נכשלה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" dir="rtl" style={{ direction: "rtl", textAlign: "right" }}>
      <div className="login-form">
        <h2>איפוס סיסמה</h2>

        {/* Status / error message */}
        {msg && <p className="error-message">{msg}</p>}

        {/* Form for entering email */}
        <form onSubmit={submit}>
          <input
            type="email"
            placeholder="אימייל"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            dir="rtl"
          />
          <button type="submit" disabled={loading}>
            {loading ? "שולח…" : "שלח קישור לאיפוס"}
          </button>
        </form>
      </div>
    </div>
  );
}
