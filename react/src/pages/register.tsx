import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../style/register.css';

const Register = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:4000/api/register', {
        email,
        username,
        password,
      });
      setMessage('נרשמת בהצלחה!');
      setTimeout(() => {
      navigate('/login');
      }, 2000);

    } catch (err) {
      setMessage('שגיאה בהרשמה');
    }
  };

  return (
    <div className="register-container">
    <div className='register-form'>
      <h2>הרשמה</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="אימייל"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="שם משתמש"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="סיסמה"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">הרשם</button>
      </form>
      <p>{message}</p>
      <p>כבר יש לך חשבון? <Link to="/login">התחבר כאן</Link></p>
    </div>
    </div>
  );
};

export default Register;
