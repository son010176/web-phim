// src/components/Toast.js
import React, { useEffect } from 'react';
import './Toast.css';

function Toast({ message, type, onClose }) {
  // Tự động đóng thông báo sau 3 giây
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    // Dọn dẹp timer khi component bị hủy
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) {
    return null;
  }

  return (
    <div className={`toast-container ${type}`}>
      <span className="toast-message">{message}</span>
      <button className="toast-close-btn" onClick={onClose}>&times;</button>
    </div>
  );
}

export default Toast;