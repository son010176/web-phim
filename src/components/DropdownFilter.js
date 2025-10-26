// src/components/DropdownFilter.js (Đã sửa logic gom nhóm tiếng Việt)

import React, { useState, useEffect, useRef, useMemo } from 'react';
import './DropdownFilter.css'; 
import { ReactComponent as ChevronIcon } from '../assets/icons/chevron-down-solid-full.svg';
import { ReactComponent as FilterIcon } from '../assets/icons/filter-solid-full.svg';

function DropdownFilter({ genres, selectedGenres, onGenreToggle, isDisabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null); 

  const toggleDropdown = () => {
    if (isDisabled) return;
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  useEffect(() => {
    if (isDisabled) {
      setIsOpen(false);
    }
  }, [isDisabled]);

  // --- LOGIC GOM NHÓM MỚI (HỖ TRỢ TIẾNG VIỆT) ---
  const groupedGenres = useMemo(() => {
    const safeGenres = Array.isArray(genres) ? genres : [];
    
    const groups = {}; // { A: [], B: [], ... }
    const otherGroup = []; // [ "1v4", ... ]
    
    // Chuẩn Regex cho ký tự Latin A-Z
    const latinAZRegex = /^[A-Z]$/;

    safeGenres.forEach(genre => {
      const firstChar = genre.charAt(0);
      
      // 1. Chuẩn hóa: 'Ẩ' -> 'A', 'Đ' -> 'D', 'Ở' -> 'O'
      const normalized = firstChar
        .normalize('NFD') // Tách dấu: 'Ẩ' -> 'A' + '̉'
        .replace(/[\u0300-\u036f]/g, '') // Xóa dấu: 'A' + '̉' -> 'A'
        .replace('Đ', 'D') // Xử lý 'Đ'
        .replace('đ', 'd');
      
      // 2. Lấy ký tự đầu đã chuẩn hóa và viết hoa
      const baseChar = normalized.charAt(0).toUpperCase();

      // 3. Kiểm tra xem ký tự đầu có phải A-Z không
      if (latinAZRegex.test(baseChar)) {
        if (!groups[baseChar]) {
          groups[baseChar] = [];
        }
        groups[baseChar].push(genre); // Gom vào nhóm (ví dụ: 'Ẩm thực' vào A)
      } else {
        // 4. Nếu là số (1v4) hoặc ký tự lạ, cho vào nhóm "Khác"
        otherGroup.push(genre);
      }
    });
    
    // Lấy các ký tự nhóm A-Z và sắp xếp
    const sortedKeys = Object.keys(groups).sort();
    
    // Nhóm "Khác" đã được sắp xếp từ hook (do localeCompare)
    
    return {
      sortedKeys, // ["A", "B", "C"...]
      groups,     // { A: ["ABO", "Anh em...", "Ẩm thực..."], D: ["Dân quốc", "Dạy chồng...", "Đoàn sủng..."] }
      otherGroup  // ["1v4", "80s"...]
    };
    
  }, [genres]);
  // --- KẾT THÚC LOGIC GOM NHÓM ---

  // Lấy các nhóm đã xử lý
  const { sortedKeys, groups, otherGroup } = groupedGenres;

  // Hiển thị text cho các lựa chọn hiện tại (Giữ nguyên)
  const displaySelected = () => {
    if (!selectedGenres || selectedGenres.includes('Tất cả') || selectedGenres.length === 0) {
      return 'Tất cả';
    }
    if (selectedGenres.length === 1) {
      return selectedGenres[0];
    }
    return `${selectedGenres.length} thể loại`;
  };

  // --- RENDER LOGIC (Giữ nguyên cấu trúc HTML) ---
  return (
    <div className="dropdown-filter" ref={dropdownRef}>
      <div className={`dropdown-display ${isDisabled ? 'disabled' : ''}`} onClick={toggleDropdown}>
        <FilterIcon className="dropdown-icon" />
        <span className="dropdown-label">Lọc theo:</span>
        <span className="dropdown-selected-text">{displaySelected()}</span>
        <ChevronIcon className={`dropdown-chevron ${isOpen ? 'expanded' : ''}`} />
      </div>

      {isOpen && (
        <div className="dropdown-panel">
          
          {/* --- 1. NÚT "TẤT CẢ" (Luôn ở trên cùng) --- */}
          <div className="filter-options-group">
             <div className="filter-options">
                <button
                  key="Tất cả"
                  className={`filter-button ${selectedGenres.includes('Tất cả') ? 'active' : ''}`}
                  onClick={() => onGenreToggle('Tất cả')}
                >
                  Tất cả
                </button>
             </div>
          </div>

          {/* --- 2. CÁC NHÓM A-Z --- */}
          {sortedKeys.map(key => (
            <div key={key} className="filter-options-group">
              <h4 className="filter-group-heading">{key}</h4>
              <div className="filter-options">
                {/* groups[key] đã được sắp xếp đúng thứ tự tiếng Việt 
                  (ví dụ: 'Dân quốc', 'Duyên phận', 'Đoàn sủng', 'Đổi chồng')
                  nhờ `localeCompare('vi')` trong useMovieFilter.js
                */}
                {groups[key].map(genre => {
                  const isActive = selectedGenres.includes(genre);
                  return (
                    <button
                      key={genre}
                      className={`filter-button ${isActive ? 'active' : ''}`}
                      onClick={() => onGenreToggle(genre)}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          
          {/* --- 3. NHÓM "KHÁC" (Chỉ hiện nếu có) --- */}
          {otherGroup.length > 0 && (
            <div key="other" className="filter-options-group">
              <h4 className="filter-group-heading">Khác</h4>
              <div className="filter-options">
                {otherGroup.map(genre => {
                  const isActive = selectedGenres.includes(genre);
                  return (
                    <button
                      key={genre}
                      className={`filter-button ${isActive ? 'active' : ''}`}
                      onClick={() => onGenreToggle(genre)}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default DropdownFilter;