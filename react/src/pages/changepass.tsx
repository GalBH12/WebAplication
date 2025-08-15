import { useState } from 'react';
import '../style/changepass.css';
import { changePassword } from '../lib/auth';

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    try {
      setMessage('');
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.username) {
        setMessage('the user is not logged in');
        return;
      }

      await changePassword(user.username, oldPassword, newPassword);

      setMessage('the password has been changed successfully');
      setOldPassword('');
      setNewPassword('');
    } catch (error: any) {
      setMessage(error?.response?.data?.error || 'error changing password');
    } finally {
      setLoading(false);
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
          autoComplete="current-password"
        />
        <input
          type="password"
          placeholder="new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'change password'}
        </button>
      </form>
      <p>{message}</p>
    </div>
  );
};

export default ChangePassword;
