// src/components/ConfirmModal.js
import React from 'react';
import './ConfirmModal.css';

function ConfirmModal({ isOpen, onClose, onConfirm, title, children }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">{title || 'Xác nhận'}</h2>
        <div className="modal-body">
          {children}
        </div>
        <div className="modal-footer">
          <button className="modal-button cancel" onClick={onClose}>
            Hủy
          </button>
          <button className="modal-button confirm" onClick={onConfirm}>
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;