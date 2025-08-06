import { useState } from 'react';
import axios from 'axios';
import '../style/changepass.css';

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.username) {
        setMessage('משתמש לא מחובר');
        return;
      }

      await axios.post('http://localhost:4000/api/change-password', {
        username: user.username,
        oldPassword,
        newPassword,
      });

      setMessage('הסיסמה שונתה בהצלחה');
      setOldPassword('');
      setNewPassword('');
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'שגיאה בשינוי הסיסמה');
    }
  };

  return (
    <div className="change-password-container">
      <h2>שינוי סיסמה</h2>
      <form onSubmit={handleChangePassword}>
        <input
          type="password"
          placeholder="סיסמה נוכחית"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="סיסמה חדשה"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button type="submit">שנה סיסמה</button>
      </form>
      <p>{message}</p>
    </div>
  );
};

export default ChangePassword;