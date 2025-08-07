import { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {
  const { id, token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("הסיסמאות אינן תואמות");
      return;
    }
    try {
      await axios.post(`http://localhost:4000/api/resetpass/${id}/${token}`, {
        password,
      });
      setMessage("הסיסמה שונתה בהצלחה");
      setError("");
    } catch (err) {
      setError("קישור לא תקין או שפג תוקפו");
      setMessage("");
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "400px", margin: "auto" }}>
      <h2>איפוס סיסמה</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="הכנס סיסמה חדשה"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", padding: "8px", marginBottom: "1rem" }}
        />
        <input
          type="password"
          placeholder="אמת סיסמה חדשה"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          style={{ width: "100%", padding: "8px", marginBottom: "1rem" }}
        />
        <button type="submit" style={{ padding: "8px 16px" }}>
          אפס סיסמה
        </button>
      </form>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default ResetPassword;