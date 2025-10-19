// src/context/AuthContext.js

import React, { useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase'; // Import auth từ file firebase.js

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged là một listener của Firebase,
    // nó sẽ tự động chạy mỗi khi trạng thái đăng nhập thay đổi.
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe; // Dọn dẹp listener khi component bị unmount
  }, []);

  const value = {
    currentUser
  };

  // Chỉ render children khi đã xác định được trạng thái đăng nhập
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}