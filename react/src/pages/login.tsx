import { useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { Link, useNavigate } from "react-router-dom";
import "../style/login.css";

export default function Login() {
  const { login } = useAuth();            // pulls login(user, { token }) from context
  const navigate = useNavigate();

  // local form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setMsg("");
    setLoading(true);

    try {
      // server expects { username, password } on port 4000
      const res = await axios.post("http://localhost:4000/api/login", { username, password });

      console.log("LOGIN_RES:", res.data);

      const { token, user } = res.data;

      // save user + token via AuthContext (also stores in localStorage)
      login(user, { token });

      // ensure future axios requests include the Authorization header
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // go to home (Map)
      navigate("/");
    } catch (err: any) {
      setMsg(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Login</h2>

        {/* error message */}
        {msg && <p className="error-message">{msg}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button type="submit" disabled={loading}>
            {loading ? "Connecting..." : "connect"}
          </button>
        </form>

        <p>
          you don't have account <Link to="/register">register here</Link>
        </p>
        <p>
          did you forget your password? <Link to="/forgotpasssender">reset password</Link>
        </p>
      </div>
    </div>
  );
}