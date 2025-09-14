import "../style/auth.css";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../style/register.css";
import { register } from "../lib/auth"; // עדכנתי ל-func החדשה (alias ל-registerUser)

export default function Register() {
  const navigate = useNavigate();

  // כל שדות הטופס
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirm: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    birthDate: "", // YYYY-MM-DD
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
      setMsg("username, email and password are required");
      return;
    }
    if (form.password !== form.confirm) {
      setMsg("passwords do not match");
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
        birthDate: form.birthDate || undefined, // "YYYY-MM-DD"
      });
      setMsg("registered successfully");
      navigate("/login");
    } catch (err: any) {
      setMsg(err?.response?.data?.error || "register failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
   <form className="auth-card register-form" onSubmit={handleRegister}>

        <h2>Register</h2>

        {msg && <p className="error-message">{msg}</p>}

        <input
          type="text"
          name="firstName"
          placeholder="First name"
          value={form.firstName}
          onChange={onChange}
        />

        <input
          type="text"
          name="lastName"
          placeholder="Last name"
          value={form.lastName}
          onChange={onChange}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={onChange}
          required
          autoComplete="email"
        />

        <input
          type="tel"
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={onChange}
        />

        <input
          type="date"
          name="birthDate"
          placeholder="Birth date"
          value={form.birthDate}
          onChange={onChange}
        />

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={onChange}
          required
          autoComplete="username"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={onChange}
          required
          autoComplete="new-password"
        />

        <input
          type="password"
          name="confirm"
          placeholder="Confirm password"
          value={form.confirm}
          onChange={onChange}
          required
          autoComplete="new-password"
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Register"}
        </button>

        <p>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
