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
        setMessage('the user is not logged in');
        return;
      }

      await axios.post('http://localhost:4000/api/resetpass', {
        username: user.username,
        oldPassword,
        newPassword,
      });

      setMessage('the password has been changed successfully');
      setOldPassword('');
      setNewPassword('');
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'error changing password');
    }
  };

  return (
    <div className="change-password-container">
      <h2>Changing Password</h2>
      <form onSubmit={handleChangePassword}>
        <input
          type="password"
          placeholder="current password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button type="submit">change password</button>
      </form>
      <p>{message}</p>
    </div>
  );
};

export default ChangePassword;