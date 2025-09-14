// Styles for shared auth components (card, inputs, etc.)
import "../style/auth.css";
// React state management
import { useState } from "react";
// Router utilities: navigate (redirect) + Link (client-side anchor)
import { useNavigate, Link } from "react-router-dom";
// Page-specific styles
import "../style/register.css";
// API wrapper to register a new user (alias for registerUser)
import { register } from "../lib/auth"; // עדכנתי ל-func החדשה (alias ל-registerUser)

/**
 * Register page component.
 * Renders a form that collects basic account info and submits it to the backend.
 * On success -> redirects user to /login
 */
export default function Register() {
  const navigate = useNavigate();

  // All form fields tracked in a single object state
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

  // UX state: message to the user (errors/success)
  const [msg, setMsg] = useState("");
  // Prevent duplicate submissions & show loading indicator
  const [loading, setLoading] = useState(false);

  // Generic input handler for all <input name="..."> fields
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  // Submit handler: validates inputs, calls API, navigates on success
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setMsg("");
    // Basic required fields validation
    if (!form.username || !form.email || !form.password) {
      setMsg("username, email and password are required");
      return;
    }
    // Password confirmation check
    if (form.password !== form.confirm) {
      setMsg("passwords do not match");
      return;
    }
    // Phone number validation: must be exactly 10 digits
    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      setMsg("phone number must be exactly 10 digits");
      return;
    }

    setLoading(true);
    try {
      // Call backend to create a new account
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
      // Redirect to login after successful registration
      navigate("/login");
    } catch (err: any) {
      // Prefer server-provided error message when available
      setMsg(err?.response?.data?.error || "register failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      {/* Semantic form element with submit handler */}
      <form className="auth-card register-form" onSubmit={handleRegister}>
        <h2>Register</h2>

        {/* Inline feedback area for errors/success messages */}
        {msg && <p className="error-message">{msg}</p>}

        {/* Optional profile fields (can be filled later as well) */}
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

        {/* Required contact + login credentials */}
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

        {/* Native date picker; stored as ISO date string */}
        <input
          type="date"
          name="birthDate"
          placeholder="Birth date"
          value={form.birthDate}
          onChange={onChange}
        />

        {/* Unique username */}
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={onChange}
          required
          autoComplete="username"
        />

        {/* Password + confirmation (client-side check before submit) */}
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

        {/* Submit button reflects loading state */}
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Register"}
        </button>

        {/* Link to login for existing users */}
        <p>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
