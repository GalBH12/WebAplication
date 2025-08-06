import { useState } from "react";
import axios from "axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:4000/api/forgotpass", { email });
      setMessage("קישור לאיפוס סיסמה נשלח למייל שלך");
      setError("");
    } catch (err) {
      setError("המייל לא נמצא או שגיאה בשרת");
      setMessage("");
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "400px", margin: "auto" }}>
      <h2>שכחתי סיסמה</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="הכנס כתובת מייל"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", padding: "8px", marginBottom: "1rem" }}
        />
        <button type="submit" style={{ padding: "8px 16px" }}>
          שלח קישור איפוס
        </button>
      </form>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default ForgotPassword;
