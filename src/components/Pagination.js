// src/components/Pagination.js (Đã nâng cấp Icon)

import React, { useState, useEffect } from 'react';
import './Pagination.css';

// --- BƯỚC 1: IMPORT CÁC ICON MỚI ---
// (Bạn cần đảm bảo có các file SVG này trong 'src/assets/icons/')
import { ReactComponent as FirstIcon } from '../assets/icons/angles-left-solid-full.svg';
import { ReactComponent as PrevIcon } from '../assets/icons/angle-left-solid-full.svg';
import { ReactComponent as NextIcon } from '../assets/icons/angle-right-solid-full.svg';
import { ReactComponent as LastIcon } from '../assets/icons/angles-right-solid-full.svg';

function Pagination({ currentPage, totalPages, onPageChange, isDisabled = false }) {
  const [inputValue, setInputValue] = useState(currentPage);

  useEffect(() => {
    setInputValue(currentPage);
  }, [currentPage]);

  // --- CÁC HÀM XỬ LÝ SỰ KIỆN (Giữ nguyên) ---

  const handleGoToFirst = () => {
    if (isDisabled) return;
    onPageChange(1);
  };
  
  const handleGoToLast = () => {
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

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e) => {
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
  
  const handleInputBlur = () => {
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
        disabled={currentPage === 1 || isDisabled}
        className="pagination-button"
        title="Trang đầu"
      >
        {/* --- BƯỚC 2: THAY THẾ TEXT BẰNG ICON --- */}
        <FirstIcon />
      </button>
      
      {/* NÚT LÙI 1 TRANG */}
      <button 
        onClick={handlePrevious} 
        disabled={currentPage === 1}
        className="pagination-button"
        title="Trang trước"
      >
        {/* --- BƯỚC 2: THAY THẾ TEXT BẰNG ICON --- */}
        <PrevIcon />
      </button>
      
      {/* KHU VỰC HIỂN THỊ THÔNG TIN VÀ NHẬP LIỆU (Giữ nguyên) */}
      <div className="pagination-info">
        <span>Trang</span>
        <input 
          type="number"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputBlur}
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
        {/* --- BƯỚC 2: THAY THẾ TEXT BẰNG ICON --- */}
        <NextIcon />
      </button>

      {/* NÚT ĐẾN TRANG CUỐI */}
      <button 
        onClick={handleGoToLast} 
        disabled={currentPage === totalPages || isDisabled}
        className="pagination-button"
        title="Trang cuối"
      >
        {/* --- BƯỚC 2: THAY THẾ TEXT BẰNG ICON --- */}
        <LastIcon />
      </button>
    </div>
  );
}

export default Pagination;