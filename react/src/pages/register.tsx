// Styles for shared auth components (card, inputs, etc.)
import "../style/auth.css";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../style/register.css";
import { register } from "../lib/auth";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
    confirm: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    birthDate: "",
  });

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setMsg("");
    if (!form.username || !form.email || !form.password) {
      setMsg("שם משתמש, אימייל וסיסמה דרושים");
      return;
    }
    if (form.password !== form.confirm) {
      setMsg("הסיסמאות לא תואמות");
      return;
    }
    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      setMsg("מספר טלפון חייב להכיל בדיוק 10 ספרות");
      return;
    }

    setLoading(true);
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        phone: form.phone || undefined,
        birthDate: form.birthDate || undefined,
      });
      setMsg("נרשמת בהצלחה");
      navigate("/login");
    } catch (err: any) {
      setMsg(err?.response?.data?.error || "ההרשמה נכשלה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container" dir="rtl" style={{ direction: "rtl", textAlign: "right" }}>
      <form className="auth-card register-form" onSubmit={handleRegister}>
        <h2>הרשמה</h2>

        {msg && <p className="error-message">{msg}</p>}

        <input
          type="text"
          name="firstName"
          placeholder="שם פרטי"
          value={form.firstName}
          onChange={onChange}
          dir="rtl"
        />

        <input
          type="text"
          name="lastName"
          placeholder="שם משפחה"
          value={form.lastName}
          onChange={onChange}
          dir="rtl"
        />

        <input
          type="email"
          name="email"
          placeholder="אימייל"
          value={form.email}
          onChange={onChange}
          required
          autoComplete="email"
          dir="rtl"
        />

        <input
          type="tel"
          name="phone"
          placeholder="טלפון"
          value={form.phone}
          onChange={onChange}
          dir="rtl"
        />

        <input
          type="date"
          name="birthDate"
          placeholder="תאריך לידה"
          value={form.birthDate}
          onChange={onChange}
          dir="rtl"
        />

        <input
          type="text"
          name="username"
          placeholder="שם משתמש"
          value={form.username}
          onChange={onChange}
          required
          autoComplete="username"
          dir="rtl"
        />

        <input
          type="password"
          name="password"
          placeholder="סיסמה"
          value={form.password}
          onChange={onChange}
          required
          autoComplete="new-password"
          dir="rtl"
        />

        <input
          type="password"
          name="confirm"
          placeholder="אישור סיסמה"
          value={form.confirm}
          onChange={onChange}
          required
          autoComplete="new-password"
          dir="rtl"
        />

        <button type="submit" disabled={loading}>
          {loading ? "נרשם…" : "הרשם"}
        </button>

        <p>
          כבר יש לך חשבון? <Link to="/login">התחבר</Link>
        </p>
      </form>
    </div>
  );
}
