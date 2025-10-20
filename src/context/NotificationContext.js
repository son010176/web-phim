// src/context/NotificationContext.js
import React, { createContext, useState, useContext } from 'react';
import Toast from '../components/Toast';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [toast, setToast] = useState(null); // { message: '...', type: '...' }

  const addNotification = (message, type = 'success') => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </NotificationContext.Provider>
  );
}

// Custom hook để sử dụng context dễ dàng hơn
export const useNotification = () => {
  return useContext(NotificationContext);
};