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

// --- HÀM MỚI: Dịch mã lỗi Firebase ---
const getFirebaseAuthErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/invalid-credential':
      return 'Sai email hoặc mật khẩu. Vui lòng thử lại.';
    case 'auth/invalid-email':
      return 'Địa chỉ email không hợp lệ.';
    case 'auth/user-not-found':
      return 'Không tìm thấy tài khoản với email này.';
    case 'auth/wrong-password':
      return 'Sai mật khẩu. Vui lòng thử lại.';
    case 'auth/email-already-in-use':
      return 'Email này đã được sử dụng cho tài khoản khác.';
    case 'auth/weak-password':
      return 'Mật khẩu phải có ít nhất 6 ký tự.';
    case 'auth/too-many-requests':
      return 'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.';
    case 'auth/popup-closed-by-user':
      return 'Bạn đã đóng cửa sổ đăng nhập Google.';
    default:
      // Trả về thông báo gốc nếu không nhận diện được mã lỗi
      return errorCode || 'Đã xảy ra lỗi không xác định.';
  }
};
// ------------------------------------

function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const [error, setError] = useState(''); // <-- SỬA: Xóa state lỗi này
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // setError(''); // <-- SỬA: Xóa
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        addNotification('Đăng nhập thành công!', 'success'); // Thêm type 'success'
        navigate('/'); // Chuyển về trang chủ
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        addNotification('Đăng ký thành công! Đang tự động đăng nhập...', 'success');
        navigate('/'); // Chuyển về trang chủ
      }
    } catch (err) {
      // setError(err.message); // <-- SỬA: Xóa
      // --- SỬA: Dùng addNotification ---
      const message = getFirebaseAuthErrorMessage(err.code);
      addNotification(message, 'error');
      // --------------------------------
    }
  };

  const handleGoogleSignIn = async () => {
    // setError(''); // <-- SỬA: Xóa
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      addNotification('Đăng nhập với Google thành công!', 'success');
      navigate('/');
    } catch (err) {
      // setError(err.message); // <-- SỬA: Xóa
      // --- SỬA: Dùng addNotification ---
      const message = getFirebaseAuthErrorMessage(err.code);
      addNotification(message, 'error');
      // --------------------------------
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
          
          {/* --- SỬA: Xóa dòng hiển thị lỗi --- */}
          {/* {error && <p className="error-message">{error}</p>} */}
          
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