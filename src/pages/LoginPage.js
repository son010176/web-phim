// src/pages/LoginPage.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../firebase';
import { useNotification } from '../context/NotificationContext';
import './LoginPage.css';

function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        addNotification('Đăng nhập thành công!');
        navigate('/'); // Chuyển về trang chủ
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        addNotification('Đăng ký thành công! Đang tự động đăng nhập...');
        navigate('/'); // Chuyển về trang chủ
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      addNotification('Đăng nhập với Google thành công!');
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-form-wrapper">
        <h2>{isLogin ? 'Đăng nhập' : 'Đăng ký'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Mật khẩu</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="submit-btn">
            {isLogin ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </form>
        <button onClick={handleGoogleSignIn} className="google-signin-btn">
          Đăng nhập với Google
        </button>
        <p className="toggle-form-text">
          {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? ' Đăng ký ngay' : ' Đăng nhập'}
          </span>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;