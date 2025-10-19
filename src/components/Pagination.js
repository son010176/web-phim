// src/components/Pagination.js (Đã nâng cấp)

import React, { useState, useEffect } from 'react';
import './Pagination.css';

function Pagination({ currentPage, totalPages, onPageChange }) {
  // State để quản lý giá trị của ô nhập liệu
  const [inputValue, setInputValue] = useState(currentPage);

  // Effect để đồng bộ giá trị ô nhập liệu khi trang thay đổi từ các nút bấm
  useEffect(() => {
    setInputValue(currentPage);
  }, [currentPage]);

  // --- CÁC HÀM XỬ LÝ SỰ KIỆN ---

  const handleGoToFirst = () => onPageChange(1);
  const handleGoToLast = () => onPageChange(totalPages);
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };
  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Cập nhật state khi người dùng gõ vào ô input
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // Xử lý khi người dùng nhấn Enter trong ô input
  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      const pageNumber = parseInt(inputValue, 10);
      // Kiểm tra xem số nhập vào có hợp lệ không
      if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
        onPageChange(pageNumber);
      } else {
        // Nếu không hợp lệ, reset ô input về trang hiện tại
        setInputValue(currentPage);
      }
    }
  };

  // Không hiển thị component nếu chỉ có 1 trang hoặc không có trang nào
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="pagination-container">
      {/* NÚT VỀ TRANG ĐẦU */}
      <button 
        onClick={handleGoToFirst} 
        disabled={currentPage === 1}
        className="pagination-button"
        title="Trang đầu"
      >
        &laquo;
      </button>
      
      {/* NÚT LÙI 1 TRANG */}
      <button 
        onClick={handlePrevious} 
        disabled={currentPage === 1}
        className="pagination-button"
        title="Trang trước"
      >
        &larr;
      </button>
      
      {/* KHU VỰC HIỂN THỊ THÔNG TIN VÀ NHẬP LIỆU */}
      <div className="pagination-info">
        <span>Trang</span>
        <input 
          type="number"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onBlur={() => setInputValue(currentPage)} // Reset khi người dùng click ra ngoài
          className="page-input"
        />
        <span>/ {totalPages}</span>
      </div>

      {/* NÚT TIẾN 1 TRANG */}
      <button 
        onClick={handleNext} 
        disabled={currentPage === totalPages}
        className="pagination-button"
        title="Trang sau"
      >
        &rarr;
      </button>

      {/* NÚT ĐẾN TRANG CUỐI */}
      <button 
        onClick={handleGoToLast} 
        disabled={currentPage === totalPages}
        className="pagination-button"
        title="Trang cuối"
      >
        &raquo;
      </button>
    </div>
  );
}

export default Pagination;