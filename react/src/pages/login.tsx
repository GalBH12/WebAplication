import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../style/login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:4000/api/login', {
        username,
        password,
      });

      localStorage.setItem('token', res.data.token);
      setMessage('התחברת!');
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
        /><br/><br/>
        <button type="submit">התחבר</button>
      </form>
      <p>{message}</p>
      <p>אין לך חשבון? <Link to="/register">צור חשבון חדש</Link></p>
    </div>
    </div>
  );
};

export default Login;