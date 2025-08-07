import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './AuthContext';
import '../style/Login.css';

const Login = () => 
  {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:4000/api/login', {
        username,
        password,
      });

      const token = res.data.token;
      localStorage.setItem('token', token);

      // עדכן את הקונטקסט
      login({ username });
      navigate('/');
    } catch (err) {
      setMessage('שגיאה בהתחברות');
    }
  };

  return (
    <div className="login-container">
      <div className='login-form'>
        <h2>התחברות</h2>
        <form onSubmit={handleLogin}>
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
          <button type="submit">התחבר</button>
        </form>
        <p>{message}</p>
      <p> אין לך חשבון? <Link to="/register">הירשם כאן</Link></p>
      <p>שכחת סיסמה? <Link to="/forgotpasssender">אפס סיסמה</Link></p>
      </div>
    </div>
  );
};

export default Login;