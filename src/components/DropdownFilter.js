
import React, { useState, useEffect, useRef } from 'react';
import './DropdownFilter.css'; // File CSS riêng cho component này
import { ReactComponent as ChevronIcon } from '../assets/icons/chevron-down-solid-full.svg';
import { ReactComponent as FilterIcon } from '../assets/icons/filter-solid-full.svg';

function DropdownFilter({ genres, selectedGenres, onGenreToggle, isDisabled }) {
  // State để quản lý trạng thái đóng/mở của dropdown
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null); // Ref để theo dõi thẻ div chính của component

  // Hàm để bật/tắt dropdown
  const toggleDropdown = () => {
    // CHỈ MỞ KHI KHÔNG BỊ VÔ HIỆU HÓA
    if (isDisabled) return;
    setIsOpen(!isOpen);
  };

  // Xử lý việc bấm ra ngoài để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    // Thêm event listener khi component được tạo
    document.addEventListener("mousedown", handleClickOutside);
    // Gỡ event listener khi component bị hủy để tránh rò rỉ bộ nhớ
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Tự động đóng panel nếu component bị disable (ví dụ: đang tải lại)
  useEffect(() => {
    if (isDisabled) {
      setIsOpen(false);
    }
  }, [isDisabled]);

  const safeGenres = Array.isArray(genres) ? genres : [];
  const allGenres = ['Tất cả', ...safeGenres];


  // const allGenres = ['Tất cả', ...genres];

  // Hiển thị text cho các lựa chọn hiện tại
  const displaySelected = () => {
    if (!selectedGenres || selectedGenres.includes('Tất cả') || selectedGenres.length === 0) {
      return 'Tất cả';
    }
    if (selectedGenres.length === 1) {
      return selectedGenres[0];
    }
    return `${selectedGenres.length} thể loại`;
  };

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
          <div className="filter-options">
            {allGenres.map(genre => {
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
  );
}

export default DropdownFilter;