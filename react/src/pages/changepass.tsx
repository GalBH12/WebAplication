import { useState } from 'react';
import '../style/changepass.css';
import { changePassword } from '../lib/auth';

/**
 * ChangePassword
 *
 * - Simple form that lets a logged-in user change their password.
 * - Reads the current username from localStorage ("user" item).
 * - Calls `changePassword(username, oldPassword, newPassword)` via your API layer.
 * - Shows loading state and a status message.
 */
const ChangePassword = () => {
  // ===== Local state =====
  const [oldPassword, setOldPassword] = useState(''); // current password input
  const [newPassword, setNewPassword] = useState(''); // new password input
  const [message, setMessage] = useState('');          // status / error message
  const [loading, setLoading] = useState(false);       // submit in-flight flag

  /**
   * Submit handler:
   * - Prevents double submit while `loading`
   * - Loads user from localStorage to get `username`
   * - Calls API and updates UI (message + clears inputs)
   */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    try {
      setMessage('');
      setLoading(true);

      // Pull user (and username) from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.username) {
        setMessage('the user is not logged in');
        return;
      }

      // API call: change the password
      await changePassword(user.username, oldPassword, newPassword);

      // Success UI
      setMessage('the password has been changed successfully');
      setOldPassword('');
      setNewPassword('');
    } catch (error: any) {
      // Show server-provided error if available
      setMessage(error?.response?.data?.error || 'error changing password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-container">
      <h2>Changing Password</h2>

      {/* Form for old/new passwords */}
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

      {/* Status / error message */}
      <p>{message}</p>
    </div>
  );
};

export default ChangePassword;
