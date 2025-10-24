// src/components/Pagination.js (Đã nâng cấp, hỗ trợ isDisabled)

import React, { useState, useEffect } from 'react';
import './Pagination.css';

// 1. Nhận thêm prop 'isDisabled', mặc định là false
function Pagination({ currentPage, totalPages, onPageChange, isDisabled = false }) {
  // State để quản lý giá trị của ô nhập liệu
  const [inputValue, setInputValue] = useState(currentPage);

  // Effect để đồng bộ giá trị ô nhập liệu khi trang thay đổi từ các nút bấm
  useEffect(() => {
    setInputValue(currentPage);
  }, [currentPage]);

  // --- CÁC HÀM XỬ LÝ SỰ KIỆN ---

  const handleGoToFirst = () => {
    // 2. Thêm kiểm tra: Không làm gì nếu bị vô hiệu hóa
    if (isDisabled) return;
    onPageChange(1);
  };
  
  const handleGoToLast = () => {
    // 2. Thêm kiểm tra: Không làm gì nếu bị vô hiệu hóa
    if (isDisabled) return;
    onPageChange(totalPages);
  };
  
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
    // 2. Thêm kiểm tra: Không làm gì nếu bị vô hiệu hóa
    if (isDisabled) return; 
    
    if (e.key === 'Enter') {
      const pageNumber = parseInt(inputValue, 10);
      if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
        onPageChange(pageNumber);
      } else {
        setInputValue(currentPage);
      }
    }
  };
  
  // Xử lý khi click ra ngoài (onBlur)
  const handleInputBlur = () => {
    // Chỉ reset về trang hiện tại, không làm gì khác
    setInputValue(currentPage);
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="pagination-container">
      {/* NÚT VỀ TRANG ĐẦU */}
      <button 
        onClick={handleGoToFirst} 
        // 3. Logic vô hiệu hóa: (Trang 1) HOẶC (Bị vô hiệu hóa từ bên ngoài)
        disabled={currentPage === 1 || isDisabled}
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
          onBlur={handleInputBlur} // Reset khi người dùng click ra ngoài
          // 3. Vô hiệu hóa ô nhập liệu khi ở Chế độ Server
          disabled={isDisabled}
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
        // 3. Logic vô hiệu hóa: (Trang cuối) HOẶC (Bị vô hiệu hóa từ bên ngoài)
        disabled={currentPage === totalPages || isDisabled}
        className="pagination-button"
        title="Trang cuối"
      >
        &raquo;
      </button>
    </div>
  );
}

export default Pagination;